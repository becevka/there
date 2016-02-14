module.exports = function (config) {
    config.globals = {
        toLower: function(source, parameters, there) {
            return there.create('string', source.value().toLowerCase());
        },
        toUpper: function(source, parameters, there) {
            return there.create('string', source.value().toUpperCase());
        },
        toChars: function(source, parameters, there) {
            return there.create('list', source.value().split(''));
        },
        sort: function(source, parameters, there) {
            return there.create('list', source.value().sort());
        }
    };
    config.globals['toLower'].arity = 0;
    config.globals['toUpper'].arity = 0;
    config.globals['toChars'].arity = 0;
    config.globals['sort'].arity = 0;
    config.index = 'index';
};
