module.exports = function (config) {
    var fn = function (source, parameters, there) {
        if (parameters.length > 0 && parameters[0].type == 'list') {
            var options = parameters[0].states;
            var r = Math.floor((Math.random() * options.length));
            return there.create('word', options[r]);
        }
        return null;
    };
    fn.arity = 1;
    config.resources.rand = fn;
};
