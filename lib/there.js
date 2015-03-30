var fs = require('fs');

var parse = require('./parse');
var vectors = require('./integ/vectors');
var resources = require('./integ/resources');
var evaluate = require('./evaluate');

// Path
var base = process.argv[0];

var path = base === 'node' ? process.argv[2] : process.argv[1];

var bundlePath = base === 'node' ? process.argv[3] : process.argv[2];

var evaluator, there;

var bundle = {};
if (path) {
    if (bundlePath) {
        bundle.user = JSON.parse(fs.readFileSync(bundlePath, "utf-8"));
    }
    if (path.indexOf('.') == -1) {
        path += ".th";
    }
    evaluator = evaluate(bundle);
    there = evaluator.there();
    run(fs.readFileSync(path, "utf-8"), there, evaluator, function() {
        there.close();
    });
} else {
    var cli = require('cline')();
    evaluator = evaluate(bundle, cli.stream);
    there = evaluator.there();

    cli.command('{expression}', 'parses expression', {expression: '.+'}, function (input) {
        run(input, there, evaluator, function() {
            cli.prompt('there>');
        });
    });

    cli.prompt('there>');

    cli.on('close', function () {
        there.close();
        process.exit();
    });
}


function run(program, there, evaluator, cb) {
    var parsed = parse(program);
    evaluator.eval(parsed, null, there, function(obj) {
        console.log(obj.toString());
        cb && cb();
    });
}

module.exports = run;



