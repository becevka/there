var fs = require('fs');
var p = require('path');

var parse = require('./parse');
var evaluate = require('./evaluate');
var facet = require('./facet');
var utils = require('./lang/utils');

// Path
var base = process.argv[0];
var isNode = base === 'node' || p.basename(base) == 'node';
var path = isNode ? process.argv[2] : process.argv[1];
var facetPath = isNode ? process.argv[3] : process.argv[2];

var context, parser, evaluator, there;

if (path) {
    if (path.indexOf('.') == -1) {
        path += ".th";
    }

    utils.profiler.enabled = false;
    context = facet(facetPath);
    parser = parse(context);
    evaluator = evaluate(context);
    var cwd = process.cwd();
    there = evaluator.there({
        dir: p.join(cwd, p.dirname(path)),
        file: p.join(cwd, path)
    });

    run(fs.readFileSync(path, "utf-8"), there, parser, evaluator, function () {
        utils.profiler.stats();
        there.close();
    });
} else {
    var stream = initStream();

    var historyPath = '.history';

    if (fs.existsSync(historyPath)) {
        stream.history = fs.readFileSync(historyPath, 'utf-8').split('\n');
        stream.historyIndex = -1;
    }

    context = facet();
    parser = parse(context);
    evaluator = evaluate(context, stream);
    there = evaluator.there();
    there.mode(there.modeNames.auto_read, true);
    var silent = false;

    stream.on('silence', function () {
        silent = !silent;
        console.log('Silent:' + silent);
        stream.prompt();
    });

    stream.on('command', function (input) {
        run(input, there, parser, evaluator, function () {
            stream.prompt();
        }, silent);
    });

    stream.once('close', function () {
        fs.writeFileSync(historyPath, stream.history.join('\n'), 'utf-8');
        there.close();
        process.exit();
    });

    stream.prompt();
}

function run(program, there, parser, evaluator, cb, silent) {
    var parsed = parser.parse(program);
    evaluator.eval(parsed, null, there, function (obj) {
        if (!silent) {
            if (!Array.isArray(obj)) {
                console.log(obj.toString());
            } else {
                console.log(obj);
            }
        }
        cb && cb();
    });
}

function initStream() {

    var completions = ['help', '\\?', 'clear', '\\c', 'silence', '\\s', 'exit', '\\q'];
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
        } else if (['\\s', 'silence'].indexOf(line) !== -1) {
            stream.emit('silence');
        } else {
            stream.emit('command', line);
        }
    });

    stream.on('usage', function () {
        var res = 'usage:';
        res += '\nexit, \\q - close shell and exit';
        res += '\nhelp, \\? - print this usage';
        res += '\nclear, \\c - clear the terminal screen';
        res += '\nsilence, \\s - toggle silence mode';
        console.log(res);
        stream.prompt();
    });

    stream.setPrompt('there>');

    return stream;
}

module.exports = run;



