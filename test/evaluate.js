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

describe('evaluate', function () {
    it('should build string', function () {
        var obj = evaluate(parse('"aaa"'));
        should.exist(obj);
        obj.value().should.equal('aaa');
    });
    it('should extend string', function () {
        var obj = evaluate(parse('"aaa"'));
        should.exist(obj);
        obj.is("bbbb");
        obj.value().should.equal('aaabbbb');
    });
    it('should be string', function () {
        var obj = evaluate(parse('"aaa"'));
        should.exist(obj);
        obj.size("aaa").should.equal(1);
        obj.type.should.equal("string");
    });
    it('should build number', function () {
        var obj = evaluate(parse('12'));
        should.exist(obj);
        obj.value().should.equal(12);
    });
    it('should extend number', function () {
        var obj = evaluate(parse('12'));
        should.exist(obj);
        obj.is(10);
        obj.value().should.equal(22);
    });
    it('should be number', function () {
        var obj = evaluate(parse('12'));
        should.exist(obj);
        obj.size(12).should.equal(1);
        obj.type.should.equal("number");
    });
    it('should build model', function () {
        var obj = evaluate(parse('book'));
        should.exist(obj);
        obj.value().should.equal('book');
    });
    it('should extend model', function () {
        var obj = evaluate(parse('book'));
        should.exist(obj);
        obj.is('red');
        obj.size('book').should.equal(1);
        obj.size('red').should.equal(1);
    });
    it('should dismiss model', function () {
        var obj = evaluate(parse('book'));
        should.exist(obj);
        obj.is('red');
        obj.size('red').should.equal(1);
        obj.not('red');
        obj.size('red').should.equal(0);
    });
    it('should not dismiss all model', function () {
        var obj = evaluate(parse('book'));
        should.exist(obj);
        obj.is('red');
        obj.is('red');
        obj.size('red').should.equal(2);
        obj.not('red');
        obj.size('red').should.equal(1);
    });
    it('should run vector', function () {
        var obj = evaluate(parse('book is red'));
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should run vector on global', function () {
        var obj = evaluate(parse('is book'));
        should.exist(obj);
        obj.value().should.equal('there');
    });
    it('should do print', function () {
        var t = createOut('book');
        var obj = evaluate(parse('book is red @print'), null, t);
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should print there', function () {
        var t = createOut('there');
        evaluate(parse('@print'), null, t);
    });
    it('should print size', function () {
        var t = createOut('1');
        evaluate(parse('book is? book @print'), null, t);
    });
    it('should print details', function () {
        var t = createOut('2');
        var obj = evaluate(parse('book is red is red; book is? red @print; book'), null, t);
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(2);
    });
    it('should do print all', function () {
        var t = createOut('red');
        var obj = evaluate(parse('book is red @print? book'), null, t);
        should.exist(obj);
        obj.value().should.equal('book');
        obj.size('red').should.equal(1);
    });
    it('should remove from there', function () {
        var t = there();
        var obj = evaluate(parse('book'), null, t);
        should.exist(t);
        t.size('book').should.equal(1);
        t.remove('book');
        t.size('book').should.equal(0);
    });
    it('should ask for resource', function (done) {
        var parsed = parse('book is @red');
        evaluator.defaultInput = "red";
        evaluate(parsed, null, null, function (obj) {
            should.exist(obj);
            obj.value().should.equal('book');
            obj.size('red').should.equal(1);
            done();
        });
    });
});
