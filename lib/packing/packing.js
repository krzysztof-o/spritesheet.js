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

  if (options.validate) {
    validate(files, options);
  }
};

function validate(files, options) {
  files.forEach(function (item) {
    if (item.x + item.width > options.width || item.y + item.height > options.height) {
      throw new Error("Can't fit all textures in given spritesheet size");
    }
  });

  var intersects = function(x_1, y_1, width_1, height_1, x_2, y_2, width_2, height_2)
  {
    return !(x_1 >= x_2+width_2 || x_1+width_1 <= x_2 || y_1 >= y_2+height_2 || y_1+height_1 <= y_2);
  }

  files.forEach(function (a) {
    files.forEach(function (b) {
      if (a !== b && intersects(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height)) {
        console.log(a, b);
        throw new Error("Can't fit all textures in given spritesheet size");
     }
    });
  });
}

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
    maxWidth = Math.max(maxWidth, item.width);
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