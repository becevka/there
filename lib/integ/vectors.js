var utils = require('../lang/utils');

var vectors = {};

var map = [{
    cmd: '+', fn: 'is'
}, {
    cmd: '-', fn: 'not'
}, {
    cmd: '?', fn: 'size'
}, {
    cmd: '?!', fn: 'is_not'
}, {
    cmd: 'has', fn: 'set'
}, {
    cmd: 'has!', fn: 'remove'
}, {
    cmd: '*', fn: 'get'
}, {
    cmd: 'has?', fn: 'has'
}, {
    cmd: 'has?!', fn: 'has_not'
}, {
    cmd: '+=', fn: 'extend'
}, {
    cmd: '-=', fn: 'reduce'
}];

map.forEach(function (item) {
    var cmd = item.cmd;
    vectors[cmd] = function (source, parameters, there) {
        there = ensure(there);
        source = ensure(source, there);
        var cb = source[item.fn];
        return cb && cb.apply(source, parameters);
    };
    vectors[cmd].arity = 1;
});

map = [{
    cmd: '<<', fn: 'import'
}, {
    cmd: '>>', fn: 'export'
}, {
    cmd: '$', fn: 'require'
}];

map.forEach(function (item) {
    var cmd = item.cmd;
    vectors[cmd] = function (source, parameters, there) {
        there = ensure(there);
        source = ensure(source, there);
        source = source.type || source;
        var cb = there[item.fn];
        return cb && cb.call(there, source, parameters[0]);
    };
});

vectors[':'] = function (source, parameters, there) {
    there = ensure(there);
    source = ensure(source, there);
    if (utils.isFn(source.next) && parameters.length > 0 && utils.isFn(parameters[0])) {
        source.next(function (value) {
            there.constructor(value, parameters[0]);
        });
    }
    return there;
};
vectors[':'].arity = 1;

vectors['mode'] = function (source, parameters, there) {
    there = ensure(there);
    if (parameters.length > 1) {
        return there.mode(parameters[0], 'on' == parameters[1]);
    } else if (parameters.length > 0) {
        return there.mode(parameters[0]);
    }
    return there;
};

vectors['...'] = function (source, parameters, there) {
    there = ensure(there);
    source = ensure(source, there);
    if (utils.isFn(source.next) && parameters.length > 0 && utils.isFn(parameters[0])) {
        var vector = '+';
        var target = '*';
        var effect = null;
        var list = [];
        source.next(function (value) {
            list.push(value);
        });
        if (list.length > 0) {
            effect = list.pop();
        }
        if (list.length > 0) {
            target = list.pop();
        }
        if (list.length > 0) {
            vector = list.pop();
        }
        if (effect != null) {
            there.continuation(vector, target, effect, parameters[0]);
        }
    }
    return there;
};
vectors['...'].arity = 1;

vectors['_'] = function (source, parameters, there) {
    there = ensure(there);
    source = ensure(source, there);
    var res = there;
    var i = 0;
    if (parameters.length > 0 && utils.isFn(parameters[0])) {
        var cb = parameters[0];
        if (utils.isFn(source.value)) {
            source = source.value();
        }
        if (utils.isFn(source.next)) {
            i = 0;
            source.next(function (value) {
                res = doNext(value, i, cb, there);
                i++;
            });
        } else if (Array.isArray(source)) {
            source.forEach(function (item, i) {
                res = doNext(item, i, cb, there);
            });
        } else if (typeof source === 'number' || (source.type && source.type == 'number')) {
            for (i = 0; i < source; i++) {
                res = doNext(source, i, cb, there);
            }
        } else if (typeof source === 'string' || (source.type && source.type == 'string')) {
            res = {
                await: function (next) {
                    this.fn = next;
                    this.check();
                },
                check: function () {
                    if (this.obj && this.fn) {
                        this.fn(this.obj);
                    }
                },
                ready: function (obj) {
                    this.obj = obj;
                    this.check();
                }
            };
            there.ask(source + '\n', function (answer) {
                res.ready(doNext(answer, 0, cb, there));
            });
        }
    }
    return res;
};
vectors['_'].arity = 1;

function doNext(source, i, cb, there) {
    var env = there.fork('_');
    var sp = utils.specialParams;
    env.resources[sp.i] = i;
    var res = cb(source, [], env);
    there.returns = env.returns.slice();
    return res;
}

function ensure(obj, def) {
    if (obj != null) {
        return obj;
    }
    if (def != null) {
        return def;
    }
    return {};
}

module.exports = vectors;