var env = require('./env');

var there = function (rs, rl, globals) {
    this.type = 'there';
    this.states = [];
    this.properties = {};
    this.resources = rs;
    this.modes = {};
    this.constructors = {};
    this.continuations = {};
    this.out = function (text, flag) {
        if (flag) {
            console.log('\033[3' + flag + 'm' + text + '\033[0m');
        } else {
            console.log(text);
        }
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
    this.globalize = function (name, obj) {
        if (globals) {
            globals[name] = obj;
        }
    };
    //this.mode(this.modeNames.history, true);
};

there.prototype = new env('there');

module.exports = there;
