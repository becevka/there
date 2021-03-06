var element = require('./element');
var value = require('./value');
var iterator = require('./iterator');
var utils = require('./utils');

var vector = function (type, impl) {
    this.type = type;
    this.val = impl;
};

vector.prototype = new value('vector');

vector.prototype.call = function (result, obj, there, evaluator) {
    var params = null;
    var paramNames = null;
    var p = obj.next;
    var matched = true;
    if (p) {
        if (p.type === 'sequence') {
            var test = evaluator.evaluate(p, result, there, true);
            if (test.result instanceof iterator.iterator) {
                utils.readParserOptions(this.val, test.result, evaluator, there);
                p = test.obj;
            }
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
        } else if (this.val.arity != undefined) {
            params = [];
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
        if (evaluator.history && there.mode(there.modeNames.history)) {
            var inspections = {
                vector: this,
                source: result,
                env: there,
                params: params,
                paramNames: paramNames
            };
            result = evaluator.history.check(inspections);
        } else {
            result = this.invoke(result, params, there, paramNames);
        }
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
    result = there.wrapPrimitive(result);
    return {result: result, obj: p}
};

vector.prototype.invoke = function (result, params, there, paramNames) {
    var vector = this.type;
    var res = this.val.call({value: vector}, result, params, there, paramNames);
    var continuations = findContinuations(there, vector, result, params);
    if (continuations) {
        continuations.forEach(function (item) {
            res = item.fn.call({value: vector}, result, params, there, paramNames)
        });
    }
    if (there.isOf(res, 'env') && res.returns && res.returns.length > 0) {
        var env = res;
        res = env.returns;
        env.returns = [];
    }
    return res;
};

module.exports = vector;

function findContinuations(env, vector, target, effects) {
    var continuations = env.continuation(vector);
    if (continuations) {
        return continuations.filter(function (item) {
            var t = item.target;
            var e = item.effect;
            var hasTarget = t === '*' || isOf(target, t);
            var hasEffect = false;
            effects.forEach(function (effect) {
                var has = effect === e || isOf(effect, e);
                if (has) {
                    hasEffect = true;
                    return false;
                }
                return true;
            });
            return hasTarget && hasEffect;
        });
    }
}

function isOf(object, type) {
    if (object instanceof  element) {
        return object.size(type) > 0;
    }
    if (object instanceof  value) {
        return object.type == type || object.valueType == type;
    }
    return false;
}