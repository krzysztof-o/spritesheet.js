var spritesheet = require('../lib/spritesheet');
var assert = require('assert');
var fs = require('fs');

describe('spritesheet', function() {

	it('should generate xml file', function(done) {
		spritesheet.generate([__dirname + '/fixture/100x100.jpg'], {name: 'test', path: __dirname}, function() {
			assert.ok(fs.existsSync(__dirname + '/test.xml'));
			done();
		});
	});

	it('should generate png file', function(done) {
		spritesheet.generate([__dirname + '/fixture/100x100.jpg'], {name: 'test', path: __dirname}, function() {
			assert.ok(fs.existsSync(__dirname + '/test.png'));
			done();
		});
	});

	after(function() {
		fs.unlinkSync(__dirname + '/test.xml');
		fs.unlinkSync(__dirname + '/test.png');
	});

});

