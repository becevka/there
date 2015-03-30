var resources = {};

resources['print'] = function(source, parameters, there) {
    there = ensure(there);
    source = ensure(source, there);
    if(source.value) {
        there.out(source.value());
    } else {
        there.out(JSON.stringify(source));
    }
    return source;
};

resources['print?'] = function(source, parameters, there) {
    there = ensure(there);
    source = ensure(source, there);
    there.out(JSON.stringify(source));
    return source;
};


function ensure(obj, def) {
    if(obj != null) {
        return obj;
    }
    if(def != null) {
        return def;
    }
    return {};
}

module.exports = resources;