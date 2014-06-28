var mocha = require('mocha');

module.exports = function (grunt) {

	/* add the grunt-mocha-test task */
	grunt.loadNpmTasks('grunt-mocha-test');

	/* grunt configuration */
	grunt.initConfig({
		mochaTest: {
			test: {
				options: {
					reporter: 'spec'
				},
				src: ['tests/*.js']
			}
		}
	});

	/* test task */
	grunt.registerTask('test', 'mochaTest');

	/* run the spell checker */
	grunt.registerTask('spelling', function (word) {
		var done = this.async();
		var spelling = require('./index').spelling;

		var correctsFile = 'examples/data/english.words';
		var trainCorpus = 'examples/data/big.txt';

		spelling(correctsFile, trainCorpus, function (err, checker) {
			if (err) {
				done(err);
			} else {
				var result = checker.check(word);
				if (result !== word) {
					grunt.log.ok('did you mean: ' + result);
				} else {
					grunt.log.ok(result + ' looks to be spelled correctly');
				}
			}
		});
	});
};