var fs = require('fs');
var path = require('path');
var utils = require('./lang/utils');

module.exports = function (facetConfig) {
    var config = getDefaultConfig();
    if (facetConfig) {
        var cfg = getFacetConfig(facetConfig);
        utils.extend(config.resources, cfg.resources);
        utils.extend(config.aliases, cfg.aliases);
        utils.extend(config.globals, cfg.globals);
        if (cfg.index) {
            config.index = cfg.index;
        }
    }
    return config;
};

function getFacetConfig(configFile) {
    return readConfig(configFile);
}

function getDefaultConfig() {
    return readConfig('integ');
}

function readConfig(file) {
    file = path.join(file, "config.js");
    if (!fs.existsSync(file)) {
        file = path.join(__dirname, file);
    }
    var config = emptyConfig();
    config.baseDir = path.dirname(file);
    require(file)(config);
    return config;
}

function emptyConfig() {
    return {
        resources: {},
        aliases: {},
        globals: {}
    };
}