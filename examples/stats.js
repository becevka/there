var start = new Date().getTime();

var check = function (what, type) {
    var size = what.filter(function (item) {
        return item == type;
    }).length;
    console.log(' is ' + type + ': ' + size);
};

var r = function (options) {
    var r = Math.floor((Math.random() * options.length));
    return options[r];
};

var generate = function (item, times, options) {
    for (var i = 0; i < times; i++) {
        var generated = r(options);
        if (generated) {
            item.push(generated);
        }
    }
};

var opts = ['red', 'blue', 'green', 'violet', 'yellow', 'brown', 'black', 'pink',
    'white', 'turquoise', 'orange', 'carrot', 'emerald', 'aqua', 'purple',
    'burgundy', 'chocolate', 'sepia', 'mahogany', 'nude'];
var apple = ['apple'];
generate(apple, 1000000, opts);

opts.forEach(function (item) {
    check(apple, item);
});

var end = new Date().getTime();
console.log("Time:" + (end - start) + "ms");
