var path = require('path');

var element = require('./lang/element');
var string = require('./lang/string');
var number = require('./lang/number');
var vector = require('./lang/vector');
var list = require('./lang/list');
var env = require('./lang/env');
var there = require('./lang/there');
var iterator = require('./lang/iterator');
var utils = require('./lang/utils');

var Evaluate = function (facet, readline) {
    this.rs = facet.resources;
    this.vs = facet.vectors;
    this.rl = readline || require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    this.defaultInput = null;
};

Evaluate.prototype.eval = function (obj, result, there, done) {
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
    var value = obj.value;
    switch (type) {
        case 'switch':
            return ret(there, obj);
        case 'string':
            return ret(new string(value), obj);
        case 'number':
            return ret(new number(value), obj);
        case 'resource':
            var lrs = there.resources;
            var r = lrs[value];
            if (r == null) {
                throw 'Undefined resource:' + value;
            }
            if (utils.isFn(r)) {
                r = new vector(value, r);
                return r.call(result, obj, there, this)
            } else if (!(r instanceof  element) && !Array.isArray(r)) {
                r = new element(r);
            }
            return ret(r, obj);
        case 'word':
            if (value === 'there' || value === ';') {
                return ret(there, obj);
            }
            var item = there.get(value);
            if (item == null) {
                item = this.vs[value];
                if (item != null) {
                    item = new vector(value, item);
                } else {
                    var c = there.constructors[value];
                    if (c) {
                        item = c(value);
                    } else {
                        item = new element(value);
                    }
                    if (!c || c.stored) {
                        there.set(item, value);
                    }
                }
            }
            if (utils.isFn(item.val)) {
                item = new vector(value, item.val);
            }
            if (item instanceof vector && !silent) {
                return item.call(result, obj, there, this);
            }
            return ret(item, obj);
        case 'list':
            return ret(new list(obj.getSequence(), there, this), obj);
        case 'sequence':
            return ret(iterator.seq(obj.getSequence(), there, this), obj);
        case 'block':
            return fn(obj.getSequence(), result, obj, there, this);
    }
};

Evaluate.prototype.there = function (obj) {
    if (obj instanceof there) {
        return obj;
    }
    var res = new there(this.rs, this.rl);
    if (obj) {
        utils.extend(res, obj);
    }
    if(!res.dir) {
        res.dir = process.cwd();
    }
    if(!res.file) {
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

module.exports = function (bundle, readline) {
    return new Evaluate(bundle, readline);
};

var fn = function (sequence, result, obj, there, evaluator) {
    var next = obj.next;
    var v = function (result, params, there, paramNames) {
        var e = there;
        if (!e.reflected) {
            e = new env(this.value, there);
            utils.extend(e.resources, there.resources);
            e.out = there.out;
            e.ask = there.ask;
        }
        e.reflected = false;
        e.resources['el'] = result;
        e.resources['args'] = params;
        if (paramNames) {
            paramNames.forEach(function (item, i) {
                e.resources[item] = paramValue(params[i], there);
            });
        }
        params.forEach(function (item, i) {
            e.resources['' + (i + 1)] = paramValue(item, there);
        });
        return evaluator.eval(sequence, result, e);
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

function paramValue(param, there) {
    var el = param;
    if (!utils.isFn(el) && !(el instanceof  element)) {
        el = there.get(el);
        if (el == null) {
            el = param;
        }
    }
    return el;
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
