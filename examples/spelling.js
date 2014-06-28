var fs = require('fs');
var split = require('split');
var wuzzy = require('wuzzy');

function readWords (wordFile, done) {
    var words = {};
    fs.createReadStream(
        wordFile
    ).pipe(
        split()
    ).on('data', function (word) {
        words[word.toLowerCase().trim()] = 1;
    }).on('end', function () {
        done(null, words);
    }).on('error', function (err) {
        done(err);
    });
};

function getChecker (words) {
    var SpellChecker = function () {
        this.words = words;
    };

    SpellChecker.prototype.check = function (word) {
        word = word.toLowerCase();
        if (!this.words[word]) {
            return this._corrections(word);
        } else {
            return 'This is spelled correctly.';
        }
    };

    SpellChecker.prototype._corrections = function (w1) {
        return Object.keys(this.words).map(function (w2) {
            return {
                w: w2,
                r: wuzzy.levenshtein(w1, w2)
            };
        }).sort(function (a, b) {
            return b.r - a.r;
        }).slice(0, 5);
    };

    return new SpellChecker(words);
};

module.exports = function (wordFile, done) {
    readWords(wordFile, function (err, words) {
        if (err) {
            if (typeof done === 'function') {
                done(err);
            } else {
                throw err;
            }
        } else {
            done(null, getChecker(words));
        }
    });
};