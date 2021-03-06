var utils = require('../lang/utils');

function getCb(parameters) {
    if (parameters.length > 0) {
        var parameter = parameters[0];
        if (utils.isFn(parameter)) {
            return parameter;
        }
        if (utils.isFn(parameter.value)) {
            var res = parameter.value();
            if (utils.isFn(res)) {
                return res;
            }
        }
    }
    return null;
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

function doNext(source, i, cb, there) {
    var env = there.fork('_');
    var sp = utils.specialParams;
    env.resources[sp.i] = there.create('number', i);
    if (source && source.__tr) {
        Object.keys(source).forEach(function (item) {
            if (item.charAt(0) != '_') {
                env.resources[item] = source[item];
            }
        });
    }
    var res = utils.runBlock(source, cb, env, '_');
    there.returns = env.returns.slice();
    res._ft = true;
    return res;
}

module.exports = function (config) {
    config.aliases = {
        'is': '+',
        'are': '+',
        'add': '+',
        'and': '+',
        'for': '=',
        'global': '=>',
        'isnot': '-',
        'arenot': '-',
        'isnt': '-',
        'aint': '-',
        'remove': '-',
        'is!': '-',
        'are!': '-',
        '!': '-',
        '/': '?',
        'else': '||',
        'is?': '?',
        'are?': '?',
        'size': '?',
        'is?!': '?!',
        'are?!': '?!',
        'equals': '==',
        'with': '+=',
        'without': '-=',
        '.': '*',
        'from': ':',
        'each': '_',
        'import': '<<',
        'export': '>>',
        'require': '@',
        '$log': '$print',
        '$debug': '$print?'
    };
    config.phrases = {
        '$ to be $': '$1 = $2',
        'let $ be $': '$1 = $2',
        'is not': '-',
        'are not': '-',
        '$ is a $': '$1 + $2',
        '$ is an $': '$1 + $2',
        '$ is the $': '$1 + $2'

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
    config.resources.time.arity = 0;
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
        cmd: '%', fn: 'rest'
    }, {
        cmd: 'has?', fn: 'has'
    }, {
        cmd: 'has?!', fn: 'has_not'
    }, {
        cmd: '+=', fn: 'extend'
    }, {
        cmd: '-=', fn: 'reduce'
    }, {
        cmd: '==', fn: 'eq'
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
        cmd: '@', fn: 'require'
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
        var cb = getCb(parameters);
        if (utils.isFn(source.next) && cb != null) {
            source.next(function (value) {
                if (there.constructor(value) != null) {
                    there.out('Constructor for ' + value + ' is ignored', 1);
                } else {
                    there.constructor(value, cb);
                }
            });
        }
        return there;
    };
    fn.arity = 1;
    config.globals[':'] = fn;

    var assign = function (source, parameters, there) {
        there = ensure(there);
        source = ensure(source, there);
        var v = there;
        if (parameters.length > 0 && parameters.length > 0) {
            if (utils.isFn(parameters[0]) || utils.isFn(parameters[0].value)) {
                var value = source.type;
                if (source.val != null || source.states.length > 0) {
                    there.out('Assignment for ' + value + ' is ignored', 1);
                    v = source;
                } else {
                    var p = parameters[0];
                    if (utils.isFn(p)) {
                        v = there.create('vector', p);
                    } else {
                        v = p.value(true);
                    }
                    v.type = value;
                    there.properties[value] = v;
                }
            }
        }
        return v;
    };
    assign.arity = 1;
    config.globals['='] = assign;

    fn = function (source, parameters, there) {
        var v = assign(source, parameters, there);
        var value = source.type;
        var val = there.properties[value];
        if (val) {
            if (utils.isFn(there.globalize)) {
                there.globalize(value, val);
            }
        }
        return v;
    };
    fn.arity = 1;
    config.globals['=>'] = fn;

    fn = function (source, parameters, there) {
        there = ensure(there);
        if (parameters.length > 1) {
            var p = parameters[1];
            if (utils.isFn(p.value)) {
                p = p.value();
            }
            return there.mode(parameters[0], 'on' == p);
        } else if (parameters.length > 0) {
            return there.mode(parameters[0]);
        }
        return there;
    };
    config.globals['mode'] = fn;

    fn = function (source, parameters, there) {
        there = ensure(there);
        source = ensure(source, there);
        var cb = getCb(parameters);
        if (utils.isFn(source.next) && cb != null) {
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
                there.continuation(vector, target, effect, cb);
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
        var cb = getCb(parameters);
        if (cb != null) {
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
            } else if (typeof source === 'number' || there.isOf(source, 'number')) {
                var sp = utils.specialParams;
                var env = there.fork('_');
                for (i = 0; i < source; i++) {
                    env.reflected = true;
                    env.properties = Object.create(there.properties);
                    env.resources[sp.i] = there.create('number', i);
                    res = utils.runBlock(source, cb, env, '_');
                    res._ft = true;
                }
                there.returns = env.returns.slice();
            } else if (typeof source === 'string' || there.isOf(source, 'string')) {
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

    fn = function (source, parameters, there) {
        var cb = getCb(parameters);
        var res = there;
        if (cb != null && !source._ft) {
            res = doNext(source, 1, cb, there);
        } else {
            res = source;
        }
        return res;
    };
    fn.arity = 1;
    config.globals['||'] = fn;

    config.history = new history();
};

var history = function () {
    this.addition = {};
    this.reduction = {};
};

history.prototype = {
    check: function (inspections) {
        var vector = inspections.vector;
        var source = inspections.source;
        var params = inspections.params;
        var param = params ? params[0] : null;
        var skip = false;
        if (source == null || !source.type || !utils.isFn(source.valueType)) {
            skip = true;
        } else if (source.valueType(source) || source.valueType(source.val)) {
            skip = true;
        } else if (utils.isFn(param)) {
            skip = true;
        } else if (source.valueType(param)) {
            skip = true;
        }

        var type = vector.type;
        if (type == '+' && !skip) {
            this.introduce(source, param);
            return source;
        } else if (type == '-' && !skip) {
            this.reduce(source, param);
            return source;
        } else if (type == '?' || type == 'print?' || type == 'print' || type == 'error') {
            source = this.apply(source);
            return vector.invoke(source, inspections.params, inspections.env, inspections.paramNames);
        } else {
            return vector.invoke(inspections.source, inspections.params, inspections.env, inspections.paramNames);
        }
    },
    introduce: function (source, param) {
        var type = source.type;
        var exists = this.addition[type];
        if (exists == null) {
            this.addition[type] = exists = [];
        }
        exists.push(param);
        this.addBeforeEval(source);
        return source;
    },
    reduce: function (source, param) {
        var type = source.type;
        var exists = this.reduction[type];
        if (exists == null) {
            this.reduction[type] = exists = [];
        }
        exists.push(param);
        this.addBeforeEval(source);
        return source;
    },
    apply: function (source) {
        if (!source) {
            return source;
        }
        var type = source.type;
        var exists = this.addition[type];
        if (exists != null) {
            source.is(exists);
        }
        delete this.addition[type];
        exists = this.reduction[type];
        if (exists != null) {
            source.not(exists);
        }
        delete this.reduction[type];
        return source;
    },
    addBeforeEval: function (source) {
        if (!source.beforeEval) {
            source.beforeEval = function () {
                this.apply(source);
            }.bind(this);
        }
    },
    reload: function () {
        this.addition = {};
        this.reduction = {};
    }

};