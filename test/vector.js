var should = require('should');
var p = require('../lib/parse');
var facet = require('../lib/facet');
var e = require('../lib/evaluate');

var context = facet();
var parser = p(context);
var evaluator = e(context);
var there = evaluator.there.bind(evaluator);
var evaluate = evaluator.eval.bind(evaluator);
var parse = parser.parse.bind(parser);

function createOut(string) {
    return there({
        out: function (text) {
            String(text).should.containEql(string);
        }
    });
}

describe('vector', function () {
    it('should run block', function () {
        var obj = evaluate(parse('a = { book is red }; a'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should run block with parameter', function () {
        var obj = evaluate(parse('a = { book is $1 }; a red'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should run access top resources in block', function () {
        var t = createOut('book');
        evaluate(parse('a = { book $print }; a'), null, t);
    });
    it('should run two statement and return last', function () {
        var obj = evaluate(parse('book is red is green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should run block with parameters', function () {
        var obj = evaluate(parse('a = { book is $1; book is $2 }; a red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should auto read parameters', function () {
        var obj = evaluate(parse('mode auto-read on; a = { book is $color; book is $color2 }; a red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should should support arity parameters', function () {
        var obj = evaluate(parse('a = { book is $1 }(1); a red pear is white'));
        should.exist(obj);
        obj.value().should.equal('pear');
        obj.size('white').should.equal(1);
    });
    it('should run block with side effect on element', function () {
        var obj = evaluate(parse('color = { $el is red }; book color; book '));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should run block without side effect on other params', function () {
        var obj = evaluate(parse('color = { $a is red }; color ($a) test; test '));
        should.exist(obj);
        obj.value().should.equal('test');
        obj.size('red').should.equal(0);
    });
    it('should create named parser', function () {
        var obj = evaluate(parse('a = { book is $a; book is $b }; a ($a $b) red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named and value parser', function () {
        var obj = evaluate(parse('a = { book is $a; book is $b }; a ($a and $b) red and green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named and wildcard parser', function () {
        var obj = evaluate(parse('a = { book is $a; book is $b }; a ($a * $b) red and green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named parser and not eval the words', function () {
        var t = createOut();
        var obj = evaluate(parse('a = { book is $a; book is $b }; a ($a * $b) red and green'), null, t);
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        t.size('and').should.equal(0);
    });
    it('should create named and regex parser', function () {
        var obj = evaluate(parse('a = { book is $a; book is $b }; a ($a [and|or] $b) red or green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named and skip if not match', function () {
        var obj = evaluate(parse('a = { book is $a; book is $b }; a ($a $b) red; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(0);
        obj.size('green').should.equal(0);
    });
    it('should create build parser into function', function () {
        var obj = evaluate(parse('a = { book is $a; book is $b } ($a $b); a red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should run return block', function () {
        var obj = evaluate(parse('f = {{$a + $b} ($a{$a} $b)} ($a); f 5 4'));
        should.exist(obj);
        obj.value().should.equal(9);
    });
    it('should use closure quick notation', function () {
        var obj = evaluate(parse('f = {{$a + $b} ($$a $b)} ($a); f 5 4'));
        should.exist(obj);
        obj.value().should.equal(9);
    });
    it('should use closure quick notation on top level', function () {
        var obj = evaluate(parse('speed = 12; f = {$el is $speed}; 23 f ($$speed)'));
        should.exist(obj);
        obj.value().should.equal(35);
    });
    it('should support multi execute with closure', function () {
        var obj = evaluate(parse('f = {{$a + $b} ($$a $b)} ($a); f 5 4; f 3 4'));
        should.exist(obj);
        obj.value().should.equal(7);
    });
    it('should import', function () {
        var obj = evaluate(parse('a = 12; bid = {c << a; $el is c }; sum = 10; sum bid'));
        should.exist(obj);
        obj.value().should.equal(22);
    });
    it('should import by name', function () {
        var obj = evaluate(parse('a = 12; bid = {a <<; $el is a }; sum = 10; sum bid'));
        should.exist(obj);
        obj.value().should.equal(22);
    });
    it('should import arg', function () {
        var obj = evaluate(parse('bid = {b << $a; 15 is b } ($a); sum = 10; sum bid 12'));
        should.exist(obj);
        obj.value().should.equal(27);
    });
    it('should import args', function () {
        var obj = evaluate(parse('bid = {<<; $el is a } ($a); sum = 10; sum bid 12'));
        should.exist(obj);
        obj.value().should.equal(22);
    });
    it('should export', function () {
        var obj = evaluate(parse('bid = {a = 12; a >> b }; bid; b + 10'));
        should.exist(obj);
        obj.value().should.equal(22);
    });
    it('should export global from top', function () {
        var obj = evaluate(parse('a => 12; bid = { a + 10 }; bid'));
        should.exist(obj);
        obj.value().should.equal(22);
        evaluator.globals['a'] = null;
    });
    it('should multi return', function () {
        var obj = evaluate(parse('bid = {a = 12; b = 10 + $i; a >>; b >>;} ($i); bid 5'));
        should.exist(obj);
        obj.value().reduce(function (a, b) {
            return a + b
        }).should.equal(27);
    });
    it('should support generators', function () {
        var obj = evaluate(parse('a = 10; gn = {a <<; $times _ {a + 1; a >>;};} ($times); gn 5'));
        should.exist(obj);
        obj.value().reduce(function (a, b) {
            return a + b
        }).should.equal(65);
    });
    it('should support dynamic generators', function () {
        var obj = evaluate(parse('(?list) : { a = 0; repeat _ { a >>; a + 1;};}; repeat = 2; list; repeat + 3; list'));
        should.exist(obj);
        obj.reduce(function (a, b) {
            return a + b
        }).should.equal(10);
    });
    it('should not cache results', function () {
        var t = createOut();
        evaluate(parse('d = { car; ($$color) _ {car is $el }; car }'), null, t);
        var obj = evaluate(parse('d ($color) red'), null, t);
        should.exist(obj);
        obj.value().should.equal('car');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(0);
        obj = evaluate(parse('d ($color) green'), null, t);
        should.exist(obj);
        obj.value().should.equal('car');
        obj.size('green').should.equal(1);
        obj.size('red').should.equal(0);
    });
    it('should support env passing', function () {
        var obj = evaluate(parse('a = {book is red;};b = {book is green};(c) : a;b($env)c'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should pass function as parameter', function () {
        var obj = evaluate(parse('fn = { arr = [$$f]; arr * 0 12}; fn ($f) {$1 - 2}'));
        should.exist(obj);
        obj.value().should.equal(10);
    });
    //TODO
    // a (* $a[\d] * $b[\d] *) there was 1 woman with 2 cats
    // a (? $a[\d] ? $b[\d] *) there was 1 woman with 2 cats
});

