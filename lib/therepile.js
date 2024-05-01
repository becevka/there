var fs = require('fs');
var p = require('path');

var parse = require('./parse');
var facet = require('./facet');
var utils = require('./lang/utils');

// Path
var base = process.argv[0];
var isNode = base === 'node' || p.basename(base) == 'node';
var path = isNode ? process.argv[2] : process.argv[1];
var facetPath = isNode ? process.argv[3] : process.argv[2];

var context, parser, evaluator, there;

if (path) {

    if (fs.lstatSync(path).isDirectory()) {
        path += '/index.th';
    }

    context = facet(facetPath);
    parser = parse(context);

    var obj = parser.parse(fs.readFileSync(path, "utf-8"));
    if (obj.sequence && !obj.getSequence) {
        obj = obj.sequence;
    }
    console.log(walk(obj));
}

function walk(obj) {
    var res = '';
    while (obj) {
        var type = obj.type;
        var val = obj.value;
        switch (type) {
            case 'switch':
                res += val;
                break;
            case 'string':
                res += ' "' + val + '"';
                break;
            case 'template':
                res += ' `' + val + '`';
                break;
            case 'resource':
                res += ' $' + val;
                break;
            case 'list':
                res += ' [' + walk(obj.getSequence()) + ']';
                break;
            case 'table':
                res += ' |' + walk(obj.getSequence()) + '|';
                break;
            case 'sequence':
                res += ' (' + walk(obj.getSequence()) + ')';
                break;
            case 'block':
                res += ' {' + walk(obj.getSequence()) + '}';
                break;
            default:
                res += ' ' + obj.value;
                break;
        }
        obj = obj.next;
    }
    return res;
}



