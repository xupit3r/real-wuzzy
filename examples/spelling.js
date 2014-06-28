var fs = require('fs');
var split = require('split');
var wuzzy = require('wuzzy');

function train (corrects, corpus, done) {
    fs.readFile(corpus, function (err, corpStr) {
        if (err) {
            done(err);
        } else {
            var Trained = function (freqs) {
                this.freqs = freqs;
            };

            Trained.prototype.freq = function (w) {
                return (this.freqs[w]
                    ? this.freqs[w]
                    : 1
                );
            };

            Trained.prototype.keys = function (w) {
                return Object.keys(this.freqs);
            };

            var f = {};
            corpStr.toString().toLowerCase().match(/[a-z]+/g).forEach(function (w) {
                if (corrects[w]) {
                    f[w] = (f[w] 
                        ? f[w] + 1
                        : 1
                    );
                }
            });

            done(null, new Trained(f)); 
        }
    });
};

function readCorrects (correctsFile, done) {
    var words = {};
    fs.createReadStream(
        correctsFile
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

function getChecker (mdl) {
    var SpellChecker = function (model) {
        this.model = model;
    };

    SpellChecker.prototype.check = function (word) {
        return this._corrections(word.toLowerCase());
    };

    SpellChecker.prototype._corrections = function (w1) {
        return this.model.keys().map(function (w2) {
            return {
                w: w2,
                r: wuzzy.levenshtein(w1, w2),
                f: this.model.freq(w2)
            };
        }, this).sort(function (a, b) {
            return (b.r - a.r);
        }).slice(0, 5).sort(function (a, b) {
            return (b.f - a.f);
        })[0].w;
    };

    return new SpellChecker(mdl);
};

module.exports = function (correctsFile, trainCorpus, done) {
    readCorrects(correctsFile, function (err, corrects) {
        if (err) {
            done(err);
        } else {
            train(corrects, trainCorpus, function (err, model) {
                if (err) {
                    done(err);
                } else {
                    done(null, getChecker(model));
                }
            });
        }
    });
};