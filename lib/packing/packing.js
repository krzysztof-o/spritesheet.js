var binpacking = require('binpacking');

var algorithms = {
  'binpacking': binpackingStrict,
  'growing-binpacking': growingBinpacking,
  'horizontal': horizontal,
  'vertical': vertical
};
exports.pack = function (algorithm, files, options) {
  algorithm = algorithm || 'growing-binpacking';
  algorithms[algorithm](files, options);
};

function growingBinpacking(files, options) {
  var packer = new binpacking.GrowingPacker();
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
}


function binpackingStrict(files, options) {
  var packer = new binpacking.Packer(options.width, options.height);
  packer.fit(files);

  files.forEach(function (item) {
    item.x = item.fit ? item.fit.x : 0;
    item.y = item.fit ? item.fit.y : 0;
    delete item.fit;
    delete item.w;
    delete item.h;
  });

  options.width = packer.root.w;
  options.height = packer.root.h;
}

function vertical(files, options) {
  var y = 0;
  var maxWidth = 0;
  files.forEach(function (item) {
    item.x = 0;
    item.y = y;
    maxWidth = Math.max(maxWidth, item.height);
    y += item.height;
  });

  options.width = maxWidth;
  options.height = y;
}

function horizontal(files, options) {
  var x = 0;
  var maxHeight = 0;
  files.forEach(function (item) {
    item.x = x;
    item.y = 0;
    maxHeight = Math.max(maxHeight, item.height);
    x += item.width;
  });

  options.width = x;
  options.height = maxHeight;
}