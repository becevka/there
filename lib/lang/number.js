var element = require('./element');

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
    if (val) {
        r.is(val);
    }
    return r;
};

number.prototype.reduce = function (val) {
    var r = new number(this.val);
    if (val) {
        r.not(val);
    }
    return r;
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

module.exports = number;