var word = require('./word');
var element = require('./element');
var string = require('./string');
var number = require('./number');
var list = require('./list');
var scope = require('./scope');
var utils = require('./utils');
var req = require('../require');

var env = function (name, parent) {
    this.type = name || 'env';
    this.parent = parent;
    this.states = [];
    this.properties = {};
    this.resources = {};
    this.modes = {};
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

env.prototype.require = function (name, type) {
    var loaded = req(type, this.dir, this);
    delete this.properties[type];
    if (name == 'there') {
        name = null;
    }
    name = name || type;
    loaded.type = name;
    this.properties[name] = loaded;
    return loaded;
};

env.prototype.import = function (name, type) {
    if ((!name || name == this.type) && !type) {
        var sp = utils.specialParams;
        var argNames = this.resources[sp.argNames];
        var args = this.resources[sp.args];
        argNames.forEach(function (item, i) {
            this.properties[item] = args[i];
        }, this);
    } else {
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

env.prototype.constructor = function (type, fn) {
    if (!this.has(type) && utils.isFn(fn)) {
        var there = this;
        var stored = true;
        if (type.charAt(0) === '?') {
            type = type.substring(1);
            stored = false;
        }
        this.constructors[type] = function (name) {
            utils.profiler.start('constructor-call:' + name);
            var e = there.fork(name);
            utils.profiler.start('constructor-fn:' + name);
            var el = fn(e, [], e);
            utils.profiler.end('constructor-fn:' + name);
            if (el instanceof env && el.returns && el.returns.length > 0) {
                el = el.returns;
            }
            if (element.prototype.valueType(el)) {
                el = new element(name).is(el);
            } else {
                el.type = name;
            }
            utils.profiler.end('constructor-call:' + name);
            return el;
        };
        this.constructors[type].stored = stored;
    }
    return this.constructors[type];
};

env.prototype.mode = function (name, enabled) {
    if (enabled != undefined) {
        this.modes[name] = enabled;
    }
    return this.modes[name];
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
    return this.continuations[vector];
};

env.prototype.fork = function (name) {
    utils.profiler.start('fork for ' + name);
    var r = new env(name, this.parent, this);
    r.reflected = true;
    r.out = this.out;
    r.ask = this.ask;
    r.interaction = this.interaction;
    r.dir = this.dir;
    r.file = this.file;
    r.states = this.states.slice();
    r.properties = Object.create(this.properties);
    r.resources = Object.create(this.resources);
    r.modes = Object.create(this.modes);
    r.constructors = Object.create(this.constructors);
    r.continuations = Object.create(this.continuations);
    r.returns = this.returns.slice();
    utils.profiler.end('fork for ' + name);
    return r;
};

env.prototype.create = function (type, value) {
    switch (type) {
        case 'string':
            return new string(value);
        case 'number':
            return new number(value);
        case 'word':
            return new word(value);
        case 'element':
        case 'el':
            return new element(value);
        case 'list':
            return new list(value);
    }
};

env.prototype.modeNames = {
    auto_read: 'auto-read'
};

module.exports = env;

function findContinuation(continuations, target, effect) {
    var list = continuations.filter(function (item) {
        return effect === item.effect && target === item.target;
    });
    return list.length > 0 ? list[0] : null;
}