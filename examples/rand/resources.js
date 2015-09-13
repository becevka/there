var resources = {};

resources['rand'] = function (source, parameters, there) {
    if (parameters.length > 0 && parameters[0].type == 'list') {
        var options = parameters[0].states;
        var r = Math.floor((Math.random() * options.length));
        return there.create('word', options[r]);
    }
    return null;
};

resources['rand'].arity = 1;

module.exports = resources;