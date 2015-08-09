var element = require('./element');
var scope = require('./scope');
var utils = require('./utils');

var env = function (name, parent) {
    this.type = name || 'env';
    this.parent = parent;
    this.states = [];
    this.properties = {};
    this.resources = {};
    this.constructors = {};
    this.continuations = {};
    this.returns = [];
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

env.prototype.import = function (name, type) {
    var parent = this.parent;
    var el = null;
    while (parent) {
        type = type || name;
        el = parent.get(type);
        if (el) break;
        parent = parent.parent;
    }
    if (el) {
        this.properties[name] = el;
    }
};

env.prototype.export = function (type, name) {
    var parent = this.parent;
    var el = this.get(type);
    if (el) {
        if (!name) {
            this.returns.push(el.extend());
        }
        if (name && parent) {
            parent.properties[name] = el;
        }
    }
};

env.prototype.register = function (type, fn) {
    if (!this.has(type) && utils.isFn(fn)) {
        var there = this;
        var stored = true;
        if (type.charAt(0) === '?') {
            type = type.substring(1);
            stored = false;
        }
        this.constructors[type] = function (name) {
            var e = there.fork(name);
            var el = fn(e, [], e);
            if (el instanceof env && el.returns && el.returns.length > 0) {
                el = el.returns;
            }
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

env.prototype.continuation = function (vector, target, effect, fn) {
    if (utils.isFn(fn)) {
        var list = this.continuations[vector];
        if (!list) {
            list = [];
            this.continuations[vector] = list;
        }
        var continuation = findContinuation(list, target, effect);
        if (!continuation) {
            continuation = {
                vector: vector,
                target: target,
                effect: effect
            };
            list.push(continuation);
        }
        continuation.fn = fn;
    }
};

env.prototype.fork = function (name) {
    var r = new env(name);
    r.reflected = true;
    r.out = this.out;
    r.states = this.states.slice();
    utils.extend(r.properties, this.properties);
    utils.extend(r.resources, this.resources);
    utils.extend(r.constructors, this.constructors);
    utils.extend(r.continuations, this.continuations);
    r.returns = this.returns.slice();
    return r;
};

env.prototype.join = function (env) {
    this.states = env.states.slice();
    utils.extend(this.properties, env.properties);
    utils.extend(this.resources, env.resources);
    utils.extend(this.constructors, env.constructors);
    utils.extend(this.continuations, env.continuations);
    this.returns = env.returns.slice();
};

module.exports = env;

function findContinuation(continuations, target, effect) {
    var list = continuations.filter(function (item) {
        return effect === item.effect && target === item.target;
    });
    return list.length > 0 ? list[0] : null;
}
