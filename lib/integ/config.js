var utils = require('../lang/utils');

function ensure(obj, def) {
    if (obj != null) {
        return obj;
    }
    if (def != null) {
        return def;
    }
    return {};
}

function doNext(source, i, cb, there) {
    var env = there.fork('_');
    var sp = utils.specialParams;
    env.resources[sp.i] = i;
    var res = cb(source, [], env);
    there.returns = env.returns.slice();
    return res;
}

module.exports = function (config) {
    config.aliases = {
        'is': '+',
        'are': '+',
        'add': '+',
        '=': '+',
        'isnot': '-',
        'arenot': '-',
        'isnt': '-',
        'aint': '-',
        'remove': '-',
        'is!': '-',
        'are!': '-',
        '!': '-',
        '/': '?',
        'is?': '?',
        'are?': '?',
        'size': '?',
        'is?!': '?!',
        'are?!': '?!',
        'with': '+=',
        'without': '-=',
        'from': ':',
        'each': '_',
        'import': '<<',
        'export': '>>',
        'require': '$',
        '@log': '@print',
        '@debug': '@print?'
    };
    config.resources = {
        error: function (source, parameters, there) {
            there = ensure(there);
            var err = 'nil';
            if (source && source.value) {
                err = source.value();
            } else {
                err = JSON.stringify(source);
            }
            there.out(err, 1);
        },

        print: function (source, parameters, there) {
            there = ensure(there);
            source = ensure(source, there);
            if (source.value) {
                there.out(source.value());
            } else {
                there.out(JSON.stringify(source));
            }
            return source;
        },

        'print?': function (source, parameters, there) {
            there = ensure(there);
            source = ensure(source, there);
            there.out(JSON.stringify(source));
            return source;
        },

        time: function () {
            return new Date().getTime();
        }
    };
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
        var fn = function (source, parameters, there) {
            there = ensure(there);
            source = ensure(source, there);
            var cb = source[item.fn];
            return cb && cb.apply(source, parameters);
        };
        fn.arity = 1;
        config.globals[cmd] = fn;
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
        config.globals[cmd] = function (source, parameters, there) {
            there = ensure(there);
            source = ensure(source, there);
            source = source.type || source;
            var cb = there[item.fn];
            return cb && cb.call(there, source, parameters[0]);
        };
    });

    var fn = function (source, parameters, there) {
        there = ensure(there);
        source = ensure(source, there);
        if (utils.isFn(source.next) && parameters.length > 0 && utils.isFn(parameters[0])) {
            source.next(function (value) {
                there.constructor(value, parameters[0]);
            });
        }
        return there;
    };
    fn.arity = 1;
    config.globals[':'] = fn;

    fn = function (source, parameters, there) {
        there = ensure(there);
        if (parameters.length > 1) {
            return there.mode(parameters[0], 'on' == parameters[1]);
        } else if (parameters.length > 0) {
            return there.mode(parameters[0]);
        }
        return there;
    };
    config.globals['mode'] = fn;

    fn = function (source, parameters, there) {
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
    fn.arity = 1;
    config.globals['...'] = fn;

    fn = function (source, parameters, there) {
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
    fn.arity = 1;
    config.globals['_'] = fn;
};
