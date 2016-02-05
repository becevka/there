var fs = require('fs');
var path = require('path');

module.exports = function (facetPath, baseDir, parent, programExtend) {
    var filePath = path.join(baseDir, facetPath);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, '../modules_there/', facetPath);
    }
    var context = require('./facet')(filePath);
    var parser = require('./parse')(context);
    var evaluator = require('./evaluate')(context, parent && parent.interaction());
    var th = path.join(filePath, context.index + ".th");
    var there = evaluator.there({
        dir: facetPath,
        file: th
    });
    var program = null;
    if (fs.existsSync(th)) {
        program = fs.readFileSync(th, "utf-8");
    }
    if (programExtend) {
        program = program || '';
        program += '\n' + programExtend
    }
    if (program != null) {
        var parsed = parser.parse(program);
        evaluator.eval(parsed, null, there, function () {
            if (parent) {
                console.log(filePath + " loaded");
            }
        });
    }
    return there;
};