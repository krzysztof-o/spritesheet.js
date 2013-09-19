#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');

module.exports = generate;

if (!module.parent) {
  //todo: command line usage
}

/**
 * generates spritesheet
 * @param {string[]} files path to image files
 * @param {object} options
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {boolean} options.square texture should be square
 * @param {boolean} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param {function} callback
 */
function generate(files, options, callback) {
  files = files.map(function (name) {
    return {name: name};
  });
  options = options || {};
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
