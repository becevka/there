
function skipSpace(string) {
    var first = string.search(/\S/);
    if (first == -1) {
        return "";
    }
    var skipLines = (string.slice(0, first).match(/\n/g) || []).length;
    var rest = string.slice(first);
    if (rest.charAt(0) == '#') {
        return skipLine(rest);
    }
    return {rest: rest, skipLines: skipLines};
}

function skipLine(string) {
    var first = string.search(/\n/);
    if (first == -1) {
        return {rest: "", skipLines: 0};
    }
    return skipSpace(string.slice(first));
}

function parseNext(string, line, position, synonyms, resources) {
    var skip = skipSpace(string);
    string = skip.rest;
    if (skip.skipLines > 0) {
        line += skip.skipLines;
        position = 1;
    }
    if (!string) {
        return empty();
    }
    var next = sliceNext(string);
    var text = getText(next.text, synonyms);
    var word = parseWord(text, resources);
    string = next.rest;
    var obj = {
        value: word.value,
        type: word.type,
        line: line,
        position: position
    };
    var nextLine = line + next.skipLines;
    var nextPosition = position + 1;
    var type = obj.type;
    if (type == 'block' || type == 'sequence' || type == 'list') {
        obj.getSequence = function () {
            if (!obj.sequence) {
                obj.sequence = parseNext(obj.value, line, position, synonyms, resources);
            }
            return obj.sequence;
        }
    }
    if (string) {
        obj.next = parseNext(string, nextLine, nextPosition, synonyms, resources)
    }
    return obj;
}

function getText(text, synonyms) {
    var synonym = synonyms[text];
    if (synonym != null) {
        return synonym;
    }
    return text;
}

function sliceNext(string) {
    if (string.charAt(0) == ';') {
        return {text: ';', rest: string.slice(1), skipLines: 0}
    }
    var spaceIndex = string.search(/\s|;|\{|\[|\(|\n/);
    var c = string.charAt(0);
    if (c == '"' || c == '\'') {
        return iterate(string, c, c)
    }
    if (c == '{') {
        return iterate(string, c, '}');
    }
    if (c == '(') {
        return iterate(string, c, ')');
    }
    if (c == '[') {
        return iterate(string, c, ']');
    }
    if (spaceIndex == -1) {
        return {text: string.slice(0), rest: '', skipLines: 0}
    }
    return {text: string.slice(0, spaceIndex), rest: string.slice(spaceIndex), skipLines: 0}
}

function iterate(string, start, stop) {
    var i = 1;
    var char;
    var buffer = [];
    buffer[0] = start;
    var escaped = false;
    var skip = 0;
    var lines = 0;
    while ((char = string.charAt(i)) != stop || escaped || skip > 0) {
        if (char == '\\') {
            escaped = true;
        } else {
            buffer[i] = char;
        }
        if (char == start) {
            escaped = false;
            skip++;
        }
        if (char == stop) {
            escaped = false;
            skip--;
        }
        if (char == '\n') {
            lines++;
        }
        i++;
        if (i > string.length) {
            break;
        }
    }
    buffer[i] = stop;
    return {text: buffer.join(''), rest: string.slice(i + 1), skipLines: lines}
}

function parseWord(text, resources) {
    var value = text;
    var type = 'word';
    var start = text.charAt(0);
    var stop = text.charAt(text.length - 1);
    if (/^\d+\b/.exec(text)) {
        type = 'number';
        value = Number(text);
    } else if (start == '@') {
        type = 'resource';
        value = text.slice(1);
        if (resources.indexOf(value) == -1) {
            resources.push(value);
        }
    } else if (start == ';') {
        type = 'switch';
        value = ";";
    } else if ((start == '"' && stop == '"') || (start == '\'' && stop == '\'')) {
        type = 'string';
        value = text.slice(1, text.length - 1);
    } else if ((start == '{' && stop == '}') || (start == '(' && stop == ')') || (start == '[' && stop == ']')) {
        type = start == '(' ? 'sequence' : (start == '[' ? 'list' : 'block');
        value = text.slice(1, text.length - 1).trim();
    }
    return {type: type, value: value};
}

//    sequence: {value:'x', type:'word', line:1, position: 1, next: {value: 'is', type: 'word', line:1, position:2, next : {value: 3, type:'number', line:1, position: 3}}}, resources:['a', 'b']

function empty() {
    return {
        value: "",
        type: "string",
        line: 0,
        position: 0
    };
}

function build(sequence, resources) {
    return {sequence: sequence, resources: resources};
}

module.exports = function(facet) {
    return {
        parse:  function(program) {
            var resources = [];
            if (!program) {
                return build(empty(), resources);
            }
            return build(parseNext(program, 1, 1, facet.synonyms, resources), resources);
        }
    }
};

//TODO lines in block
//TODO position vs column

