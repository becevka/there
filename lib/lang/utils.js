function isFn(v) {
    return typeof v == 'function';
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
            if(!r) {
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
        if (resource) {
            obj.type = 'word';
        }
        var res = evaluator.evaluate(obj, there, there, true);
        if (resource) {
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
    Object.keys(template).forEach(function (item) {
        obj[item] = template[item];
    });
}

var specialParams = {
    el : 'el',
    args: 'args',
    env: 'env',
    i: 'i'
};

module.exports = {
    trace: false/*true*/,
    defaultParams: defaultParams,
    buildParser: buildParser,
    valueOrEval: valueOrEval,
    value: value,
    extend: extend,
    isFn: isFn,
    specialParams: specialParams
};