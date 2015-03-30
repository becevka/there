var should = require('should');
var p = require('../lib/parse');


var parse = function(text) {
    return p(text).sequence;
};

describe('parse', function () {
    it('should parse symbol', function () {
        var parsed = parse('x');
        should.exist(parsed);
        parsed.value.should.equal('x', 'name');
    });
    it('should parse line', function () {
        var parsed = parse('x is 0');
        should.exist(parsed.next.next);
        parsed.value.should.equal('x', 'name');
    });
    it('should parse out comment line', function () {
        var parsed = parse('#test \n a');
        should.exist(parsed);
        parsed.value.should.equal('a', 'name');
        parsed.line.should.equal(2);
        parsed.position.should.equal(1);
    });
    it('should parse into comment line', function () {
        var parsed = parse('a # x is 0');
        should.exist(parsed);
        parsed.value.should.equal('a', 'name');
    });
    it('should parse number', function () {
        var parsed = parse('x is 0');
        should.exist(parsed.next.next);
        parsed.next.next.value.should.equal(0, 'number');
    });
    it('should parse string', function () {
        var parsed = parse('x is "a"');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal("a", value);
    });
    it('should parse two strings', function () {
        var parsed = parse('"Hello " + "world" @print');
        should.exist(parsed.next.next.next);
        var value = parsed.next.next.next.value;
        value.should.equal("print", value);
    });
    it('should parse string 2', function () {
        var parsed = parse("x is 'a'");
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal('a', value);
    });
    it('should parse string with space', function () {
        var parsed = parse('x is "a man"');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal("a man", value);
    });
    it('should parse string with space2', function () {
        var parsed = parse("x is 'a man'");
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal("a man", value);
    });
    it('should parse escaped string', function () {
        var parsed = parse('x is "a \\" b"');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal('a " b', value);
    });
    it('should parse escaped string 2', function () {
        var parsed = parse("x is 'a \\' b'");
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal("a ' b", value);
    });
    it('should parse resource', function () {
        var parsed = parse('@print x');
        parsed.type.should.equal("resource", parsed.type);
        parsed.value.should.equal("print", parsed.value);
    });
    it('should parse block', function () {
        var parsed = parse('x is { @print x }');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("block", parsed.next.next.type);
        value.should.equal("@print x", value);
    });
    it('should parse seq', function () {
        var parsed = parse('x is ( a b )');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("sequence", parsed.next.next.type);
        value.should.equal("a b", value);
    });
    it('should parse list', function () {
        var parsed = parse('x is [ a b ]');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("list", parsed.next.next.type);
        value.should.equal("a b", value);
    });
    it('should parse block sequence', function () {
        var parsed = parse('x is { @print x }');
        var next = parsed.next.next;
        next.type.should.equal("block", next.type);
        next.value.should.equal("@print x", next.value);
        next.getSequence().next.value.should.equal("x", "sequence");
    });
    it('should parse block sequence without spaces', function () {
        var parsed = parse('x is{@print x}');
        var next = parsed.next.next;
        next.type.should.equal("block", next.type);
        next.value.should.equal("@print x", next.value);
        next.getSequence().next.value.should.equal("x", "sequence");
    });
    it('should parse inner block', function () {
        var parsed = parse('x is { y is { @print x } }');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("block", parsed.next.next.type);
        value.should.equal("y is { @print x }", value);
    });
    it('should parse multi line', function () {
        var parsed = parse('x is 0 \n   \n y is 2');
        var next = parsed.next.next.next.next;
        should.exist(next);
        next.line.should.equal(3);
        next.position.should.equal(2);
    });
    it('should parse multi line string', function () {
        var parsed = parse('x is "a \n b"');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal('a \n b', value);
    });
    it('should parse multi line block', function () {
        var parsed = parse('x is { @print x \n y is { @print x } }');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("block", parsed.next.next.type);
        value.should.equal("@print x \n y is { @print x }", value);
    });
    it('should parse correct line in multi line string', function () {
        var parsed = parse('x is "a \n b" \n @print x');
        should.exist(parsed.next.next.next.next);
        parsed.next.next.next.next.line.should.equal(3, 'line');
    });
    it('should parse context switch', function () {
        var parsed = parse('x is "a"; @print x');
        should.exist(parsed.next.next.next);
        parsed.next.next.next.type.should.equal('switch');
    });
    it('should parse constructor', function () {
        var parsed = parse('x is { a is "a" }; (a): x ');
        should.exist(parsed.next.next.next.next.next);
        parsed.next.next.next.next.next.value.should.equal(':');
    });
});