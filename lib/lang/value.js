var utils = require('./utils');

var value = function (type) {
    this.valueType = type;
};

value.prototype.unwrap = function(val) {
    var t = this.valueType;
    if (val && (typeof val === t || val.valueType === t)) {
        if (utils.isFn(val.value)) {
            val = val.value();
        }
    }
    return val;
};

value.prototype.value = function (parameter) {
    if (parameter) {
        return this;
    }
    return this.val;
};

value.prototype.toString = function () {
    return this.val;
};

module.exports = value;
