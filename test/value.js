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
        var obj = evaluate(parse('"Hello " + "world" $print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hello world');
    });
    it('should combine string and variable', function () {
        var t = createOut('Hello world');
        var obj = evaluate(parse('a = "Hello "; b = "world"; a + b $print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hello world');
    });
    it('should extract from string', function () {
        var t = createOut('Hell wrld');
        var obj = evaluate(parse('"Hello world" - "o" $print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hell wrld');
    });
    it('should extract from string safely', function () {
        var t = createOut('Hell wrld');
        var obj = evaluate(parse('"Hell$ w$rld" - "$" $print'), null, t);
        should.exist(obj);
        obj.value().should.equal('Hell wrld');
    });
    it('should find in string', function () {
        var obj = evaluate(parse('a = "Hello world"; b = "o"; a / b'));
        should.exist(obj);
        obj.value().should.equal(2);
    });
    it('should return char in string', function () {
        var obj = evaluate(parse('a = "Hello world"; a * 4'));
        should.exist(obj);
        obj.value().should.equal('o');
    });
    it('should combine numbers', function () {
        var t = createOut(4);
        var obj = evaluate(parse('3 + 1 $print'), null, t);
        should.exist(obj);
        obj.value().should.equal(4);
    });
    it('should combine number and variable', function () {
        var t = createOut(5);
        var obj = evaluate(parse('a = 4; b = 1; a + b $print'), null, t);
        should.exist(obj);
        obj.value().should.equal(5);
    });
    it('should extract from number', function () {
        var t = createOut(3);
        var obj = evaluate(parse('4 - 1 $print'), null, t);
        should.exist(obj);
        obj.value().should.equal(3);
    });
    it('should find in number', function () {
        var obj = evaluate(parse('a = 6; b = 2; a / b'));
        should.exist(obj);
        obj.value().should.equal(3);
    });
    it('should create number value from resource', function () {
        var t = there();
        t.resources['t'] = function() {
            return 3;
        };
        var obj = evaluate(parse('a will be $t'), null, t);
        should.exist(obj);
        obj.value().should.equal(3);
    });
    it('should create string value from resource', function () {
        var t = there();
        t.resources['t'] = function() {
            return "test";
        };
        var obj = evaluate(parse('a assign $t'), null, t);
        should.exist(obj);
        obj.value().should.equal("test");
    });
    it('should create list value from resource', function () {
        var t = there();
        t.resources['t'] = function() {
            return ["test", "test2"];
        };
        var obj = evaluate(parse('a will be $t'), null, t);
        should.exist(obj);
        obj.value().should.eql(["test", "test2"]);
    });
    it('should add value to list', function () {
        var obj = evaluate(parse('a = 4; arr = [1 2 3]; arr add a'), null);
        should.exist(obj);
        obj.value().should.eql([1, 2, 3, 4]);
    });

});
