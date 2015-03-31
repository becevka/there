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

function createIn(input) {
    return there({
        ask: function (text, cb) {
            cb(input);
        }
    });
}

describe('iterable', function () {
    it('should run through args array', function () {
        var obj = evaluate(parse('adder is { count is 0; @args _ { count is @el }; count }; adder 2 3 5'));
        should.exist(obj);
        obj.value().should.equal(10);
    });
    it('should have constructors', function () {
        var obj = evaluate(parse('a is { book is @1; book is @2 }; (book) : {a red green}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should have dynamic constructors', function () {
        var t = there();
        var obj = evaluate(parse('book is red; (?a) : {book is? red}; a'), null, t);
        should.exist(obj);
        obj.should.equal(1);
        obj = evaluate(parse('book is! red; a'), null, t);
        should.exist(obj);
        obj.should.equal(0);
    });
    it('should run constructors through reference', function () {
        var obj = evaluate(parse('a is { book is @1; book is @2 }; b is {a red green}; (book) : b; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
    });
    it('should iterate number', function () {
        var obj = evaluate(parse('count is 0; 3 _ {count is @i}; count'));
        should.exist(obj);
        obj.value().should.equal(3);
    });
    it('should iterate number result', function () {
        var obj = evaluate(parse('sum is 0; book is red is red; book is? red _ {sum is @el}; sum'));
        should.exist(obj);
        obj.value().should.equal(4);
    });
    it('should ask with string for result', function () {
        var t = createIn(4);
        var obj = evaluate(parse('sum is 0; "enter the number" _ {sum is @el}; sum'), null, t);
        should.exist(obj);
        obj.value().should.equal(4);
    });
    it('should iterate list', function () {
        var obj = evaluate(parse('[red green blue] _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        obj.size('blue').should.equal(1);
    });
    it('should pre-evaluate list', function () {
        var obj = evaluate(parse('a is "red"; b is "green"; c is "blue"; [a b c] _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        obj.size('blue').should.equal(1);
    });
    it('should iterate sequence', function () {
        var obj = evaluate(parse('(red green blue) _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        obj.size('blue').should.equal(1);
    });
    it('should iterate sequence with reference', function () {
        var obj = evaluate(parse('b is "blue"; (red green @b) _ {book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        obj.size('blue').should.equal(1);
    });
    it('should iterate sequence by reference', function () {
        var obj = evaluate(parse('a is {count is @i; book is @el}; (red green blue) _ a; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
        obj.size('green').should.equal(1);
        obj.size('blue').should.equal(1);
    });
    it('should iterate range', function () {
        var obj = evaluate(parse('(1 .. 3) _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size(1).should.equal(1);
        obj.size(2).should.equal(1);
        obj.size(3).should.equal(1);
    });
    it('should iterate range with step', function () {
        var obj = evaluate(parse('(1 .. 6 2) _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size(1).should.equal(1);
        obj.size(2).should.equal(0);
        obj.size(3).should.equal(1);
        obj.size(4).should.equal(0);
        obj.size(5).should.equal(1);
        obj.size(6).should.equal(0);
        obj.size(7).should.equal(0);
    });
    it('should iterate alpha range', function () {
        var obj = evaluate(parse('(a .. c) _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('a').should.equal(1);
        obj.size('b').should.equal(1);
        obj.size('c').should.equal(1);
    });
    it('should iterate alpha range with step', function () {
        var obj = evaluate(parse('(a .. f 2) _ {count is @i; book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('a').should.equal(1);
        obj.size('b').should.equal(0);
        obj.size('c').should.equal(1);
        obj.size('d').should.equal(0);
        obj.size('e').should.equal(1);
        obj.size('f').should.equal(0);
        obj.size('g').should.equal(0);
    });
    it('should iterate dynamic range', function () {
        var obj = evaluate(parse('a is 1; b is 3; (@a .. @b) _ {book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size(1).should.equal(1);
        obj.size(2).should.equal(1);
        obj.size(3).should.equal(1);
    });
    it('should iterate dynamic range with step', function () {
        var obj = evaluate(parse('a is 1; b is 6; c is 2; (@a .. @b @c) _ {book is @el}; book'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size(1).should.equal(1);
        obj.size(2).should.equal(0);
        obj.size(3).should.equal(1);
        obj.size(4).should.equal(0);
        obj.size(5).should.equal(1);
        obj.size(6).should.equal(0);
        obj.size(7).should.equal(0);
    });
});
