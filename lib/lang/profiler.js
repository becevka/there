var profiler = function () {
    this.enabled = false;
    this.init();
};

profiler.prototype = {
    init: function () {
        this.inspections = {};
        this.runners = {};
    },

    time: function () {
        return new Date().getTime();
    },

    start: function (inspection) {
        if(!this.enabled) return;
        var time = this.time();
        var runner = this.runners[inspection];
        if (runner) {
            this.end(inspection);
        }
        this.runners[inspection] = time;
    },

    end: function (inspection) {
        if(!this.enabled) return;
        var time = this.time();
        var runner = this.runners[inspection];
        var r = 0;
        if (runner) {
            r = time - runner;
            this.add(inspection, r);
        }
        delete this.runners[inspection];
        return r;
    },

    add: function (inspection, time) {
        if(!this.enabled) return;
        var ex = this.inspections[inspection];
        if (!ex) {
            ex = 0;
        }
        this.inspections[inspection] = ex + time;
    },

    stats: function () {
        if(!this.enabled) return;
        Object.keys(this.runners).forEach(function (key) {
            this.end(key);
        }, this);
        Object.keys(this.inspections).forEach(function (key) {
            console.log(key + ":" + this.inspections[key]);
        }, this);
        return this.inspections;
    }
};

module.exports = profiler;
