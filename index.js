#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var optimist = require('optimist');

module.exports = generate;

var FORMATS = {
  'json' : {template: 'json.template', extension: 'json'},
  'pixi.js' : {template: 'json.template', extension: 'json'},
  'starling' : {template: 'starling.template', extension: 'xml'},
  'sparrow' : {template: 'starling.template', extension: 'xml'}
};

if (!module.parent) {
  var argv = optimist.usage('Usage: $0 [options] <files>')
    .describe('format', 'format of spritesheet (starling, sparrow, json, pixi.js)')
    .describe('name', 'name of generated spritesheet')
    .describe('path', 'path to export directory')
    .describe('square', 'texture should be square')
    .describe('powerOfTwo', 'texture width and height should be power of two')
    .boolean('square', 'powerOfTwo')
    .default({square: true, powerOfTwo: true, format: 'json', name: 'spritesheet', path: '.'})
    .argv;

  if (argv._.length == 0) {
    console.log('Please specify image files path');
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
 * @param {string} options.format format of spritesheet (starling, sparrow, json, pixi.js)
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {boolean} options.square texture should be square
 * @param {boolean} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param {function} callback
 */
function generate(files, options, callback) {
  files = Array.isArray(files) ? files : glob.sync(files);
  if (files.length == 0) return callback(new Error('no files specified'));

  files = files.map(function (item) {
    return {
      path: item,
      name: item.substring(item.lastIndexOf('/') + 1, item.lastIndexOf('.'))
    };
  });

  options = options || {};
  options.format = FORMATS[options.format] || FORMATS['json'];
  options.name = options.name || 'spritesheet';
  options.path = path.resolve(options.path || '.');
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