var env = require('./env');

var there = function (rs, rl) {
    this.type = 'there';
    this.states = [];
    this.properties = {};
    this.resources = rs;
    this.modes = {};
    this.constructors = {};
    this.continuations = {};
    this.out = function (text, flag) {
        flag = flag || 9;
        console.log('\033[9' + flag + 'm' + text + '\033[0m');
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
    //this.mode(this.modeNames.history, true);
};

there.prototype = new env('there');

module.exports = there;
