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

	/* documentation generation task */
	grunt.registerTask('documentation', function () {
		var markdox = require('markdox');
		var done = this.async();

		var files = [
			'./index.js'
		];

		markdox.process(files, 'documentation.md', done);
	});

	/* run the spell checker */
	grunt.registerTask('spelling', function (word) {
		var done = this.async();
		var spelling = require('./index').spelling;

		spelling('examples/data/english.words', function (err, checker) {
			if (err) {
				done(err);
			} else {
				var result = checker.check(word);
				if (typeof result === 'string') {
					grunt.log.ok(result);
				} else {
					result.forEach(function (v) {
						grunt.log.ok(v.w + ' ' + v.r);
					});
				}
			}
		});
	});
};