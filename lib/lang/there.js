var env = require('./env');

var there = function (rs, rl) {
    this.type = 'there';
    this.states = [];
    this.properties = {};
    this.resources = rs;
    this.constructors = {};
    this.continuations = {};
    this.out = function (text) {
        console.log(text);
    };
    this.ask = function (text, cb) {
        rl.question(text, function (answer) {
            cb(answer);
        });
    };
    this.close = function () {
        rl.close();
    };
    this.interaction = function () {
        return rl;
    };
};

there.prototype = new env('there');

module.exports = there;
