var fs = require('fs');

var parse = require('./parse');
var evaluate = require('./evaluate');
var facet = require('./facet');

// Path
var base = process.argv[0];

var path = base === 'node' ? process.argv[2] : process.argv[1];

var facetPath = base === 'node' ? process.argv[3] : process.argv[2];

var context, parser, evaluator, there;

if (path) {
    if (path.indexOf('.') == -1) {
        path += ".th";
    }

    context = facet(facetPath);
    parser = parse(context);
    evaluator = evaluate(context);
    there = evaluator.there();

    run(fs.readFileSync(path, "utf-8"), there, parser, evaluator, function () {
        there.close();
    });
} else {
    var cli = require('cline')();

    context = facet();
    parser = parse(context);
    evaluator = evaluate(context, cli.stream);
    there = evaluator.there();

    cli.command('{expression}', 'parses expression', {expression: '.+'}, function (input) {
        run(input, there, parser, evaluator, function () {
            cli.prompt('there>');
        });
    });

    cli.prompt('there>');

    cli.on('close', function () {
        there.close();
        process.exit();
    });
}


function run(program, there, parser, evaluator, cb) {
    var parsed = parser.parse(program);
    evaluator.eval(parsed, null, there, function (obj) {
        console.log(obj.toString());
        cb && cb();
    });
}

module.exports = run;



