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

function parseNext(string, line, position, aliases, resources) {
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
    var text = getText(next.text, aliases);
    var word = parseWord(text, resources);
    string = next.rest;
    var obj = {
        value: word.value,
        type: word.type,
        line: line,
        position: position,
        toString: function () {
            var res = this.value;
            if (this.next) {
                res += ' ' + this.next.toString();
            }
            return res;
        }
    };
    var nextLine = line + next.skipLines;
    var nextPosition = position + 1;
    var type = obj.type;
    if (type == 'block' || type == 'sequence' || type == 'list' || type == 'table') {
        obj.getSequence = function () {
            if (!obj.sequence) {
                var als = aliases;
                if (type == 'sequence' || type == 'table') {
                    als = {};
                }
                obj.sequence = parseNext(obj.value, line, position, als, resources);
            }
            return obj.sequence;
        }
    }
    if (string) {
        obj.next = parseNext(string, nextLine, nextPosition, aliases, resources)
    }
    return obj;
}

function getText(text, aliases) {
    var alias = aliases[text];
    if (alias != null) {
        return alias;
    }
    return text;
}

function sliceNext(string) {
    if (string.charAt(0) == ';') {
        return {text: ';', rest: string.slice(1), skipLines: 0}
    }
    var spaceIndex = string.search(/\s|;|\{|\[|\(|\n/);
    var c = string.charAt(0);
    if (isStringChar(c)) {
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
    if (c == '|') {
        return iterate(string, c, '|');
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
    var isString = isStringChar(start);
    while ((char = string.charAt(i)) != stop || escaped || skip > 0) {
        var next = string.charAt(i + 1);
        if (isString && char == '\\' && isStringChar(next)) {
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
    } else if (start == '$') {
        type = 'resource';
        value = text.slice(1);
        if (resources.indexOf(value) == -1) {
            resources.push(value);
        }
    } else if (start == ';') {
        type = 'switch';
        value = ";";
    } else if (start === stop && isStringChar(start)) {
        type = 'string';
        value = text.slice(1, text.length - 1);
    } else if (value != '||' && ((start == '{' && stop == '}') || (start == '(' && stop == ')') ||
        (start == '[' && stop == ']') || (start == '|' && stop == '|'))) {
        type = start == '(' ? 'sequence' : (start == '[' ? 'list' : (start == '|' ? 'table' : 'block'));
        value = text.slice(1, text.length - 1).trim();
    }
    return {type: type, value: value};
}

function isStringChar(c) {
    return c == '"' || c == "'";
}

function empty() {
    return {
        value: null,
        type: "string",
        line: 0,
        position: 0
    };
}

function build(sequence, resources) {
    return {sequence: sequence, resources: resources};
}

var prepared = {};

var getPrepared = function (phrase, facet) {
    var p = prepared[phrase];
    if (!p) {
        var seq = parseNext(phrase, 1, 1, facet.aliases, []);
        var replacement = parseNext(facet.phrases[phrase], 1, 1, facet.aliases, []);
        prepared[phrase] = p = {sequence: seq, replacement: replacement}
    }
    return p;
};

var matches = function (phraseObj, programObj) {
    if (phraseObj == null || programObj == null) {
        return false;
    }
    var type = phraseObj.type;
    var value = phraseObj.value;
    if (type == 'resource' && (value == '' || value == type)) {
        return true;
    } else if (type == programObj.type && value == programObj.value) {
        return true;
    }
    return false;
};

var replace = function (target, subs, replacement, params) {
    var line = target ? target.line : 1;
    var pos = target ? target.position : 1;
    var next = replacement;
    var c = copy(next, line, pos, params);
    var res = {};
    if (!target) {
        target = c;
        res.top = target;
    } else {
        res.top = target;
        target.next = c;
        target = c;
    }
    while ((next = next.next) != null) {
        c = copy(next, line, pos, params);
        target.next = c;
        target = c;
    }
    if (subs) {
        target.next = subs;
    }
    res.last = c;
    return res;
};

var copy = function (from, line, position, params) {
    if (from.type == 'resource') {
        return copy(params[parseInt(from.value) - 1], line, position, []);
    }
    var res = {type: from.type, value: from.value, line: line, position: position};
    if (from.line != null) {
        res.line = from.line;
    }
    if (from.position != null) {
        res.position = from.position;
    }
    if (from.getSequence != null) {
        res.getSequence = from.getSequence;
    }
    if (from.toString() != null) {
        res.toString = from.toString;
    }
    return res;
};

module.exports = function (facet) {
    return {
        parse: function (program) {
            var resources = [];
            program = program.trim();
            var sequence;
            if (!program) {
                sequence = empty();
            } else {
                sequence = parseNext(program, 1, 1, facet.aliases, resources);
                Object.keys(facet.phrases).forEach(function (phrase) {
                    var prepared = getPrepared(phrase, facet);
                    var next = {next: sequence};
                    var check = prepared.sequence;
                    var params = [];
                    var target, match, res;
                    while ((next = next.next) != null) {
                        match = matches(check, next);
                        if (match) {
                            if (check.type == 'resource') {
                                params.push(next);
                            }
                            check = check.next;
                            if (check == null) {
                                res = replace(target, next.next, prepared.replacement, params);
                                if (!target) {
                                    sequence = res.top;
                                }
                                target = next;
                                check = prepared.sequence;
                            }
                        } else if (check != prepared.sequence) {
                            check = prepared.sequence;
                            target = target ? target.next : sequence;
                            next = target;
                            params = [];
                        } else {
                            target = next;
                            params = [];
                        }
                    }
                });
            }
            return build(sequence, resources);
        }
    }
};

//TODO lines in block
//TODO position vs column

