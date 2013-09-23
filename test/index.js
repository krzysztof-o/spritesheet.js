var spritesheet = require('..');
var assert = require('assert');
var expect = require('expect.js');
var fs = require('fs');

var FORMAT = {extension: 'json', template: 'json.template'};

describe('spritesheet.js', function () {

  describe('with given pattern of files', function () {
    it('should generate xml file', function (done) {
      spritesheet(__dirname + '/fixtures/*', {name: 'test', path: __dirname, format: FORMAT}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.json')).to.be.ok();
        done();
      });
    });

    it('should generate png file', function (done) {
      spritesheet(__dirname + '/fixtures/*', {name: 'test', path: __dirname, format: FORMAT}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.png')).to.be.ok();
        done();
      });
    });

    after(function () {
      fs.unlinkSync(__dirname + '/test.json');
      fs.unlinkSync(__dirname + '/test.png');
    });
  });

  describe('with given array of files', function () {
    it('should generate xml file', function (done) {
      spritesheet([__dirname + '/fixtures/100x100.jpg'], {name: 'test', path: __dirname, format: FORMAT}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.json')).to.be.ok();
        done();
      });
    });

    it('should generate png file', function (done) {
      spritesheet([__dirname + '/fixtures/100x100.jpg'], {name: 'test', path: __dirname, format: FORMAT}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.png')).to.be.ok();
        done();
      });
    });

    after(function () {
      fs.unlinkSync(__dirname + '/test.json');
      fs.unlinkSync(__dirname + '/test.png');
    });
  });

});

