var fs = require('fs');
var path = require('path');

function isFn(v) {
    return typeof v == 'function';
}

module.exports = function (config) {
    config.resources.file = function (source, parameters, there) {
        var val = null;
        var file = parameters[0];
        if (isFn(file.value)) {
            file = file.value();
        }
        if (!fs.existsSync(file)) {
            file = path.join(there.dir, file);
        }
        if (source && source != there) {
            if (typeof source === 'string' || (source.type && source.type == 'string')) {
                var txt = source;
                if (isFn(txt.value)) {
                    txt = txt.value();
                }
                fs.writeFileSync(file, txt, "utf-8");
            } else {
                val = fs.readFileSync(file, "utf-8");
            }
        } else {
            val = fs.readFileSync(file, "utf-8");
        }
        if (val != null) {
            var name = source.type || source;
            there.properties[name] = there.create("string", val);
        }
        return source;
    };
    config.index = 'index';
};
