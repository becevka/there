var fs = require('fs');
var path = require('path');

module.exports = function (facetPath, baseDir, parent) {
    facetPath = path.join(baseDir, facetPath);
    var context = require('./facet')(facetPath);
    var parser = require('./parse')(context);
    var evaluator = require('./evaluate')(context, parent && parent.interaction());
    var th = path.join(facetPath, context.index + ".th");
    var there = evaluator.there({
        dir: facetPath,
        file: th
    });
    var program = fs.readFileSync(th, "utf-8");
    var parsed = parser.parse(program);
    evaluator.eval(parsed, null, there, function () {
        console.log(facetPath + " loaded");
    });
    return there;
};