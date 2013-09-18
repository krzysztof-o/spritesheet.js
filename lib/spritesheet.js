var exec = require('child_process').exec;
var Handlebars = require('handlebars');
var fs = require('fs');
var binpacking = require('binpacking');
var async = require('async');

/**
 *
 * @param {string[]} files path to image files
 * @param {object} options
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {bool} options.square texture should be square
 * @param {bool} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param callback
 */
exports.generate = function (files, options, callback) {
  files = files.map(function (name) {
    return {name: name};
  });
  options = options || {};
  options.imageFile = options.name + '.png';
  options.dataFile = options.name + '.xml';
  options.path = options.path ? options.path + '/' : '';
  options.square = true || options.square;
  options.powerOfTwo = true || options.powerOfTwo;


  async.series([
    function (callback) {
      getImagesSizes(files, options, callback);
    },
    function (callback) {
      determineCanvasSize(files, options, callback);
    },
    function (callback) {
      generateImage(files, options, callback);
    },
    function (callback) {
      generateData(files, options, callback);
    }
  ],
    callback);
};


function getImagesSizes(files, options, callback) {
  var fileNames = files.map(function (file) {
    return file.name;
  });

  exec('identify ' + fileNames.join(' '), function (err, stdout) {
    if (err) callback(err);

    var sizes = stdout.split('\n');
    sizes = sizes.splice(0, sizes.length - 1);

    sizes.forEach(function (item, i) {
      var size = item.split(' ')[2].split('x');
      files[i].width = parseInt(size[0], 10);
      files[i].height = parseInt(size[0], 10);
    });

    callback(null);
  })
}

function determineCanvasSize(files, options, callback) {
  files.forEach(function (item) {
    item.w = item.width;
    item.h = item.height;
  });
  files.sort(function (a, b) {
    if (a.h < b.h) return 1;
    if (a.h > b.h) return -1;
    return 0;
  });

  var GrowingPacker = binpacking.GrowingPacker;
  var packer = new GrowingPacker();
  packer.fit(files);

  files.forEach(function (item) {
    item.x = item.fit.x;
    item.y = item.fit.y;
    delete item.fit;
    delete item.w;
    delete item.h;
  });

  options.width = packer.root.w;
  options.height = packer.root.h;

  if (options.square) {
    options.width = options.height = Math.max(options.width, options.height);
  }

  if (options.powerOfTwo) {
    options.width = roundToPowerOfTwo(options.width);
    options.height = roundToPowerOfTwo(options.height);
  }

  callback();
}

function generateImage(files, options, callback) {
  var command = ['convert -size ' + options.width + 'x' + options.height + ' xc:none'];
  files.forEach(function (file) {
    command.push(file.name + ' -geometry +' + file.x + '+' + file.y + ' -composite');
  });
  command.push(options.path + options.imageFile);

  exec(command.join(' \\'), callback);
}

function generateData(files, options, callback) {
  var tempateContent = fs.readFileSync('template/starling.template', 'utf-8');
  var template = Handlebars.compile(tempateContent);
  options.files = files;
  var result = template(options);
  fs.writeFile(options.path + options.dataFile, result, callback);
}

/**
 * Rounds a given number to to next number which is power of two
 * @param {number} value number to be rounded
 * @return {number} rounded number
 */
function roundToPowerOfTwo(value) {
  var powers = 2;
  while (value > powers) {
    powers *= 2;
  }

  return powers;
}
