var fs = require('fs');
var split = require('split');
var wuzzy = require('wuzzy');

function train (corrects, corpus, done) {
    fs.readFile(corpus, function (err, corpStr) {
        if (err) {
            done(err);
        } else {
            // provide an abstraction around the corpus of 
            // words 
            var Trained = function (freqs) {
                this.freqs = freqs;
            };

            // provide access to the frequency counts of words in the corpus. 
            // return a mimum of 1 to provide some handling of words that do 
            // not exist in the word corpus.
            Trained.prototype.freq = function (w) {
                return (this.freqs[w]
                    ? this.freqs[w]
                    : 1
                );
            };

            // get the set of recognized words from the corpus
            Trained.prototype.words = function (w) {
                return Object.keys(this.freqs);
            };

            // build up frequency counts of words in the training corpus
            var f = {};
            corpStr.toString().toLowerCase().match(/[a-z]+/g).forEach(function (w) {
                // limit words to those that exist in the English dictionary
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
    // read in the set of correct English words
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
        // go over each word in the corpus and collect edit 
        // distance (using levenshtein distance) and frequency 
        // counts for each word 
        return this.model.words().map(function (w2) {
            return {
                w: w2,
                r: wuzzy.levenshtein(w1, w2),
                f: this.model.freq(w2)
            };
        }, this).sort(function (a, b) {
            // sort on edit distance and limit the final results 
            // to the top 5
            return (b.r - a.r);
        }).slice(0, 5).sort(function (a, b) {
            // sort the top 5 results on edit distance 
            // weighted by frequency of appearance in the 
            // corpus
            return ((b.f * b.r) - (a.f * b.r));
        })[0].w; // return the top result
    };

    return new SpellChecker(mdl);
};

module.exports = function (correctsFile, trainCorpus, done) {
    // read in the dictionary of english words
    readCorrects(correctsFile, function (err, corrects) {
        if (err) {
            done(err);
        } else {
            // train the spell checker using the provided corpus of 
            // text
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