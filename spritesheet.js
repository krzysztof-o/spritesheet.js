#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');
var fs = require('fs');
var glob = require('glob');
var optimist = require('optimist');

module.exports = generate;

if (!module.parent) {
  var argv = optimist.usage('Usage: $0 [options] <files>')
    .describe('name', 'name of generated spritesheet')
    .describe('path', 'path to export directory')
    .describe('square', 'texture should be square')
    .describe('powerOfTwo', 'texture width and height should be power of two')
    .boolean('square', 'powerOfTwo')
    .default({square: true, powerOfTwo: true})
    .argv;

  if (argv._.length == 0) {
    optimist.showHelp();
    return;
  }
  generate(argv._, argv, function(err) {
    if (err) throw err;
    console.log('Spritesheet successfully generated');
  });
}

/**
 * generates spritesheet
 * @param {string} files pattern of files images files
 * @param {string[]} files paths to image files
 * @param {object} options
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {boolean} options.square texture should be square
 * @param {boolean} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param {function} callback
 */
function generate(files, options, callback) {
  files = Array.isArray(files) ? files : glob.sync(files);
  files = files.map(function (item) {
    return {
      path: item,
      name: item.substring(item.lastIndexOf('/') + 1, item.lastIndexOf('.'))
    };
  });

  options = options || {};
  options.name = options.name || 'spritesheet';
  options.imageFile = options.name + '.png';
  options.dataFile = options.name + '.xml';
  options.path = options.path ? options.path + '/' : '';
  options.square = options.square || true;
  options.powerOfTwo = options.powerOfTwo || true;

  if (!fs.existsSync(options.path) && options.path !== '') fs.mkdirSync(options.path);

  async.waterfall([
    function (callback) {
      generator.getImagesSizes(files, callback);
    },
    function (files, callback) {
      generator.determineCanvasSize(files, options, callback);
    },
    function (options, callback) {
      generator.generateImage(files, options, callback);
    },
    function (callback) {
      generator.generateData(files, options, callback);
    }
  ],
    callback);
}
