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
        var obj = evaluate(parse('a is { book is red }; a'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should run block with parameter', function () {
        var obj = evaluate(parse('a is { book is @1 }; a red'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should run access top resources in block', function () {
        var t = createOut('book');
        evaluate(parse('a is { book @print }; a'), null, t);
    });
    it('should run two statement and return last', function () {
        var obj = evaluate(parse('book is red is green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should run block with parameters', function () {
        var obj = evaluate(parse('a is { book is @1; book is @2 }; a red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should run block with side effect on element', function () {
        var obj = evaluate(parse('color is { @el is red }; book color '));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should create named parser', function () {
        var obj = evaluate(parse('a is { book is @a; book is @b }; a (@a @b) red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named and value parser', function () {
        var obj = evaluate(parse('a is { book is @a; book is @b }; a (@a and @b) red and green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named and wildcard parser', function () {
        var obj = evaluate(parse('a is { book is @a; book is @b }; a (@a * @b) red and green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named parser and not eval the words', function () {
        var t = createOut();
        var obj = evaluate(parse('a is { book is @a; book is @b }; a (@a * @b) red and green'), null, t);
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        t.size('and').should.equal(0);
    });
    it('should create named and regex parser', function () {
        var obj = evaluate(parse('a is { book is @a; book is @b }; a (@a [and|or] @b) red or green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should create named and skip if not match', function () {
        var obj = evaluate(parse('a is { book is @a; book is @b }; a (@a @b) red; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(0);
        obj.size('green').should.equal(0);
    });
    it('should create build parser into function', function () {
        var obj = evaluate(parse('a is { book is @a; book is @b } (@a @b); a red green'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should nor cache results', function () {
        var t = createOut();
        evaluate(parse('d is { c is @color; (@c) _ {car is @el }; car }'), null, t);
        var obj = evaluate(parse('d (@color) "red"'), null, t);
        should.exist(obj);
        obj.value().should.equal('car');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(0);
        obj = evaluate(parse('d (@color) "green"'), null, t);
        should.exist(obj);
        obj.value().should.equal('car');
        obj.size('green').should.equal(1);
        obj.size('red').should.equal(0);
    });
    //TODO
    // a (* @a[\d] * @b[\d] *) there was 1 woman with 2 cats
    // a (? @a[\d] ? @b[\d] *) there was 1 woman with 2 cats
});

