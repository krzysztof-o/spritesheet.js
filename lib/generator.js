var exec = require('child_process').exec;
var fs = require('fs');
var binpacking = require('binpacking');
var Mustache = require('mustache');
/**
 * Iterates through given files and gets its size
 * @param {string[]} files
 * @param {function} callback
 */
exports.getImagesSizes = function (files, callback) {
  var filePaths = files.map(function (file) {
    return file.path;
  });
  exec('identify ' + filePaths.join(' '), function (err, stdout) {
    if (err) return callback(err);

    var sizes = stdout.split('\n');
    sizes = sizes.splice(0, sizes.length - 1);

    sizes.forEach(function (item, i) {
      var size = item.split(' ')[2].split('x');
      files[i].width = parseInt(size[0], 10);
      files[i].height = parseInt(size[1], 10);
    });

    callback(null, files);
  })
};

/**
 * Determines texture size using bin packing algorithm
 * @param {object[]} files
 * @param {object} options
 * @param {object} options.square canvas width and height should be equal
 * @param {object} options.powerOfTwo canvas width and height should be power of two
 * @param {function} callback
 */
exports.determineCanvasSize = function (files, options, callback) {
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

  callback(null, options);
};

/**
 * generates texture data file
 * @param {object[]} files
 * @param {object} options
 * @param {string} options.path path to image file
 * @param {function} callback
 */
exports.generateImage = function (files, options, callback) {
  var command = ['convert -size ' + options.width + 'x' + options.height + ' xc:none'];
  files.forEach(function (file) {
    command.push(file.path + ' -geometry +' + file.x + '+' + file.y + ' -composite');
  });
  command.push(options.path + '/' + options.name + '.png');
  exec(command.join(' '), function (err) {
    if (err) return callback(err);
    callback(null);
  });
};

/**
 * generates texture data file
 * @param {object[]} files
 * @param {object} options
 * @param {string} options.path path to data file
 * @param {string} options.dataFile data file name
 * @param {function} callback
 */
exports.generateData = function (files, options, callback) {
  var tempateContent = fs.readFileSync(__dirname + '/../templates/' + options.format.template, 'utf-8');
  options.files = files;
  options.files[options.files.length - 1].isLast = true;
  options.files.forEach(function (item, i) {
    item.index = i;
  });
  var result = Mustache.render(tempateContent, options);
  fs.writeFile(options.path + '/' + options.name + '.' + options.format.extension, result, callback);
};

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
