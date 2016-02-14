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
        var obj = evaluate(parse('a = "BLAH"; (a lower) ... {$el isnot lower; $el isnot "BLAH";  $el is "blah"}; a is lower'));
        should.exist(obj);
        obj.value().should.equal('blah');
    });
});




















