var exec = require('child_process').exec;
var fs = require('fs');
var Mustache = require('mustache');
var async = require('async');
var os = require('os');

var packing = require('./packing/packing.js');
/**
 * Generate temporary trimmed image files
 * @param {string[]} files
 * @param {object} options
 * @param {boolean} options.trim is trimming enabled
 * @param callback
 */
exports.trimImages = function (files, options, callback) {
  if (!options.trim) return callback(null);

  var i = 0;
  async.eachSeries(files, function (file, next) {
    file.originalPath = file.path;
    i++;
    file.path = os.tmpDir() + 'image_' +i;

    //have to add 1px transparent border because imagemagick do trimming based on border pixel's color
    exec('convert ' + file.originalPath + ' -bordercolor transparent -border 1 -trim ' + file.path, next);
  }, callback);
};

/**
 * Iterates through given files and gets its size
 * @param {string[]} files
 * @param {object} options
 * @param {boolean} options.trim is trimming enabled
 * @param {function} callback
 */
exports.getImagesSizes = function (files, options, callback) {
  var filePaths = files.map(function (file) {
    return file.path;
  });
  exec('identify ' + filePaths.join(' '), function (err, stdout) {
    if (err) return callback(err);

    var sizes = stdout.split('\n');
    sizes = sizes.splice(0, sizes.length - 1);
    sizes.forEach(function (item, i) {
      var size = item.match(/ ([0-9]+)x([0-9]+) /);
      files[i].width = parseInt(size[1], 10);
      files[i].height = parseInt(size[2], 10);
      files[i].trimmed = false;

      if (options.trim) {
        var rect = item.match(/ ([0-9]+)x([0-9]+)\+([0-9]+)\+([0-9]+) /);
        files[i].trim = {};
        files[i].trim.x = parseInt(rect[3], 10) - 1;
        files[i].trim.y = parseInt(rect[4], 10) - 1;
        files[i].trim.width = parseInt(rect[1], 10) - 2;
        files[i].trim.height = parseInt(rect[2], 10) - 2;

        files[i].trimmed = (files[i].trim.width !== files[i].width || files[i].trim.height !== files[i].height);
      }
    });
    callback(null, files);
  });
};

/**
 * Determines texture size using selected algorithm
 * @param {object[]} files
 * @param {object} options
 * @param {object} options.algorithm (growing-binpacking, binpacking, vertical, horizontal)
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

  packing.pack(options.algorithm, files, options);

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
  command.push('"' + options.path + '/' + options.name + '.png"');
  exec(command.join(' '), function (err) {
    if (err) return callback(err);

    unlinkTempFiles(files);
    callback(null);
  });
};

function unlinkTempFiles(files) {
  files.forEach(function (file) {
    if (file.originalPath && file.originalPath !== file.path) {
      fs.unlinkSync(file.path.replace(/\\ /g, ' '));
    }
  });
}

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
    if (item.trim) {
      item.trim.frameX = -item.trim.x;
      item.trim.frameY = -item.trim.y;
      item.trim.offsetX = Math.floor(Math.abs(item.trim.x + item.width / 2 - item.trim.width / 2));
      item.trim.offsetY = Math.floor(Math.abs(item.trim.y + item.height / 2 - item.trim.height / 2));
    }
  });
  var result = Mustache.render(tempateContent, options);
  fs.writeFile(options.path + '/' + options.name + '.' + options.format.extension, result, callback);
};

/**
 * Rounds a given number to to next number which is power of two
 * @param {number} value number to be rounded
 * @return {number} rounded number
 */
function roundToPowerOfTwo(v) {
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v++;

  return v;
}
