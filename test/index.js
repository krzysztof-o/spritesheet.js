var spritesheet = require('..');
var assert = require('assert');
var expect = require('expect.js');
var fs = require('fs');

describe('spritesheet.js', function () {

  describe('with given pattern of files', function () {
    it('should generate xml file', function (done) {
      spritesheet(__dirname + '/fixtures/*', {name: 'test', path: __dirname}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.xml')).to.be.ok();
        done();
      });
    });

    it('should generate png file', function (done) {
      spritesheet(__dirname + '/fixtures/*', {name: 'test', path: __dirname}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.png')).to.be.ok();
        done();
      });
    });

    after(function () {
      fs.unlinkSync(__dirname + '/test.xml');
      fs.unlinkSync(__dirname + '/test.png');
    });
  });


  describe('with given array of files', function () {
    it('should generate xml file', function (done) {
      spritesheet([__dirname + '/fixtures/100x100.jpg'], {name: 'test', path: __dirname}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.xml')).to.be.ok();
        done();
      });
    });

    it('should generate png file', function (done) {
      spritesheet([__dirname + '/fixtures/100x100.jpg'], {name: 'test', path: __dirname}, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.png')).to.be.ok();
        done();
      });
    });

    after(function () {
      fs.unlinkSync(__dirname + '/test.xml');
      fs.unlinkSync(__dirname + '/test.png');
    });
  });

});

