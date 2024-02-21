const { execSync } = require('child_process');

const exec = function (cmd, callback) {
  let stdoutBuffer = '', err = '';
  try {
    stdoutBuffer = execSync(cmd);
  } catch (e) {
    err = e.toString();
  }
  callback(err, stdoutBuffer.toString());
}

var fs = require('fs');
var Mustache = require('mustache');
var async = require('async');
var os = require('os');
var path = require('path');
var crypto = require("crypto");
var util = require('util');
var _ = require('underscore');

var packing = require('./packing/packing.js');
var sorter = require('./sorter/sorter.js');

var BATCH_SIZE = 10;

/**
 * Generate temporary trimmed image files
 * @param {string[]} files
 * @param {object} options
 * @param {boolean} options.trim is trimming enabled
 * @param callback
 */
exports.trimImages = function (files, options, callback) {
	if (!options.trim) return callback(null);
	
	var uuid = crypto.randomBytes(16).toString("hex");
	var i = 0;
	async.eachSeries(files, function (file, next) {
		file.originalPath = file.path;
		i++;
		file.path = path.join(os.tmpdir(), 'spritesheet_js_' + uuid + "_" + (new Date()).getTime() + '_image_' + i + '.png');

		var scale = options.scale && (options.scale !== '100%') ? ' -resize ' + options.scale : '';
		var fuzz = options.fuzz ? ' -fuzz ' + options.fuzz : '';
		//have to add 1px transparent border because imagemagick does trimming based on border pixel's color
		exec('convert' + scale + ' ' + fuzz + ' -define png:exclude-chunks=date "' + file.originalPath + '" -bordercolor transparent -border 1 -trim "' + file.path + '"', next);
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
		if (err) return callback(new Error('Execution of identify command failed. Ensure that ImageMagick Legacy Tools are installed and added to your PATH.'));

		var sizes = stdout.split('\n');
		sizes = sizes.splice(0, sizes.length - 1);
		sizes.forEach(function (item, i) {
			var size = item.match(/ ([0-9]+)x([0-9]+) /);
			files[i].width = parseInt(size[1], 10) + options.padding * 2;
			files[i].height = parseInt(size[2], 10) + options.padding * 2;
			var forceTrimmed = false;
			if (options.divisibleByTwo) {
				if (files[i].width & 1) {
					files[i].width += 1;
					forceTrimmed = true;
				}
				if (files[i].height & 1) {
					files[i].height += 1;
					forceTrimmed = true;
				}
			}
			files[i].area = files[i].width * files[i].height;
			files[i].trimmed = false;

			if (options.trim) {
				var rect = item.match(/ ([0-9]+)x([0-9]+)[\+\-]([0-9]+)[\+\-]([0-9]+) /);
				files[i].trim = {};
				files[i].trim.x = parseInt(rect[3], 10) - 1;
				files[i].trim.y = parseInt(rect[4], 10) - 1;
				files[i].trim.width = parseInt(rect[1], 10) - 2;
				files[i].trim.height = parseInt(rect[2], 10) - 2;

				files[i].trimmed = forceTrimmed || (files[i].trim.width !== files[i].width - options.padding * 2 || files[i].trim.height !== files[i].height - options.padding * 2);
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

	// sort files based on the choosen options.sort method
	sorter.run(options.sort, files);

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

function makeCommands(fileList, options, index) {
	return [
		`convert -define png:exclude-chunks=date -quality 0% -size ${options.width}x${options.height} xc:none -set comment "Created with spritesheet.js" -background none`,
		index !== 0 &&
			`"${options.path}/${options.name}.png" -composite`,
		...fileList.map(
			file =>
				`"${file.path}" -geometry +${
					(file.x + options.padding)}+${
					(file.y + options.padding)} -composite`
		),
		`"${options.path}/${options.name}.png"`,
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * generates texture data file
 * @param {object[]} files
 * @param {object} options
 * @param {string} options.path path to image file
 * @param {function} callback
 */
exports.generateImage = function (files, options, callback) {
	var fileBatches = _.chunk(files, BATCH_SIZE);
	var commands = fileBatches.map((fileList, index) =>
		makeCommands(fileList, options, index)
	);

	var execPromise = util.promisify(exec);

	var runAllCommands = async () => {
		for (command of commands) {
			await execPromise(command);
		}
	}

	runAllCommands()
		.then(() => {
			unlinkTempFiles(files);
			callback(null);
		})
		.catch(err => callback(err));
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
	var formats = (Array.isArray(options.customFormat) ? options.customFormat : [options.customFormat]).concat(Array.isArray(options.format) ? options.format : [options.format]);
	formats.forEach(function(format, i){
		if (!format) return;
		var path = typeof format === 'string' ? format : __dirname + '/../templates/' + format.template;
		var templateContent = fs.readFileSync(path, 'utf-8');
		var cssPriority = 0;
		var cssPriorityNormal = cssPriority++;
		var cssPriorityHover = cssPriority++;
		var cssPriorityActive = cssPriority++;

		// sort files based on the choosen options.sort method
		sorter.run(options.sort, files);

		options.files = files;
		options.files.forEach(function (item, i) {
			item.spritesheetWidth = options.width;
			item.spritesheetHeight = options.height;
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
			if (item.cssName.indexOf("_hover") >= 0) {
				item.cssName = item.cssName.replace("_hover", ":hover");
				item.cssPriority = cssPriorityHover;
			}
			else if (item.cssName.indexOf("_active") >= 0) {
				item.cssName = item.cssName.replace("_active", ":active");
				item.cssPriority = cssPriorityActive;
			}
			else {
				item.cssPriority = cssPriorityNormal;
			}
		});

		function getIndexOfCssName(files, cssName) {
			for (var i = 0; i < files.length; ++i) {
				if (files[i].cssName === cssName) {
					return i;
				}
			}
			return -1;
		};

		if (options.cssOrder) {
			var order = options.cssOrder.replace(/\./g,"").split(",");
			order.forEach(function(cssName) {
				var index = getIndexOfCssName(files, cssName);
				if (index >= 0) {
					files[index].cssPriority = cssPriority++;
				}
				else {
					console.warn("could not find :" + cssName + "css name");
				}
			});
		}

		options.files.sort(function(a, b) {
			return a.cssPriority - b.cssPriority;
		});

		options.files[options.files.length - 1].isLast = true;

		var result = Mustache.render(templateContent, options);
		function findPriority(property) {
			var value = options[property];
			var isArray = Array.isArray(value);
			if (isArray) {
				return i < value.length ? value[i] : format[property] || value[0];
			}
			return format[property] || value;
		}
		fs.writeFile(findPriority('path') + '/' + findPriority('name') + '.' + findPriority('extension'), result, callback);
	});
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
