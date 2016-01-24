var value = require('./value');
var utils = require('./utils');

var string = function (value) {
    this.type = 'string';
    this.val = value;
};

string.prototype = new value('string');

string.prototype.is = function (val) {
    this.val += this.unwrap(val);
    return this;
};

string.prototype.get = function (val) {
    if (typeof val === 'number' || val.valueType === 'number') {
        if (utils.isFn(val.value)) {
            val = val.value();
        }
        return this.val.charAt(val);
    }
    this.val += this.unwrap(val);
    return this;
};

string.prototype.not = function (val) {
    val = this.unwrap(val);
    while (this.val.indexOf(val) != -1) {
        this.val = this.val.replace(val, '');
    }
    return this;
};

string.prototype.size = function (val) {
    var res = 0;
    var test = this.val;
    val = this.unwrap(val);
    while (test.indexOf(val) != -1) {
        test = test.replace(val, '');
        res++;
    }
    return res;
};

string.prototype.is_not = function (val) {
    return this.val != this.unwrap(val) ? 1 : 0;
};

string.prototype.extend = function (val) {
    var r = new string(this.val);
    val = this.unwrap(val);
    if (val) {
        r.is(val);
    }
    return r;
};

string.prototype.reduce = function (val) {
    var r = new string(this.val);
    val = this.unwrap(val);
    if (val) {
        r.not(val);
    }
    return r;
};

module.exports = string;