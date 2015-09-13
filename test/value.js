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

describe('value', function () {
    it('should combine strings', function () {
        var t = createOut('Hello world');
        var obj = evaluate(parse('"Hello " + "world" @print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hello world');
    });
    it('should combine string and variable', function () {
        var t = createOut('Hello world');
        var obj = evaluate(parse('a is "Hello "; b is "world"; a + b @print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hello world');
    });
    it('should extract from string', function () {
        var t = createOut('Hell wrld');
        var obj = evaluate(parse('"Hello world" - "o" @print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hell wrld');
    });
    it('should extract from string safely', function () {
        var t = createOut('Hell wrld');
        var obj = evaluate(parse('"Hell$ w$rld" - "$" @print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hell wrld');
    });
    it('should find in string', function () {
        var obj = evaluate(parse('a is "Hello world"; b is "o"; a / b'));
        should.exist(obj);
        obj.should.equal(2);
    });
    it('should combine numbers', function () {
        var t = createOut(4);
        var obj = evaluate(parse('3 + 1 @print'), null, t);
        should.exist(obj);
        obj.value().should.equal(4);
    });
    it('should combine number and variable', function () {
        var t = createOut(5);
        var obj = evaluate(parse('a is 4; b is 1; a + b @print'), null, t);
        should.exist(obj);
        obj.value().should.equal(5);
    });
    it('should extract from number', function () {
        var t = createOut(3);
        var obj = evaluate(parse('4 - 1 @print'), null, t);
        should.exist(obj);
        obj.value().should.equal(3);
    });
    it('should find in number', function () {
        var obj = evaluate(parse('a is 6; b is 2; a / b'));
        should.exist(obj);
        obj.should.equal(3);
    });
    it('should create number value from resource', function () {
        var t = there();
        t.resources['t'] = function() {
            return 3;
        };
        var obj = evaluate(parse('a is @t'), null, t);
        should.exist(obj);
        obj.value().should.equal(3);
    });
    it('should create string value from resource', function () {
        var t = there();
        t.resources['t'] = function() {
            return "test";
        };
        var obj = evaluate(parse('a is @t'), null, t);
        should.exist(obj);
        obj.value().should.equal("test");
    });
    it('should create list value from resource', function () {
        var t = there();
        t.resources['t'] = function() {
            return ["test", "test2"];
        };
        var obj = evaluate(parse('a is @t'), null, t);
        should.exist(obj);
        obj.value().should.eql(["test", "test2"]);
    });

});
