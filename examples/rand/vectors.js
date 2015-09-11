var vectors = {};

vectors['next'] = function (source, parameters) {
    if (parameters.length > 0 && parameters[0].type == 'list') {
        var options = parameters[0].states;
        var r = Math.floor((Math.random() * options.length));
        return options[r];
    }
    return null;
};
vectors['next'].arity = 1;

module.exports = vectors;