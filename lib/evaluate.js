var trace;

//trace = true;

function isFn(v) {
    return typeof v == 'function';
}

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
    if (obj.sequence) {
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
            if (isFn(r)) {
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
            if (isFn(item.val)) {
                item = new vector(value, item.val);
            }
            if (item instanceof vector && !silent) {
                return item.call(result, obj, there, this);
            }
            return ret(item, obj);
        case 'list':
            return ret(new list(obj.getSequence(), there, this), obj);
        case 'sequence':
            return ret(seq(obj.getSequence(), there, this), obj);
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
        extend(res, obj);
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

var element = function (type) {
    this.type = type;
    this.states = [];
};

element.prototype.forEach = function (items, fn) {
    items = Array.isArray(items) ? items : [items];
    fn && items.forEach(fn, this);
};

element.prototype.valueType = function (val) {
    return val instanceof  string || val instanceof  number || val instanceof  list;
};

element.prototype.checkType = function (type) {
    if (this.valueType(type)) {
        type = type.val;
    }
    return type;
};

element.prototype.is = function (type) {
    if (isFn(type)) {
        type.val = this.type;
        this.val = type;
    } else if (this.valueType(this.val)) {
        this.val.is(type);
    } else if (this.valueType(type)) {
        this.val = type;
    } else {
        this.forEach(type, function (item) {
            this.states.push(item);
        });
    }
    return this;
};

element.prototype.get = function (type) {
    if (this.valueType(this.val)) {
        this.val.get(type);
    } else if (typeof type === 'number' || type instanceof number) {
        if (isFn(type.value)) {
            type = type.value();
        }
        return this.states[type];
    }
    return this;
};

element.prototype.not = function (type) {
    if (this.valueType(this.val)) {
        this.val.not(type);
    } else {
        this.forEach(type, function (item) {
            var idx = this.states.indexOf(this.checkType(item));
            if(idx != -1) {
                this.states.splice(idx, 1);
            }
        });
    }
    return this;
};

element.prototype.is_not = function (type) {
    return this.size(this.checkType(type)) == 0;
};

element.prototype.size = function (type) {
    if (this.valueType(this.val)) {
        return this.val.size(type);
    }
    type = this.checkType(type);
    var size = this.type === type ? 1 : 0;
    this.states.forEach(function (item) {
        if (item === type) {
            size++;
        }
        return true;
    });
    return size;
};

element.prototype.extend = function (type) {
    if (this.valueType(this.val)) {
        return this.val.extend(type);
    }
    var r = new element(this.type);
    r.states = this.states.slice();
    if (this.val) {
        r.val = this.val;
    }
    return r.is(type);
};

element.prototype.reduce = function (type) {
    if (this.valueType(this.val)) {
        return this.val.reduce(type);
    }
    var r = new element(this.type);
    r.states = this.states.slice();
    if (this.val) {
        r.val = this.val;
    }
    return r.not(type);
};

element.prototype.value = function (parameter) {
    if (!parameter && this.valueType(this.val)) {
        return this.val.value(parameter);
    }
    return this.val || this.type;
};

element.prototype.toString = function () {
    if (this.valueType(this.val)) {
        return this.val.toString();
    }
    return this;
};

var scope = function (type) {
    this.type = type;
    this.states = [];
    this.properties = {};
};

scope.prototype = new element();

scope.prototype.set = function (element, name) {
    if (element.type) {
        this.properties[element.type] = element;
    } else if (name) {
        this.properties[name] = element;
    }
    return this;
};

scope.prototype.get = function (type) {
    return this.properties[type];
};

scope.prototype.remove = function (type) {
    delete this.properties[type];
    return this;
};

scope.prototype.has = function (type) {
    return this.properties.hasOwnProperty(type) ? 1 : 0;
};

scope.prototype.has_not = function (type) {
    return !this.has(type);
};

var string = function (value) {
    this.type = 'string';
    this.val = value;
};

string.prototype = new element();

string.prototype.is = function (type) {
    type = this.checkType(type);
    this.val += type;
    return this;
};

string.prototype.not = function (type) {
    type = this.checkType(type);
    while (this.val.indexOf(type) != -1) {
        this.val = this.val.replace(type, '');
    }
    return this;
};

string.prototype.size = function (type) {
    var res = 0;
    var test = this.val;
    type = this.checkType(type);
    while (test.indexOf(type) != -1) {
        test = test.replace(type, '');
        res++;
    }
    return res;
};

string.prototype.extend = function (val) {
    var r = new string(this.val);
    return r.is(val);
};

string.prototype.reduce = function (val) {
    var r = new string(this.val);
    return r.not(val);
};

string.prototype.value = function (parameter) {
    if (parameter) {
        return this;
    }
    return this.val;
};

string.prototype.toString = function () {
    return this.val;
};

var number = function (value) {
    this.type = 'number';
    this.val = value;
};

number.prototype = new element();

number.prototype.is = function (type) {
    type = this.checkType(type);
    this.val += type;
    return this;
};

number.prototype.get = function (type) {
    type = this.checkType(type);
    this.val *= type;
    return this;
};

number.prototype.not = function (type) {
    type = this.checkType(type);
    this.val -= type;
    return this;
};

number.prototype.size = function (type) {
    type = this.checkType(type);
    return this.val / type;
};

number.prototype.extend = function (val) {
    var r = new number(this.val);
    return r.is(val);
};

number.prototype.reduce = function (val) {
    var r = new number(this.val);
    return r.not(val);
};

number.prototype.value = function (parameter) {
    if (parameter) {
        return this;
    }
    return this.val;
};

number.prototype.toString = function () {
    return this.val;
};


var list = function (sequence, there, evaluator) {
    this.type = 'list';
    this.states = [];
    var tmp = sequence;
    while (tmp) {
        this.states.push(valueOrEval(tmp, there, evaluator, true));
        tmp = tmp.next;
    }
    this.next = function (cb) {
        if (cb) {
            this.states.forEach(cb);
        }
    };
    this.create = function () {
        return new list(sequence, there, evaluator);
    };

};

list.prototype = new element();

list.prototype.is = function(type) {
    this.forEach(type, function (item) {
        item = this.checkType(item);
        this.states.push(item);
    });
};

list.prototype.extend = function (val) {
    var r = this.create();
    return r.is(val);
};

list.prototype.reduce = function (val) {
    var r = this.create();
    return r.not(val);
};

list.prototype.value = function () {
    return this;
};

list.prototype.toString = function () {
    return this.states;
};

var vector = function (type, impl) {
    this.type = type;
    this.states = [];
    this.val = impl;
};

vector.prototype = new element();

vector.prototype.call = function (result, obj, there, evaluator) {
    var params = [];
    var paramNames = null;
    var p = obj.next;
    var matched = true;
    if (p) {
        var test = evaluator.evaluate(p, result, there, true);
        if (test.result instanceof iterator) {
            this.val.parse = buildParser(test.result, evaluator);
            p = test.obj;
        }
        var res;
        if (isFn(this.val.parse)) {
            res = this.val.parse(p, result, there);
            if (res) {
                params = res.params;
                paramNames = res.names;
                p = res.obj;
            } else {
                matched = false;
            }
        } else if (this.val.arity) {
            for (var i = 0; i < this.val.arity; i++) {
                res = evaluator.evaluate(p, result, there, true);
                params.push(value(res));
                p = res.obj;
            }
        } else {
            res = defaultParams(p, result, there, evaluator);
            params = res.params;
            p = res.obj;
        }
    }
    if (matched) {
        result = this.val.call(obj, result, params, there, paramNames);
    }
    if (trace) {
        console.log('Matched ' + this.type + ':' + matched);
        console.log('After ' + this.type + ':');
        console.log(result);
    }
    if (result == null) {
        result = this;
    }

    return {result: result, obj: p}
};

var env = function (name) {
    this.type = name || 'env';
    this.states = [];
    this.properties = {};
    this.resources = {};
    this.constructors = {};
};

env.prototype = new scope('env');

env.prototype.is = function (element) {
    return this.set(element);
};

env.prototype.not = function (type) {
    return this.remove(type);
};

env.prototype.size = function (type) {
    return this.has(type);
};

env.prototype.register = function (type, fn) {
    if (!this.has(type) && isFn(fn)) {
        var env = this;
        var stored = true;
        if (type.charAt(0) === '?') {
            type = type.substring(1);
            stored = false;
        }
        this.constructors[type] = function (name) {
            var e = env.fork(name);
            var el = fn(e, [], e);
            if (element.prototype.valueType(el)) {
                el = new element(name).is(el);
            } else {
                el.type = name;
            }
            return el;
        };
        this.constructors[type].stored = stored;
    }
};

env.prototype.fork = function (name) {
    var r = new env(name);
    r.reflected = true;
    r.out = this.out;
    r.states = this.states.slice();
    extend(r.properties, this.properties);
    extend(r.resources, this.resources);
    extend(r.constructors, this.constructors);
    return r;
};

env.prototype.join = function (env) {
    this.states = env.states.slice();
    extend(this.properties, env.properties);
    extend(this.resources, env.resources);
    extend(this.constructors, env.constructors);
};

var there = function (rs, rl) {
    this.type = 'there';
    this.states = [];
    this.properties = {};
    this.resources = rs;
    this.constructors = {};
    this.out = function (text) {
        console.log(text);
    };
    this.ask = function (text, cb) {
        rl.question(text, function (answer) {
            cb(answer);
        });
    };
    this.close = function () {
        rl.close();
    }
};

there.prototype = new env('there');

var seq = function (sequence, there, evaluator) {
    var obj = sequence;
    if (obj.sequence) {
        obj = obj.sequence;
    }
    var check = obj.next;
    if (check && check.value == '..') {
        return new range(obj, there, evaluator);
    }
    return new iterator(obj, there, evaluator);
};

var range = function (sequence, there, evaluator) {
    var done = false;
    var start = sequence;
    var end = sequence.next.next;
    var step = 1;
    if (end && end.next) {
        step = end.next;
    }
    var alpha = start.type == 'word';
    start = valueOrEval(start, there, evaluator);
    end = valueOrEval(end, there, evaluator);
    if (step !== 1) {
        step = valueOrEval(step, there, evaluator);
    }
    var findNext = function (i) {
        var res;
        if (alpha) {
            res = String.fromCharCode(start.charCodeAt(0) + i)
        } else {
            res = start + i
        }
        if (end && res > end) {
            return null;
        }
        if (end && res > end) {
            done = true;
        }
        return res;
    };
    this.next = function (cb) {
        var i = 0;
        while (!done && cb) {
            var res = findNext(i);
            if (!res || i > 100) {
                break;
            }
            var check = cb(res);
            if (check != undefined && !check) {
                break;
            }
            i += step;
        }
    };
};

var iterator = function (sequence, there, evaluator) {
    this.next = function (cb, raw) {
        var tmp = sequence;
        while (tmp && cb) {
            var val = raw ? tmp : valueOrEval(tmp, there, evaluator, false);
            var check = cb(val);
            if (check != undefined && !check) {
                break;
            }
            tmp = tmp.next;
        }
    };
};

var fn = function (sequence, result, obj, there, evaluator) {
    var next = obj.next;
    var v = function (result, params, there, paramNames) {
        var e = there;
        if (!e.reflected) {
            e = new env(this.value);
            extend(e.resources, there.resources);
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
        if (test.result instanceof iterator) {
            v.parse = buildParser(test.result, evaluator);
            next = test.obj;
        }
    }
    return ret(v, next || obj);
};

function ret(result, obj) {
    return {result: result, obj: obj.next};
}

function extend(obj, template) {
    Object.keys(template).forEach(function (item) {
        obj[item] = template[item];
    });
}

function buildParser(seq, evaluator) {
    return function (obj, result, there) {
        var params = [];
        var names = [];
        var matched = true;
        seq.next(function (item) {
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
        }, true);
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

function value(res) {
    return isFn(res.result.value) ? res.result.value(true) : res.result;
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

function paramValue(param, there) {
    var el = param;
    if (!isFn(el) && !(el instanceof  element)) {
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



