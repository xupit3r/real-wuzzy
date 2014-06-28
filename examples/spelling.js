var fs = require('fs');
var split = require('split');
var wuzzy = require('wuzzy');

function train (corpus, done) {
    fs.readFile(corpus, function (err, corpStr) {
        if (err) {
            done(err);
        } else {
            var Trained = function (freqs) {
                this.freqs = freqs;
            };

            Trained.prototype.get = function (w) {
                return (this.freqs[w]
                    ? this.freqs[w]
                    : 1
                );
            };

            var f = {};
            corpStr.toString().match(/[a-z]+/g).forEach(function (w) {
                var normalized = w.toLowerCase();
                f[normalized] = (f[normalized] 
                    ? f[normalized] + 1
                    : 1
                );
            });

            done(null, new Trained(f)); 
        }
    });
};

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

function getChecker (ws, mdl) {
    var SpellChecker = function (words, model) {
        this.words = words;
        this.model = model;
    };

    SpellChecker.prototype.check = function (word) {
        word = word.toLowerCase();
        if (!this.words[word]) {
            return this._corrections(word);
        } else {
            return word;
        }
    };

    SpellChecker.prototype._corrections = function (w1) {
        return Object.keys(this.words).map(function (w2) {
            return {
                w: w2,
                r: wuzzy.levenshtein(w1, w2),
                m: this.model.get(w2)
            };
        }, this).sort(function (a, b) {
            return (b.r - a.r);
        }).slice(0, 10).sort(function (a, b) {
            return (b.m - a.m);
        })[0].w;
    };

    return new SpellChecker(ws, mdl);
};

module.exports = function (wordFile, trainCorpus, done) {
    readWords(wordFile, function (err, words) {
        if (err) {
            done(err);
        } else {
            train(trainCorpus, function (err, model) {
                if (err) {
                    done(err);
                } else {
                    done(null, getChecker(words, model));
                }
            });
        }
    });
};