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
    var stream = initStream();

    context = facet();
    parser = parse(context);
    evaluator = evaluate(context, stream);
    there = evaluator.there();

    stream.on('command', function (input) {
        run(input, there, parser, evaluator, function () {
            stream.prompt();
        });
    });

    stream.once('close', function () {
        there.close();
        process.exit();
    });

    stream.prompt();
}

function run(program, there, parser, evaluator, cb) {
    var parsed = parser.parse(program);
    evaluator.eval(parsed, null, there, function (obj) {
        console.log(obj.toString());
        cb && cb();
    });
}

function initStream() {

    var completions = ['help', '\\?', 'clear', '\\c', 'exit', '\\q'];
    var completer = function (line) {
        return [completions, line]
    };

    var stream = require('readline').createInterface(process.stdin, process.stdout, completer, true);

    stream.on('line', function (line) {
        if (!line) {
            stream.prompt();
        } else if (['\\q', 'exit'].indexOf(line) !== -1) {
            stream.emit('close');
        } else if (['\\?', 'help'].indexOf(line) !== -1) {
            stream.emit('usage');
        } else if (['\\c', 'clear'].indexOf(line) !== -1) {
            stream.write(null, {ctrl: true, name: 'l'});
        } else {
            stream.emit('command', line);
        }
    });

    stream.on('usage', function () {
        var res = 'usage:';
        res += '\nexit, \\q - close shell and exit';
        res += '\nhelp, \\? - print this usage';
        res += '\nclear, \\c - clear the terminal screen';
        console.log(res);
        stream.prompt();
    });

    stream.setPrompt('there>');

    return stream;
}

module.exports = run;



