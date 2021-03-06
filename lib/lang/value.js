var utils = require('./utils');

var value = function (type) {
    this.valueType = type;
};

value.prototype.unwrap = function (val) {
    if (val && utils.isFn(val.value)) {
        val = val.value();
    }
    return val;
};

value.prototype.eq = function (type) {
    return this.value() == this.unwrap(type) ? 1 : 0;
};

value.prototype.value = function (parameter) {
    return parameter ? this : this.val;
};

value.prototype.toString = function () {
    return this.val;
};

module.exports = value;
