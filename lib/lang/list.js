var element = require('./element');
var utils = require('./utils');

var list = function (sequence, there, evaluator) {
    this.type = 'list';
    this.states = [];
    if (Array.isArray(sequence)) {
        sequence.forEach(function (item) {
            this.states.push(item);
        }, this);
    } else {
        var tmp = sequence;
        while (tmp) {
            var v = utils.valueOrEval(tmp, there, evaluator, true);
            if (v != null) {
                this.states.push(v);
            }
            tmp = tmp.next;
        }
    }
    this.next = function (cb, thisArg) {
        if (cb) {
            this.states.forEach(cb, thisArg);
        }
    };
    this.create = function () {
        return new list(sequence, there, evaluator);
    };

};

list.prototype = new element();

list.prototype.checkType = function (type) {
    if (utils.isFn(type.value)) {
        return type.value();
    }
    return new element().checkType(type);
};

list.prototype.is = function (type) {
    this.each(type, function (item) {
        this.states.push(this.checkType(item));
    });
    return this;
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

list.prototype.value = function (parameter) {
    if (parameter) {
        return this;
    }
    return this.states;
};

list.prototype.toString = function () {
    return this.states;
};

module.exports = list;