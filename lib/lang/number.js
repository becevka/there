var value = require('./value');

var number = function (value) {
    this.type = 'number';
    this.val = value;
};

number.prototype = new value('number');

number.prototype.is = function (val) {
    this.val += this.unwrap(val);
    return this;
};

number.prototype.get = function (val) {
    this.val *= this.unwrap(val);
    return this;
};

number.prototype.not = function (val) {
    this.val -= this.unwrap(val);
    return this;
};

number.prototype.size = function (val) {
    return this.val / this.unwrap(val);
};

number.prototype.rest = function (val) {
    return this.val % this.unwrap(val);
};

number.prototype.is_not = function (val) {
    return this.val != this.unwrap(val) ? 1 : 0;
};

number.prototype.extend = function (val) {
    var r = new number(this.val);
    val = this.unwrap(val);
    if (val) {
        r.is(val);
    }
    return r;
};

number.prototype.reduce = function (val) {
    var r = new number(this.val);
    val = this.unwrap(val);
    if (val) {
        r.not(val);
    }
    return r;
};

module.exports = number;