var fs = require('fs');
var path = require('path');

module.exports = function (facetConfig) {

    var res = {
        resources: {},
        vectors: {},
        synonyms: {},
        index: 'index'
    };

    var config = getDefaultConfig();
    res = useConfig(res, config);
    if (facetConfig) {
        config = getFacetConfig(facetConfig);
        res = useConfig(res, config);
    }
    return res;
};

function getFacetConfig(configFile) {
    if (fs.existsSync(configFile)) {
        return readConfig(configFile);
    }
    return getDefaultConfig();
}

function getDefaultConfig() {
    return readConfig('integ/th.json');
}

function readConfig(file) {
    file = path.join(__dirname, file);
    var config = JSON.parse(fs.readFileSync(file, 'utf-8'));
    config.baseDir = path.dirname(file);
    return completeConfig(config);
}


function useConfig(res, config) {
    var baseDir = config.baseDir;
    addFromArray(res.resources, config.resources, baseDir);
    addFromArray(res.vectors, config.vectors, baseDir);
    addFromArray(res.synonyms, config.synonyms, baseDir);
    if (config.index) {
        res.index = config.index;
    }
    return res;
}

function addFromArray(target, array, baseDir) {
    if (!array) {
        return target;
    }
    if (!Array.isArray(array)) {
        array = [array];
    }
    array.forEach(function (item) {
        item = path.join(baseDir, item);
        var obj = require(item);
        Object.keys(obj).forEach(function (key) {
            target[key] = obj[key];
        })
    });
}

function completeConfig(config) {
    return {
        baseDir: config.baseDir || '/',
        vectors: config.vectors || [],
        resources: config.resources || [],
        synonyms: config.synonyms || [],
        index: config.index || 'index'
    };
}
