#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
const { program } = require('commander');
program.version('0.0.1');

module.exports = generate;

var FORMATS = {
  'json': {template: 'json.template', extension: 'json', trim: false},
  'yaml': {template: 'yaml.template', extension: 'yaml', trim: false},
  'jsonarray': {template: 'jsonarray.template', extension: 'json', trim: false},
  'pixi.js': {template: 'json.template', extension: 'json', trim: true},
  'starling': {template: 'starling.template', extension: 'xml', trim: true},
  'sparrow': {template: 'starling.template', extension: 'xml', trim: true},
  'easel.js': {template: 'easeljs.template', extension: 'json', trim: false},
  'egret': {template: 'egret.template', extension: 'json', trim: false},
  'zebkit': {template: 'zebkit.template', extension: 'js', trim: false},
  'cocos2d': {template: 'cocos2d.template', extension: 'plist', trim: false},
  'cocos2d-v3': {template: 'cocos2d-v3.template', extension: 'plist', trim: false},
  'css': {template: 'css.template', extension: 'css', trim: false}
};

if (!module.parent) {

  let _ = []  

  program
    .arguments('<files...>')
    .option('-f, --format <value>', 'format of spritesheet (starling, sparrow, json, yaml, pixi.js, easel.js, egret, zebkit, cocos2d)', '')
    .option('-cf, --customFormat <value>', 'path to external format template', '')
    .option('-n, --name <value>', 'name of generated spritesheet', 'spritesheet')
    .option('-p, --path <value>', 'path to export directory', '.')
    .option('--fullpath', 'include path in file name', false)
    .option('--prefix <value>', 'prefix for image paths', "")
    .option('--trim', 'removes transparent whitespaces around images', false)
    .option('--square', 'texture should be s square', false)
    .option('--powerOfTwo', 'texture width and height should be power of two', false,)
    .option('--validate', 'check algorithm returned data', false)
    .option('--scale <value>', 'percentage scale', '100%')
    .option('--fuzz <value>', 'percentage fuzz factor (usually value of 1% is a good choice)', '')
    .option('--algorithm <value>', 
        'packing algorithm: growing-binpacking (default), binpacking (requires passing --width and --height options), vertical or horizontal',
        'growing-binpacking')
    .option('--width <value>', 'width for binpacking', undefined)
    .option('--height <value>', 'height for binpacking', undefined)
    .option('--padding <value>', 'padding between images in spritesheet', 0)
    .option('--sort <value>', 'Sort method: maxside (default), area, width or height', 'maxside' )
    .option('--divisibleByTwo', 'every generated frame coordinates should be divisible by two', false)
    .option('--cssOrder <value>', 'specify the exact order of generated css class names', '')
    .action((files) => {
      _ = files.length == 1 ? files[0] : files
    })

  
  program.parse(process.argv)

  const argv = program.opts();
  argv._ = _
  
  if (argv._.length == 0) {
    program.help()
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
 * @param {string} options.format format of spritesheet (starling, sparrow, json, yaml, pixi.js, zebkit, easel.js, cocos2d)
 * @param {string} options.customFormat external format template
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {string} options.prefix prefix for image paths
 * @param {boolean} options.fullpath include path in file name
 * @param {boolean} options.trim removes transparent whitespaces around images
 * @param {boolean} options.square texture should be square
 * @param {boolean} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param {string} options.algorithm packing algorithm: growing-binpacking (default), binpacking (requires passing width and height options), vertical or horizontal
 * @param {boolean} options.padding padding between images in spritesheet
 * @param {string} options.sort Sort method: maxside (default), area, width, height or none
 * @param {boolean} options.divisibleByTwo every generated frame coordinates should be divisible by two
 * @param {string} options.cssOrder specify the exact order of generated css class names
 * @param {function} callback
 */
function generate(files, options, callback) {  
  files = Array.isArray(files) ? files : glob.sync(files);
  if (files.length == 0) return callback(new Error('no files specified'));

  options = options || {};
  if (Array.isArray(options.format)) {
    options.format = options.format.map(function(x){return FORMATS[x]});
  }
  else if (options.format || !options.customFormat) {
    options.format = [FORMATS[options.format] || FORMATS['json']];
  }
  options.name = options.name || 'spritesheet';
  options.spritesheetName = options.name;
  options.path = path.resolve(options.path || '.');
  options.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
  options.square = options.hasOwnProperty('square') ? options.square : false;
  options.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
  options.extension = options.hasOwnProperty('extension') ? options.extension : options.format[0].extension;
  options.trim = options.hasOwnProperty('trim') ? options.trim : options.format[0].trim;
  options.algorithm = options.hasOwnProperty('algorithm') ? options.algorithm : 'growing-binpacking';
  options.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
  options.padding = options.hasOwnProperty('padding') ? parseInt(options.padding, 10) : 0;
  options.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
  options.divisibleByTwo = options.hasOwnProperty('divisibleByTwo') ? options.divisibleByTwo : false;
  options.cssOrder = options.hasOwnProperty('cssOrder') ? options.cssOrder : null;

  files = files.map(function (item, index) {
    var resolvedItem = path.resolve(item);
    var name = "";
    if (options.fullpath) {
      name = item.substring(0, item.lastIndexOf("."));
    }
    else {
      name = options.prefix + resolvedItem.substring(resolvedItem.lastIndexOf(path.sep) + 1, resolvedItem.lastIndexOf('.'));
    }
    return {
      index: index,
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
