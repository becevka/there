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

describe('table', function () {
    it('should create table with columns', function () {
        var obj = evaluate(parse('t = |key value|'));
        should.exist(obj);
        should.exist(obj.data().key);
        should.exist(obj.data().value);
    });
    it('should support adding records', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 0]'));
        should.exist(obj);
        should.exist(obj.data().key);
        obj.data().key.should.eql(['a']);
        should.exist(obj.data().value);
        obj.data().value.should.eql([0]);
        obj.count.should.eql(1);
    });
    it('should support removing records by index', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 0]; t - 0'));
        should.exist(obj);
        obj.count.should.eql(0);
    });
    it('should support removing records by search', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 0]; t - ["a" 0]'));
        should.exist(obj);
        obj.count.should.eql(0);
    });
    it('should support adding records as object', function () {
        var obj = evaluate(parse('book is red; t = |key value|; t + ["a" book]'));
        should.exist(obj);
        should.exist(obj.data().key);
        obj.data().key.should.eql(['a']);
        should.exist(obj.data().value);
        var v = obj.data().value[0];
        v.value().should.eql('book');
        v.size('red').should.equal(1);
        obj.count.should.eql(1);
    });
    it('should support adding records through alias', function () {
        var obj = evaluate(parse('t = |key value|; t add ["a" 0]'));
        should.exist(obj);
        should.exist(obj.data().key);
        obj.data().key.should.eql(['a']);
        should.exist(obj.data().value);
        obj.data().value.should.eql([0]);
        obj.count.should.eql(1);
    });
    it('should support multi-add records', function () {
        var obj = evaluate(parse('t = |key value|; t add ["a" 1] and ["b" 11]'));
        should.exist(obj);
        obj.count.should.eql(2);
    });
    it('should support iteration through records', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 1]; t + ["b" 11]; n = 0; t _ { n + $value }; n'));
        obj.value().should.eql(12);
    });
    it('should return record by index', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 1]; t + ["b" 11]; t * 1'));
        obj.value().should.eql(['b', 11]);
    });
    it('should return records by search', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 1]; t + ["b" 2]; t + ["a" 3]; t * ["a"]'));
        obj.value().should.eql([['a', 1], ['a', 3]]);
    });
    it('should return records by multi-search', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 1]; t + ["b" 2]; t + ["a" 3]; t * ["a" 2]'));
        obj.value().should.eql([]);
    });
    it('should return records by regex-search', function () {
        var obj = evaluate(parse('t = |key value|; t + ["a" 1]; t + ["b" 2]; t + ["a" "c"]; t * "a \\d"'));
        obj.value().should.eql([['a', 1]]);
    });
    it('should return count by wrong index', function () {
        var obj = evaluate(parse('t = |key value|; t * 1'));
        obj.value().should.eql(0);
    });
});
