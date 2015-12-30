/*  The Computer Language Benchmarks Game
 http://benchmarksgame.alioth.debian.org/

 Contributed by Joe Farro
 parts taken from solution contributed by
 Jesse Millikan which was modified by Matt Baker
 */
var start = new Date().getTime();
var readline = require('readline');
var lines = [];
var body = false;

var rl = readline.createInterface({
    input: require('fs').createReadStream('knucleotide-input.txt'),
    output: process.stdout
});

rl.on('line', function (line) {
    if (body && line[0] !== '>') {
        lines.push(line);
    }
    if (line.substr(0, 6) === '>THREE') {
        body = true;
    }
});

rl.on('close', function () {
    var seq = lines.join('').toUpperCase();
    sort(seq, 1);
    sort(seq, 2);

    find(seq, "GGT");
    find(seq, "GGTA");
    find(seq, "GGTATT");
    find(seq, "GGTATTTTAATT");
    find(seq, "GGTATTTTAATTTATAGT");

    var end = new Date().getTime();
    console.log("Time:" + (end - start) + "ms");
    process.exit(0);
});

function frequency(seq, length) {
    var freq = {},
        n = seq.length - length + 1,
        sub, i;

    for (i = 0; i < n; i++) {
        sub = seq.substr(i, length);
        if (sub.length == length) {
            freq[sub] = (freq[sub] || 0) + 1;
        }
    }

    return freq;
}


function sort(seq, length) {
    var f = frequency(seq, length),
        keys = Object.keys(f),
        n = seq.length - length + 1,
        i;

    keys.sort(function (a, b) {
        return f[b] - f[a];
    });

    keys.forEach(function(key){
        console.log(key, (f[key] * 100 / n).toFixed(3));
    });
    console.log();
}


function find(seq, s) {
    var f = frequency(seq, s.length);
    console.log((f[s] || 0) + "\t" + s);
}