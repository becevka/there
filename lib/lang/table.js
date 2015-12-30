var element = require('./element');
var utils = require('./utils');

var table = function (sequence, there, evaluator) {
    this.type = 'table';
    this.states = [];
    this.struct = {};
    this.count = 0;
    if (Array.isArray(sequence)) {
        sequence.forEach(function (item) {
            this.struct[item] = [];
            this.states.push(item);
        }, this);
    } else {
        var tmp = sequence;
        while (tmp) {
            var item = utils.valueOrEval(tmp, there, evaluator, false);
            this.struct[item] = [];
            this.states.push(item);
            tmp = tmp.next;
        }
    }
    this.next = function (cb, thisArg) {
        if (cb) {
            for (var i = 0; i < this.count; i++) {
                var r = {__tr: true};
                this.states.forEach(function (col) {
                    r[col] = this.struct[col][i];
                }, this);
                cb(r, i, thisArg);
            }
        }
    };
    this.create = function () {
        return new table(sequence, there, evaluator);
    };

};

table.prototype = new element();

table.prototype.get = function (type) {
    if (typeof type === 'number' || type.valueType === 'number') {
        if (utils.isFn(type.value)) {
            type = type.value();
        }
        if (this.count <= type) {
            return this.count;
        }
        var res = [];
        this.states.forEach(function (col) {
            res.push(this.struct[col][type]);
        }, this);
        return res;
    } else if (Array.isArray(type)) {
        return this.search(type);
    } else if (utils.isFn(type.next)) {
        var search = [];
        type.next(function (item) {
            search.push(item);
        });
        return this.search(search);
    } else if (typeof type === 'string' || type.valueType === 'string') {
        if (utils.isFn(type.value)) {
            type = type.value();
        }
        res = [];
        var i = 0;
        while (i < this.count) {
            var r = this.get(i);
            var s = r.toString().replace(',', ' ');
            if (s.match(type)) {
                res.push(r);
            }
            i++;
        }
        return res;
    }
    return this;
};

table.prototype.is = function (type) {
    if (Array.isArray(type)) {
        type.forEach(function (item, i) {
            this.insert(i, item);
        }, this);
    } else if (utils.isFn(type.next)) {
        type.next(function (item, i) {
            this.insert(i, item);
        }, this);
    }
    return this;
};

table.prototype.insert = function (colIdx, value) {
    var col = this.states[colIdx];
    var list = this.struct[col];
    list.push(value);
    this.count = list.length;
};

table.prototype.search = function (search) {
    var col = this.states[0];
    var list = this.struct[col];
    var idx = initialSearch(list, search.shift());
    search.forEach(function (item, i) {
        col = this.states[i];
        list = this.struct[col];
        var it = idx.slice();
        it.forEach(function (id, ii) {
            if (list[id] !== item && item !== '*') {
                delete idx[ii];
            }
        });
    }, this);
    return idx.map(function (item) {
        return this.get(item);
    }, this);
};

table.prototype.extend = function (val) {
    var r = this.create();
    if (val) {
        r.is(val);
    }
    return r;
};

table.prototype.reduce = function (val) {
    var r = this.create();
    if (val) {
        r.not(val);
    }
    return r;
};

table.prototype.value = function () {
    return this;
};

table.prototype.data = function () {
    return this.struct;
};

table.prototype.toString = function () {
    return this.struct;
};

module.exports = table;

var initialSearch = function (list, value) {
    var idx = [];
    list.forEach(function (item, i) {
        if (item === value || value === '*') {
            idx.push(i);
        }
    });
    return idx;
};