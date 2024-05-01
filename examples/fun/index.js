//guess number game


const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var min = 1;
var max = 100;
const val = getRandomInt(min, max);

rl.question('Welcome to guessing game with Veselka.\nGuess a number from 1 to 100: ', (n) => {
    processUser(n);
});

function success() {
    console.log('Hurray, you win');
    rl.close();
}

function fail() {
    console.log('Sorry, you\'ve lost');
    rl.close();
}

function updateMinMax(n) {
    console.log("Min:" + min + ", Max:" + max);
    if (n > val && n < max) {
        max = n;
    }
    if (n < val && n > min) {
        min = n;
    }
    console.log("Min:" + min + ", Max:" + max);
}
function processUser(n) {
    if (n != val) {
        updateMinMax(n);
        tryVeselka(n > val ? 'Too big.\n' : 'Too small.\n')
    } else {
        success();
    }
}

function processVeselka(n) {
    if (n != val) {
        updateMinMax(n);
        tryAgain(n > val ? 'It was too big.\n' : 'It was too small.\n')
    } else {
        fail();
    }
}

function tryAgain(m) {
    rl.question(m + 'Please try again: ', (n) => {
        processUser(n)
    });
}

function tryVeselka(m) {
    const n = getRandomInt(min, max);
    console.log(m + 'Now Veselka has a try: ', n);
    processVeselka(n);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max) + 1;
    return Math.floor(Math.random() * (max - min)) + min;
}
