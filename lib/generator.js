var exec = require('child_process').exec;
var fs = require('fs');
var Mustache = require('mustache');
var async = require('async');
var os = require('os');
var path = require('path');

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
		file.path = path.join(os.tmpDir(), 'spritesheet_js_' + (new Date()).getTime() + '_image_' + i + '.png');

		var scale = options.scale !== '100%' ? ' -resize ' + options.scale : '';
		//have to add 1px transparent border because imagemagick does trimming based on border pixel's color
		exec('convert' + scale + ' -define png:exclude-chunks=date "' + file.originalPath + '" -bordercolor transparent -border 1 -trim "' + file.path + '"', next);
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
		return '"' + file.path + '"';
	});
	exec('identify ' + filePaths.join(' '), function (err, stdout) {
		if (err) return callback(err);

		var sizes = stdout.split('\n');
		sizes = sizes.splice(0, sizes.length - 1);
		sizes.forEach(function (item, i) {
			var size = item.match(/ ([0-9]+)x([0-9]+) /);
			files[i].width = parseInt(size[1], 10) + options.padding * 2;
			files[i].height = parseInt(size[2], 10) + options.padding * 2;
			files[i].trimmed = false;

			if (options.trim) {
				var rect = item.match(/ ([0-9]+)x([0-9]+)[\+\-]([0-9]+)[\+\-]([0-9]+) /);
				files[i].trim = {};
				files[i].trim.x = parseInt(rect[3], 10) - 1;
				files[i].trim.y = parseInt(rect[4], 10) - 1;
				files[i].trim.width = parseInt(rect[1], 10) - 2;
				files[i].trim.height = parseInt(rect[2], 10) - 2;

				files[i].trimmed = (files[i].trim.width !== files[i].width - options.padding * 2 || files[i].trim.height !== files[i].height - options.padding * 2);
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
	var command = ['convert -define png:exclude-chunks=date -quality 0% -size ' + options.width + 'x' + options.height + ' xc:none'];
	files.forEach(function (file) {
		command.push('"' + file.path + '" -geometry +' + (file.x + options.padding) + '+' + (file.y + options.padding) + ' -composite');
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
	var templateContent = fs.readFileSync(__dirname + '/../templates/' + options.format.template, 'utf-8');
	options.files = files;
	options.files.reverse();
	options.files[options.files.length - 1].isLast = true;
	options.files.forEach(function (item, i) {
		item.width  -= options.padding * 2;
		item.height -= options.padding * 2;
		item.x += options.padding;
		item.y += options.padding;

		item.index = i;
		if (item.trim) {
			item.trim.frameX = -item.trim.x;
			item.trim.frameY = -item.trim.y;
			item.trim.offsetX = Math.floor(Math.abs(item.trim.x + item.width / 2 - item.trim.width / 2));
			item.trim.offsetY = Math.floor(Math.abs(item.trim.y + item.height / 2 - item.trim.height / 2));
		}
		item.cssName = item.name || "";
		item.cssName = item.cssName.replace("_hover", ":hover");
		item.cssName = item.cssName.replace("_active", ":active");
	});

	var result = Mustache.render(templateContent, options);
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
