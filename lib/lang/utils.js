var word = require('./word');
var profiler = require('./profiler');

function isFn(v) {
    return typeof v == 'function';
}

function readParserOptions(fn, seq, evaluator, there) {
    var found = false;
    var item = seq.__internal;
    if(item && item.type === 'number') {
        fn.arity = item.value;
        found = true;
    }
    if (!found) {
        fn.parse = buildParser(seq, evaluator, there);
    }
}

function buildParser(seq, evaluator, there) {
    var s = [];
    var preParams = [];
    var preNames = [];
    seq.next(function (item) {
        if (item.type == 'resource' && item.next && item.next.type == 'block') {
            var res = evaluator.eval(item.next.getSequence(), null, there);
            preNames.push(item.value);
            preParams.push(value({result: res}));
        } else if (item.type == 'resource' && item.value.charAt(0) === '@') {
            var name = item.value.substring(1);
            var r = there.resources[name];
            if (!r) {
                r = there.properties[name];
            }
            if (r) {
                preNames.push(name);
                preParams.push(r);
            } else {
                s.push(item);
            }
        } else if (item.type !== 'block') {
            s.push(item);
        }
    }, true);
    return function (obj, result, there) {
        var matched = true;
        var names = preNames.slice();
        var params = preParams.slice();
        s.forEach(function (item) {
            if (item && !obj) {
                matched = false;
                return false;
            }
            if (item.type == 'resource') {
                var res = evaluator.evaluate(obj, result, there, true);
                names.push(item.value);
                params.push(value(res));
            } else if (item.value !== '*' && !new RegExp(item.value).test(obj.value)) {
                matched = false;
                return false;
            }
            obj = res ? res.obj : obj.next;
        });
        if (matched) {
            return {params: params, names: names, obj: obj};
        }
        return void 0;
    }
}

function defaultParams(obj, result, there, evaluator) {
    var params = [];
    while (obj && obj.type != 'switch') {
        var res = evaluator.evaluate(obj, result, there, true);
        params.push(value(res));
        obj = res.obj;
    }
    return {params: params, obj: obj};
}

function valueOrEval(obj, there, evaluator, list) {
    if (!obj) {
        return obj;
    }
    var resource = obj.type == 'resource';
    if (resource || list) {
        var resourceRef = false;
        if (obj.value.charAt(0) == '@') {
            resourceRef = true;
            obj.value = obj.value.substring(1);
        } else if (resource) {
            obj.type = 'word';
        }
        var res = evaluator.evaluate(obj, there, there, true);
        if (resourceRef) {
            obj.value = '@' + obj.value;
        } else if (resource) {
            obj.type = 'resource';
        }
        obj = res.result.value();
    } else {
        obj = obj.value;
    }
    return obj;
}

function value(res) {
    return isFn(res.result.value) ? res.result.value(true) : res.result;
}

function extend(obj, template) {
    for (var prop in template) {
        if (template.hasOwnProperty(prop)) {
            obj[prop] = template[prop];
        }
    }
}

function wrapPrimitive(obj, there) {
    if (typeof obj === 'number') {
        return there.create('number', obj);
    } else if(typeof obj === 'string') {
        return there.create('string', obj);
    } else if(Array.isArray(obj)) {
        return there.create('list', obj);
    } else if (obj instanceof word) {
        return obj.word;
    }
    return obj;
}

var specialParams = {
    el: 'el',
    args: 'args',
    argNames: 'argNames',
    env: 'env',
    i: 'i'
};

module.exports = {
    trace: false/*true*/,
    defaultParams: defaultParams,
    buildParser: buildParser,
    readParserOptions: readParserOptions,
    valueOrEval: valueOrEval,
    wrapPrimitive: wrapPrimitive,
    profiler: new profiler(),
    value: value,
    extend: extend,
    isFn: isFn,
    specialParams: specialParams
};