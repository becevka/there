var element = require('./element');

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
    if (val) {
        r.is(val);
    }
    return r;
};

string.prototype.reduce = function (val) {
    var r = new string(this.val);
    if (val) {
        r.not(val);
    }
    return r;
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

module.exports = string;