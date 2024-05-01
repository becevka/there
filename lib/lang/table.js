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
        var t = new table(sequence, there, evaluator);
        t.states.forEach(function (col) {
            t.struct[col] = this.struct[col].slice();
        }, this);
        t.count = this.count;
        return t;
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
    arrayOrNext(type, this.insert.bind(this));
    return this;
};

table.prototype.not = function (type) {
    var idxs = [];
    if (typeof type === 'number' || type.valueType === 'number') {
        if (utils.isFn(type.value)) {
            type = type.value();
        }
        if (this.count > type) {
            idxs = [type];
        }
    } else if (Array.isArray(type)) {
        idxs = findIndexes(type, this);
    } else if (utils.isFn(type.next)) {
        var search = [];
        type.next(function (item) {
            search.push(item);
        });
        idxs = findIndexes(search, this);
    }
    idxs.forEach(function (idx) {
        this.states.forEach(function (col) {
            var list = this.struct[col];
            list.splice(idx, 1);
            this.count = list.length;
        }, this);
    }, this);
    return this;
};

table.prototype.insert = function (colIdx, value) {
    var col = this.states[colIdx];
    var list = this.struct[col];
    list.push(value);
    this.count = list.length;
};

table.prototype.search = function (search) {
    var idx = findIndexes(search, this);
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

function val(item) {
    if (utils.isFn(item.value)) {
        item = item.value();
    }
    return item;
}

var initialSearch = function (list, value) {
    var idx = [];
    value = val(value);
    list.forEach(function (item, i) {
        item = val(item);
        if (item === value || value === '*') {
            idx.push(i);
        }
    });
    return idx;
};

var arrayOrNext = function (test, cb) {
    if (Array.isArray(test)) {
        test.forEach(function (item, i) {
            cb(i, item);
        });
    } else if (utils.isFn(test.next)) {
        test.next(function (item, i) {
            cb(i, item);
        });
    }
};

var findIndexes = function (search, table) {
    var col = table.states[0];
    var list = table.struct[col];
    var idx = initialSearch(list, search.shift());
    search.forEach(function (item, i) {
        item = val(item);
        col = table.states[i + 1];
        list = table.struct[col];
        var it = idx.slice();
        it.forEach(function (id, ii) {
            if (list[id] !== item && item !== '*') {
                delete idx[ii];
            }
        });
    });
    return idx;
};