var generator = require('../lib/generator');
var expect = require('expect.js');
var fs = require('fs');


describe('generator', function () {

  describe('getImagesSizes', function () {
    it('should return image sizes', function (done) {
      var FILES = [
        {name: __dirname + '/fixtures/50x50.jpg'},
        {name: __dirname + '/fixtures/100x100.jpg'},
        {name: __dirname + '/fixtures/200x200.jpg'},
        {name: __dirname + '/fixtures/500x500.jpg'}
      ];

      generator.getImagesSizes(FILES, function (err, files) {
        expect(err).to.be(null);

        expect(files[0].width).to.equal(50);
        expect(files[0].height).to.equal(50);

        expect(files[1].width).to.equal(100);
        expect(files[1].height).to.equal(100);

        expect(files[2].width).to.equal(200);
        expect(files[2].height).to.equal(200);

        expect(files[3].width).to.equal(500);
        expect(files[3].height).to.equal(500);

        done();
      });
    });
  });

  describe('determineCanvasSize', function () {
    var FILES = [
      {name: __dirname + '/fixtures/50x50.jpg', width: 50, height: 50},
      {name: __dirname + '/fixtures/100x100.jpg', width: 100, height: 100},
      {name: __dirname + '/fixtures/200x200.jpg', width: 200, height: 200},
      {name: __dirname + '/fixtures/500x500.jpg', width: 500, height: 500}
    ];

    it('should return square canvas', function (done) {
      var options = {square: true, powerOfTwo: false};
      generator.determineCanvasSize(FILES, options, function (err) {
        expect(err).to.be(null);
        expect(options.width).to.equal(options.height);

        done();
      });
    });

    it('should return square canvas', function (done) {
      var options = {square: false, powerOfTwo: false};
      generator.determineCanvasSize(FILES, options, function (err) {
        expect(err).to.be(null);
        expect(options.width).not.to.equal(options.height);
        done();
      });
    });

    it('should return power of two', function (done) {
      var options = {square: false, powerOfTwo: true};
      generator.determineCanvasSize(FILES, options, function (err) {
        expect(err).to.be(null);
        expect(options.width).to.equal(1024);
        expect(options.height).to.equal(512);
        done();
      });
    });

  });

  describe('generateImage', function () {
    var FILES = [
      {name: __dirname + '/fixtures/50x50.jpg', width: 50, height: 50, x: 0, y: 0},
      {name: __dirname + '/fixtures/100x100.jpg', width: 100, height: 100, x: 0, y: 0},
      {name: __dirname + '/fixtures/200x200.jpg', width: 200, height: 200, x: 0, y: 0},
      {name: __dirname + '/fixtures/500x500.jpg', width: 500, height: 500, x: 0, y: 0}
    ];

    it('should generate image file', function (done) {
      var options = {width: 100, height: 100, path: __dirname + '/', imageFile: 'test.png'};
      generator.generateImage(FILES, options, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.png')).to.be.ok();
        done();
      });
    });

    after(function () {
      fs.unlinkSync(__dirname + '/test.png');
    });
  });

  describe('generateData', function () {
    var FILES = [
      {name: __dirname + '/fixtures/50x50.jpg', width: 50, height: 50, x: 0, y: 0},
      {name: __dirname + '/fixtures/100x100.jpg', width: 100, height: 100, x: 0, y: 0},
      {name: __dirname + '/fixtures/200x200.jpg', width: 200, height: 200, x: 0, y: 0},
      {name: __dirname + '/fixtures/500x500.jpg', width: 500, height: 500, x: 0, y: 0}
    ];

    it('should generate data file', function (done) {
      var options = {path: __dirname + '/', dataFile: 'test.xml'};
      generator.generateData(FILES, options, function (err) {
        expect(err).to.be(null);
        expect(fs.existsSync(__dirname + '/test.xml')).to.be.ok();
        done();
      });
    });

    after(function () {
      fs.unlinkSync(__dirname + '/test.xml');
    });
  });
});
