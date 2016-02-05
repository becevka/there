var fs = require('fs');
var p = require('path');

var req = require('./require');

module.exports = function (path, module, libExtend) {
    if (path) {
        if (path.indexOf('.') == -1) {
            path += ".th";
        }

        var cwd = process.cwd();
        var ext = fs.readFileSync(path, "utf-8");
        if (libExtend) {
            ext += '\n' + libExtend;
        }
        var dir = p.join(cwd, p.dirname(path));
        var there = req(module, dir, null, ext);
        there.close();

    }
};