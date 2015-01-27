#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var optimist = require('optimist');

module.exports = generate;

var FORMATS = {
  'json': {template: 'json.template', extension: 'json', trim: false},
  'jsonarray': {template: 'jsonarray.template', extension: 'json', trim: false},
  'pixi.js': {template: 'json.template', extension: 'json', trim: true},
  'starling': {template: 'starling.template', extension: 'xml', trim: true},
  'sparrow': {template: 'starling.template', extension: 'xml', trim: true},
  'easel.js': {template: 'easeljs.template', extension: 'json', trim: false},
  'cocos2d': {template: 'cocos2d.template', extension: 'plist', trim: false},
  'css': {template: 'css.template', extension: 'css', trim: false}
};

if (!module.parent) {
  var argv = optimist.usage('Usage: $0 [options] <files>')
    .options('f', {
      alias: 'format',
      describe: 'format of spritesheet (starling, sparrow, json, pixi.js, easel.js, cocos2d)',
      default: 'json'
    })
    .options('n', {
      alias: 'name',
      describe: 'name of generated spritesheet',
      default: 'spritesheet'
    })
    .options('p', {
      alias: 'path',
      describe: 'path to export directory',
      default: '.'
    })
    .options('fullpath', {
      describe: 'include path in file name',
      default: false,
      boolean: true
    })
    .options('prefix', {
      describe: 'prefix for image paths (css format only)',
      default: ""
    })
    .options('trim', {
      describe: 'removes transparent whitespaces around images',
      default: false,
      boolean: true
    })
    .options('square', {
      describe: 'texture should be s square',
      default: false,
      boolean: true
    })
    .options('powerOfTwo', {
      describe: 'texture width and height should be power of two',
      default: false,
      boolean: true
    })
    .options('validate', {
      describe: 'check algorihtm returned data',
      default: false,
      boolean: true
    })
    .options('algorithm', {
      describe: 'packing algorithm: growing-binpacking (default), binpacking (requires passing width and height options), vertical or horizontal',
      default: 'growing-binpacking'
    })
	  .options('padding', {
      describe: 'padding between images in spritesheet',
      default: 0
    })
    .demand(1)
    .argv;

  if (argv._.length == 0) {
    optimist.showHelp();
    return;
  }
  generate(argv._, argv, function (err) {
    if (err) throw err;
    console.log('Spritesheet successfully generated');
  });
}

/**
 * generates spritesheet
 * @param {string} files pattern of files images files
 * @param {string[]} files paths to image files
 * @param {object} options
 * @param {string} options.format format of spritesheet (starling, sparrow, json, pixi.js, easel.js, cocos2d)
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {string} options.prefix prefix for image paths (css format only)
 * @param {boolean} options.fullpath include path in file name
 * @param {boolean} options.trim removes transparent whitespaces around images
 * @param {boolean} options.square texture should be square
 * @param {boolean} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param {boolean} options.algorithm packing algorithm: growing-binpacking (default), binpacking (requires passing width and height options), vertical or horizontal
 * @param {boolean} options.padding padding between images in spritesheet
 * @param {function} callback
 */
function generate(files, options, callback) {
  files = Array.isArray(files) ? files : glob.sync(files);
  if (files.length == 0) return callback(new Error('no files specified'));

  options = options || {};
  options.format = FORMATS[options.format] || FORMATS['json'];
  options.name = options.name || 'spritesheet';
  options.spritesheetName = options.name;
  options.path = path.resolve(options.path || '.');
  options.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
  options.square = options.hasOwnProperty('square') ? options.square : false;
  options.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
  options.trim = options.hasOwnProperty('trim') ? options.trim : options.format.trim;
  options.algorithm = options.hasOwnProperty('algorithm') ? options.algorithm : 'growing-binpacking';
  options.padding = options.hasOwnProperty('padding') ? parseInt(options.padding, 10) : 0;
  options.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';

files = files.map(function (item) {
    resolvedItem = path.resolve(item);
    var name = "";
    if (options.fullpath) {
      name = item.substring(0, item.lastIndexOf("."));
    }
    else {
      name = resolvedItem.substring(resolvedItem.lastIndexOf('/') + 1, resolvedItem.lastIndexOf('.'));
    }
    return {
      path: resolvedItem,
      name: name,
      extension: path.extname(resolvedItem)
    };
  });


  if (!fs.existsSync(options.path) && options.path !== '') fs.mkdirSync(options.path);

  async.waterfall([
    function (callback) {
      generator.trimImages(files, options, callback);
    },
    function (callback) {
      generator.getImagesSizes(files, options, callback);
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
