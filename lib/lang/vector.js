var element = require('./element');
var env = require('./env');
var iterator = require('./iterator');
var utils = require('./utils');

var vector = function (type, impl) {
    this.type = type;
    this.states = [];
    this.val = impl;
};

vector.prototype = new element();

vector.prototype.call = function (result, obj, there, evaluator) {
    var params = [];
    var paramNames = null;
    var p = obj.next;
    var matched = true;
    if (p) {
        var test = evaluator.evaluate(p, result, there, true);
        if (test.result instanceof iterator.iterator) {
            this.val.parse = utils.buildParser(test.result, evaluator, there);
            p = test.obj;
        }
        var res;
        if (utils.isFn(this.val.parse)) {
            res = this.val.parse(p, result, there);
            if (res) {
                params = res.params;
                paramNames = res.names;
                p = res.obj;
            } else {
                matched = false;
            }
        } else if (this.val.arity) {
            for (var i = 0; i < this.val.arity; i++) {
                res = evaluator.evaluate(p, result, there, true);
                params.push(utils.value(res));
                p = res.obj;
            }
        } else {
            res = utils.defaultParams(p, result, there, evaluator);
            params = res.params;
            p = res.obj;
        }
    }
    if (matched) {
        result = this.invoke(result, params, there, paramNames);
    }
    if (utils.trace) {
        console.log('Matched ' + this.type + ':' + matched);
        console.log('After ' + this.type + ':');
        console.log(result);
    }

    if (result == null) {
        result = this;
    } else if (p && p.type !== 'switch' && matched) {
        var item = null;
        if (utils.isFn(result.val)) {
            item = new vector(result.type, result.val);
        } else if (utils.isFn(result)) {
            item = new vector('[anonymous]' + this.type, result);
        }
        if (item != null) {
            return item.call(result, {next: p}, there, evaluator);
        }
    }
    return {result: result, obj: p}
};

vector.prototype.invoke = function (result, params, there, paramNames) {
    var vector = this.type;
    var res = this.val.call({value: vector}, result, params, there, paramNames);
    var continuations = findContinuations(there, vector, result, params[0]);
    if (continuations) {
        continuations.forEach(function (item) {
            res = item.fn.call({value: vector}, result, params, there, paramNames)
        });
    }
    if (res instanceof env && res.returns && res.returns.length > 0) {
        res = res.returns;
    }
    return res;
};

module.exports = vector;

function findContinuations(env, vector, target, effect) {
    var continuations = env.continuations[vector];
    if (continuations && target instanceof element) {
        return continuations.filter(function (item) {
            var t = item.target;
            var e = item.effect;
            var hasTarget = t === '*' || target.size(t) > 0;
            var hasEffect = effect === e || (effect instanceof element && effect.size(e) > 0);
            return hasTarget && hasEffect;
        });
    }
}