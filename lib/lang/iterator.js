var utils = require('./utils');

var seq = function (sequence, there, evaluator) {
    var obj = sequence;
    if (obj.sequence && !obj.getSequence) {
        obj = obj.sequence;
    }
    var check = obj.next;
    if (check && check.value == '..') {
        return new range(obj, there, evaluator);
    }
    return new iterator(obj, there, evaluator);
};

var range = function (sequence, there, evaluator) {
    var done = false;
    var start = sequence;
    var end = sequence.next.next;
    var step = 1;
    if (end && end.next) {
        step = end.next;
    }
    var alpha = start.type == 'word';
    start = utils.valueOrEval(start, there, evaluator);
    end = utils.valueOrEval(end, there, evaluator);
    if (step !== 1) {
        step = utils.valueOrEval(step, there, evaluator);
    }
    var findNext = function (i) {
        var res;
        if (alpha) {
            res = String.fromCharCode(start.charCodeAt(0) + i)
        } else {
            res = start + i
        }
        if (end && res > end) {
            return null;
        }
        if (end && res > end) {
            done = true;
        }
        return res;
    };
    this.next = function (cb) {
        var i = 0;
        while (!done && cb) {
            var res = findNext(i);
            if (!res || i > 100) {
                break;
            }
            var check = cb(res);
            if (check != undefined && !check) {
                break;
            }
            i += step;
        }
    };
};

var iterator = function (sequence, there, evaluator) {
    this.__internal = sequence;
    this.next = function (cb, raw) {
        var tmp = sequence;
        while (tmp && cb) {
            var val = raw ? tmp : utils.valueOrEval(tmp, there, evaluator, false);
            var check = cb(val);
            if (check != undefined && !check) {
                break;
            }
            tmp = tmp.next;
        }
    };
};

module.exports = {
    iterator : iterator,
    seq: seq,
    range: range
};