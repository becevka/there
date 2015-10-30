var utils = require('./utils');

var valueTypes = ['string', 'number', 'list'];

var element = function (type) {
    this.type = type;
    this.states = [];
};

element.prototype.forEach = function (items, fn) {
    items = Array.isArray(items) ? items : [items];
    fn && items.forEach(fn, this);
};

element.prototype.valueType = function (val) {
    var type = val && val.type;
    return valueTypes.indexOf(type) != -1;
};

element.prototype.checkType = function (type) {
    if (type && type.type) {
        type = type.type;
    }
    return type;
};

element.prototype.is = function (type) {
    this.forEach(type, function (item) {
        this.states.push(this.checkType(item));
    });
    return this;
};

element.prototype.get = function (type) {
    if (typeof type === 'number' || type.type === 'number') {
        if (utils.isFn(type.value)) {
            type = type.value();
        }
        return this.states[type];
    }
    return this;
};

element.prototype.not = function (type) {
    this.forEach(type, function (item) {
        var idx = this.states.indexOf(this.checkType(item));
        if (idx != -1) {
            this.states.splice(idx, 1);
        }
    });
    return this;
};

element.prototype.is_not = function (type) {
    return this.size(this.checkType(type)) == 0 ? 1 : 0;
};

element.prototype.size = function (type) {
    if (utils.isFn(this.beforeEval)) {
        this.beforeEval();
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
    if (utils.isFn(this.beforeEval)) {
        this.beforeEval();
    }
    var r = new element(this.type);
    r.states = this.states.slice();
    type = this.checkType(type);
    if (type) {
        r.is(type);
    }
    return r;
};

element.prototype.reduce = function (type) {
    if (utils.isFn(this.beforeEval)) {
        this.beforeEval();
    }
    var r = new element(this.type);
    r.states = this.states.slice();
    type = this.checkType(type);
    if (type) {
        r.not(type);
    }
    return r;
};

element.prototype.value = function () {
    return this.type;
};

element.prototype.toString = function () {
    return this;
};

module.exports = element;