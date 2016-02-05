var word = require('./word');
var element = require('./element');
var value = require('./value');
var string = require('./string');
var number = require('./number');
var vector = require('./vector');
var list = require('./list');
var table = require('./table');
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

env.prototype = new element('env');

env.prototype.set = function (element, name) {
    if (element.type) {
        this.properties[element.type] = element;
    } else if (name) {
        this.properties[name] = element;
    }
    return this;
};

env.prototype.get = function (type) {
    return this.properties[this.checkType(type)];
};

env.prototype.remove = function (type) {
    delete this.properties[this.checkType(type)];
    return this;
};

env.prototype.has = function (type) {
    return this.properties.hasOwnProperty(this.checkType(type)) ? 1 : 0;
};

env.prototype.has_not = function (type) {
    return !this.has(type);
};

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
    type = this.checkType(type);
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
        if (argNames) {
            argNames.forEach(function (item, i) {
                this.properties[item] = args[i];
            }, this);
        }
    } else {
        var parent = this.parent;
        type = type || name;
        var el = null;
        while (parent) {
            el = parent.get(type);
            if (el) break;
            parent = parent.parent;
        }

        if (el == null) {
            if (type._name) {
                el = this.resources[type._name];
            }
            if (el == null) {
                el = this.resources[this.checkType(type)];
            }
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
            parent.properties[this.checkType(name)] = el;
        }
    }
};

env.prototype.constructor = function (type, fn) {
    if (utils.isFn(fn) && !this.has(type)) {
        var stored = true;
        if (type.charAt(0) === '?') {
            type = type.substring(1);
            stored = false;
        }
        var there = this;
        var e = there.fork(type);
        this.constructors[type] = function (name) {
            e.reflected = true;
            e.properties = Object.create(there.properties);
            var el = fn(e, null, e);
            if (there.isOf(el, 'env') && el.returns && el.returns.length > 0) {
                var env = el;
                el = env.returns;
                env.returns = [];
            }
            el._name = name;
            return el;
        };
        this.constructors[type].stored = stored;
    }
    return this.constructors[type];
};

env.prototype.mode = function (name, enabled) {
    name = this.checkType(name);
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
    var r = new env(name, this.parent);
    r.reflected = true;
    r.out = this.out;
    r.ask = this.ask;
    r.interaction = this.interaction;
    r.globalize = this.globalize;
    r.dir = this.dir;
    r.file = this.file;
    r.states = this.states.slice();
    r.properties = Object.create(this.properties);
    r.resources = Object.create(this.resources);
    r.modes = Object.create(this.modes);
    r.constructors = Object.create(this.constructors);
    r.continuations = Object.create(this.continuations);
    r.returns = this.returns.slice();
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
        case 'table':
            return new table(value);
        case 'vector':
            return new vector(type, value);
    }
};

env.prototype.isOf = function (value, type) {
    switch (type) {
        case 'string':
            return value instanceof string;
        case 'number':
            return value instanceof number;
        case 'word':
            return value instanceof word;
        case 'element':
        case 'el':
            return value instanceof element;
        case 'list':
            return value instanceof list;
        case 'table':
            return value instanceof table;
        case 'env':
            return value instanceof env;
        case 'vector':
            return value instanceof vector;
        case 'value':
            return value instanceof vector;
    }
};

env.prototype.wrapPrimitive = function (obj) {
    if (typeof obj === 'number') {
        return new number(obj);
    } else if (typeof obj === 'string') {
        return new string(obj);
    } else if (Array.isArray(obj)) {
        return new list(obj);
    } else if (utils.isFn(obj)) {
        return new vector('vector', obj);
    } else if (obj instanceof word) {
        return obj.word;
    }
    return obj;
};

env.prototype.modeNames = {
    auto_read: 'auto-read',
    history: 'history'
};

module.exports = env;

function findContinuation(continuations, target, effect) {
    var list = continuations.filter(function (item) {
        return effect === item.effect && target === item.target;
    });
    return list.length > 0 ? list[0] : null;
}
