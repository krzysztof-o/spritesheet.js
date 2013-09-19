#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');
var glob = require('glob');

//var optimist = require('optimist');
module.exports = generate;

if (!module.parent) {
  //todo: command line usage


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
    return {name: item};
  });

  options = options || {};
  options.name = options.name || 'spritesheet';
  options.imageFile = options.name + '.png';
  options.dataFile = options.name + '.xml';
  options.path = options.path ? options.path + '/' : '';
  options.square = options.square || true;
  options.powerOfTwo = options.powerOfTwo || true;


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
