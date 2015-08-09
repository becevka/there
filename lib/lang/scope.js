var element = require('./element');

var scope = function (type) {
    this.type = type;
    this.states = [];
    this.properties = {};
};

scope.prototype = new element();

scope.prototype.set = function (element, name) {
    if (element.type) {
        this.properties[element.type] = element;
    } else if (name) {
        this.properties[name] = element;
    }
    return this;
};

scope.prototype.get = function (type) {
    return this.properties[type];
};

scope.prototype.remove = function (type) {
    console.log("hello remove" + type)
    delete this.properties[type];
    console.log("hello check" + Object.keys(this.properties))
    return this;
};

scope.prototype.has = function (type) {
    return this.properties.hasOwnProperty(type) ? 1 : 0;
};

scope.prototype.has_not = function (type) {
    return !this.has(type);
};


module.exports = scope;