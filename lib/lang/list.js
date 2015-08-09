var element = require('./element');
var utils = require('./utils');

var list = function (sequence, there, evaluator) {
    this.type = 'list';
    this.states = [];
    var tmp = sequence;
    while (tmp) {
        this.states.push(utils.valueOrEval(tmp, there, evaluator, true));
        tmp = tmp.next;
    }
    this.next = function (cb) {
        if (cb) {
            this.states.forEach(cb);
        }
    };
    this.create = function () {
        return new list(sequence, there, evaluator);
    };

};

list.prototype = new element();

list.prototype.is = function (type) {
    this.forEach(type, function (item) {
        item = this.checkType(item);
        this.states.push(item);
    });
};

list.prototype.extend = function (val) {
    var r = this.create();
    if (val) {
        r.is(val);
    }
    return r;
};

list.prototype.reduce = function (val) {
    var r = this.create();
    if (val) {
        r.not(val);
    }
    return r;
};

list.prototype.value = function () {
    return this;
};

list.prototype.toString = function () {
    return this.states;
};

module.exports = list;