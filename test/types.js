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

describe('types', function () {
    it('should support continuation', function () {
        var obj = evaluate(parse('(apple color) ... {$el is red}; apple is color'));
        should.exist(obj);
        obj.value().should.equal('apple');
        obj.size('red').should.equal(1);
    });
    it('should use utility methods', function () {
        var obj = evaluate(parse('u @ utils; a = "BLAH"; (b) : {u . lower a}; b'));
        should.exist(obj);
        obj.value().should.equal('blah');
    });
    it('should support value continuation', function () {
        var obj = evaluate(parse('a = "BLAH"; (a lower) ... {$el isnot lower; $el isnot "BLAH";  $el is "blah";}; a is lower; a'));
        should.exist(obj);
        obj.value().should.equal('blah');
    });
    it('should support value type continuation', function () {
        var obj = evaluate(parse('a = "BLAH"; (string lower) ... {$el isnot lower; $el isnot "BLAH";  $el is "blah";}; a is lower; a'));
        should.exist(obj);
        obj.value().should.equal('blah');
    });
    it('should support value type effect continuation', function () {
        var obj = evaluate(parse('(+ lower number) ... {"blah" is $1}; lower is 12'));
        should.exist(obj);
        obj.value().should.equal('blah12');
    });
    it('should support simple string interpolation', function () {
        var obj = evaluate(parse('a = 12; b = `${a + 3}`; b'));
        should.exist(obj);
        obj.value().should.equal('15');
    });
    it('should support value vector', function () {
        var obj = evaluate(parse('obj = {a = 12; b = 13; ~ {a + b};}; obj'));
        should.exist(obj);
        obj.value().should.equal(25);
    });
    it('should support value definition', function () {
        var obj = evaluate(parse('obj = {a = 12; b = 13; a + b; ~ a;}; obj'));
        should.exist(obj);
        obj.value().should.equal(25);
    });

});