var should = require('should');
var p = require('../lib/parse');
var facet = require('../lib/facet');

var context = facet();
var parser = p(context);
var parse = function(text) {
    return parser.parse(text).sequence;
};

describe('parsing', function () {
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
        var parsed = parse('"Hello " + "world" $print');
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
    it('should not miss parse escapes', function () {
        var parsed = parse('x is "a \\d b"');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal('a \\d b', value);
    });
    it('should parse escaped string 2', function () {
        var parsed = parse("x is 'a \\' b'");
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal("a ' b", value);
    });
    it('should parse template', function () {
        var parsed = parse("x is `${2 + 3}`");
        should.exist(parsed.next.next);
        parsed.next.next.type.should.equal("template", parsed.next.next.type);
        var value = parsed.next.next.value;
        value.should.equal("${2 + 3}", value);
    });
    it('should parse escaped template', function () {
        var parsed = parse("x is `${2 \\` 3}`");
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal("${2 ` 3}", value);
    });
    it('should parse resource', function () {
        var parsed = parse('$print x');
        parsed.type.should.equal("resource", parsed.type);
        parsed.value.should.equal("print", parsed.value);
    });
    it('should parse block', function () {
        var parsed = parse('x is { $print x }');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("block", parsed.next.next.type);
        value.should.equal("$print x", value);
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
    it('should parse table', function () {
        var parsed = parse('x is | a b c |');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("table", parsed.next.next.type);
        value.should.equal("a b c", value);
    });
    it('should skip empty table', function () {
        var parsed = parse('x is ||');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("word", parsed.next.next.type);
        value.should.equal("||", value);
    });
    it('should parse table sequence', function () {
        var parsed = parse('x is | a b c |');
        var next = parsed.next.next;
        should.exist(next);
        var value = next.value;
        next.type.should.equal("table", next.type);
        value.should.equal("a b c", value);
        next.getSequence().next.value.should.equal("b", "sequence");
    });
    it('should parse block sequence', function () {
        var parsed = parse('x is { $print x }');
        var next = parsed.next.next;
        next.type.should.equal("block", next.type);
        next.value.should.equal("$print x", next.value);
        next.getSequence().next.value.should.equal("x", "sequence");
    });
    it('should parse block sequence without spaces', function () {
        var parsed = parse('x is{$print x}');
        var next = parsed.next.next;
        next.type.should.equal("block", next.type);
        next.value.should.equal("$print x", next.value);
        next.getSequence().next.value.should.equal("x", "sequence");
    });
    it('should parse inner block', function () {
        var parsed = parse('x is { y is { $print x } }');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("block", parsed.next.next.type);
        value.should.equal("y is { $print x }", value);
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
    it('should parse multi line template', function () {
        var parsed = parse('x is `a \n b`');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        value.should.equal('a \n b', value);
    });
    it('should parse multi line block', function () {
        var parsed = parse('x is { $print x \n y is { $print x } }');
        should.exist(parsed.next.next);
        var value = parsed.next.next.value;
        parsed.next.next.type.should.equal("block", parsed.next.next.type);
        value.should.equal("$print x \n y is { $print x }", value);
    });
    it('should parse correct line in multi line string', function () {
        var parsed = parse('x is "a \n b" \n $print x');
        should.exist(parsed.next.next.next.next);
        parsed.next.next.next.next.line.should.equal(3, 'line');
    });
    it('should parse context switch', function () {
        var parsed = parse('x is "a"; $print x');
        should.exist(parsed.next.next.next);
        parsed.next.next.next.type.should.equal('switch');
    });
    it('should parse constructor', function () {
        var parsed = parse('x is { a is "a" }; (a): x ');
        should.exist(parsed.next.next.next.next.next);
        parsed.next.next.next.next.next.value.should.equal(':');
    });
    it('should avoid empty endings', function () {
        var parsed = parse('x is "a man" ');
        should.not.exist(parsed.next.next.next);
        parsed = parse('x is "a man" ; x');
        var value = parsed.next.next.next;
        value.type.should.equal('switch');
        parsed = parse(' {x is  "a man"  } x ');
        should.not.exist(parse(parsed.value).next.next.next);
    });
    it('should read aliases', function () {
        var parsed = parse('x is "a man" ');
        parsed.next.value.should.equal('+');
    });
    it('should skip aliases in  sequences', function () {
        var parsed = parse('{$a and $b} ($a and $b) $a and $b ');
        parsed.value.should.equal('$a and $b');
        parsed.getSequence().next.value.should.equal('+');
        parsed.next.value.should.equal('$a and $b');
        parsed.next.getSequence().next.value.should.equal('and');
        parsed.next.next.next.value.should.equal('+');
    });
    it('should read phrases', function () {
        var parsed = parse('x is not "a man" ');
        parsed.value.should.equal('x');
        parsed.next.value.should.equal('-');
        parsed.next.next.value.should.equal('a man');
    });
    it('should read many phrases', function () {
        var parsed = parse('x is not "a man"; c to be "a man"');
        parsed.next.value.should.equal('-');
        parsed.next.next.next.next.value.should.equal('c');
        parsed.next.next.next.next.next.value.should.equal('=');
        parsed.next.next.next.next.next.next.value.should.equal('a man');
    });
    it('should skip articles phrases', function () {
        var parsed = parse('x is a man; c is an old');
        parsed.next.next.value.should.equal('man');
        parsed.next.next.next.next.next.next.value.should.equal('old');
    });
    it('should read regexp phrases', function () {
        var parsed = parse('let x be 0; let y be 1');
        parsed.value.should.equal('x');
        parsed.next.value.should.equal('=');
        parsed.next.next.value.should.equal(0);
        parsed.next.next.next.value.should.equal(';');
        parsed.next.next.next.next.value.should.equal('y');
        parsed.next.next.next.next.next.value.should.equal('=');
        parsed.next.next.next.next.next.next.value.should.equal(1);
    });
    it('should not replace phrases in text', function () {
        var parsed = parse('let x be "I say let y be 1"');
        parsed.value.should.equal('x');
        parsed.next.value.should.equal('=');
        parsed.next.next.value.should.equal("I say let y be 1");
    });
    it('should not replace phrases in not parsed block', function () {
        var parsed = parse('let x be { let y be 1 }');
        parsed.value.should.equal('x');
        parsed.next.value.should.equal('=');
        parsed.next.next.value.should.equal("let y be 1");
    });
});