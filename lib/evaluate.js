var path = require('path');

var element = require('./lang/element');
var value = require('./lang/value');
var string = require('./lang/string');
var number = require('./lang/number');
var vector = require('./lang/vector');
var list = require('./lang/list');
var table = require('./lang/table');
var env = require('./lang/env');
var there = require('./lang/there');
var iterator = require('./lang/iterator');
var utils = require('./lang/utils');

var Evaluate = function (facet, readline) {
    this.rs = facet.resources;
    this.globals = facet.globals;
    this.history = facet.history;
    this.rl = readline || require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
    this.defaultInput = null;
};

Evaluate.prototype.eval = function (obj, result, there, done, skipHistoryReload) {
    !skipHistoryReload && this.history && this.history.reload();
    there = this.there(there);
    var resources = obj.resources;
    if (obj.sequence && !obj.getSequence) {
        obj = obj.sequence;
    }
    if (!done) {
        var res = result;
        while (obj) {
            var r = this.evaluate(obj, res, there);
            res = r.result;
            obj = r.obj;
        }
        return res;
    } else {
        var self = this;

        function next(result, object) {
            if (object) {
                var out = self.evaluate(object, result, there);
                var r = out.result;
                if (typeof r.await == 'function') {
                    r.await(function (obj) {
                        next(obj, out.obj);
                    });
                } else {
                    next(r, out.obj);
                }
            } else {
                done(result);
            }
        }

        this._resourceCheck(resources, function () {
            next(result, obj);
        }, this.defaultInput)
    }
};

Evaluate.prototype.evaluate = function (obj, result, there, silent) {
    var type = obj.type;
    var val = obj.value;
    switch (type) {
        case 'switch':
            return ret(there, obj);
        case 'string':
            return ret(new string(val), obj);
        case 'template':
            val = utils.interpolate(obj.parse(), there);
            return ret(new string(val), obj);
        case 'number':
            return ret(new number(val), obj);
        case 'resource':
            var lrs = there.resources;
            var r = lrs[val];
            if (r == null) {
                if (there.mode(there.modeNames.auto_read)) {
                    there.nextRead = !there.nextRead ? 1 : there.nextRead + 1;
                    r = lrs[there.nextRead];
                    lrs[val] = r;
                }
                if (r == null) {
                    throw 'Undefined resource:' + val;
                }
            }
            if (utils.isFn(r)) {
                r = new vector(val, r);
                return r.call(result, obj, there, this);
            }
            return ret(r, obj);
        case 'word':
            if (val === 'there' || val === ';') {
                return ret(there, obj);
            }
            var item = there.properties[val];
            if (item == null) {
                item = this.globals[val];
                if (item != null) {
                    if (utils.isFn(item)) {
                        item = new vector(val, item);
                    }
                } else {
                    var c = there.constructor(val);
                    if (c) {
                        item = c(val);
                    } else {
                        item = new element(val);
                    }
                    if (!c || c.stored) {
                        there.set(item, val);
                    }
                }
            }
            if (item instanceof vector && !silent) {
                return item.call(result, obj, there, this);
            }
            return ret(item, obj);
        case 'list':
            return ret(new list(obj.getSequence(), there, this), obj);
        case 'table':
            return ret(new table(obj.getSequence(), there, this), obj);
        case 'sequence':
            return ret(iterator.seq(obj.getSequence(), there, this), obj);
        case 'block':
            return fn(obj.getSequence(), result, obj, there, this);
    }
};

Evaluate.prototype.there = function (obj) {
    if (obj instanceof env) {
        return obj;
    }
    var res = new there(this.rs, this.rl, this.globals);
    if (obj) {
        utils.extend(res, obj);
    }
    if (!res.dir) {
        res.dir = process.cwd();
    }
    if (!res.file) {
        res.file = path.join(res.dir, 'index.th');
    }
    return res;
};

Evaluate.prototype._resourceCheck = function (resources, callback, defaultValue) {
    var askFor = [];
    var rs = this.rs;
    resources.forEach(function (item) {
        if (rs[item] == null) {
            askFor.push(item);
        }
    });
    if (askFor.length > 0) {
        askResources(this.rl, askFor, rs, callback, defaultValue);
    } else {
        callback && callback();
    }
};

module.exports = function (facet, readline) {
    return new Evaluate(facet, readline);
};

var fn = function (sequence, result, obj, there, evaluator) {
    var next = obj.next;
    var sp = utils.specialParams;
    var v = function (result, params, there, paramNames) {
        var e = there;
        var i = paramNames ? paramNames.indexOf(sp.env) : -1;
        if (i != -1) {
            var val = paramValue(params[i], there, false);
            if (val instanceof env) {
                e = val.fork(this.value);
                e.parent = there;
            }
        }
        if (!e.reflected) {
            e = new env(this.value, there);
            e.resources = Object.create(there.resources);
            e.modes = Object.create(there.modes);
            e.out = there.out;
            e.ask = there.ask;
            e.interaction = there.interaction;
            e.globalize = there.globalize;
        }
        e.reflected = false;
        e.resources[sp.el] = result;
        if (result) {
            result._name = sp.el;
        }
        e.resources[sp.args] = params;
        e.resources[sp.argNames] = paramNames;
        if (paramNames) {
            paramNames.forEach(function (item, i) {
                if (item != sp.env && item != sp.args && item != sp.argNames && (item != sp.i || !e.resources[sp.i])) {
                    var p = paramValue(params[i], there, true);
                    e.resources[item] = p;
                    p._name = item;
                    e.resources['' + (i + 1)] = p;
                }
            });
        } else if (params) {
            params.forEach(function (item, i) {
                e.resources['' + (i + 1)] = paramValue(item, there, true);
            });
        }
        return evaluator.eval(sequence, null, e, null, true);
    };
    if (next) {
        var test = evaluator.evaluate(next, result, there, true);
        if (test.result instanceof iterator.iterator) {
            v.parse = utils.buildParser(test.result, evaluator, there);
            next = test.obj;
        }
    }
    return ret(v, {next: next});
};

function ret(result, obj) {
    return {result: result, obj: obj.next};
}

function paramValue(param, there, extend) {
    var el = param;
    if (!utils.isFn(el) && !(el instanceof  element)) {
        el = there.get(el);
        if (el == null) {
            el = param;
        }
    }
    if (extend && utils.isFn(el.extend)) {
        el = el.extend();
    }
    return there.wrapPrimitive(el)
}

function askResources(rl, arr, resources, done, defaultValue) {

    function ask(resource, callback, defaultValue) {
        rl.question("Enter the value for [" + resource + "]:", function (answer) {
            callback(resource, answer);
        });
        if (defaultValue) {
            setTimeout(function () {
                rl._onLine(defaultValue);
            }, 1000);
        }
    }

    function next() {
        if (arr.length) {
            ask(arr.shift(), function (resource, answer) {
                resources[resource] = answer;
                next();
            }, defaultValue);
        } else {
            done && done();
        }
    }

    next();
}
