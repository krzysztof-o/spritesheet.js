spritesheet.js
==============

Spritesheets generator in node.js

###Supported spritesheet formats###
* Starling / Sparrow

###Example###
```javascript
var spritesheet = require('spritesheet.js');

spritesheet(['1.png', '2.png'], {name: 'spritesheet'}, function (err) {
  if (err) throw err;

  console.log('Spritesheet successfully generated in', __dirname);
});
```
###Installation###
1. Install [ImageMagick](http://www.imagemagick.org/)
2. ```npm install spritesheet.js```

###Test###
```
mocha test
```

###TODO:###
* command line interface
* file masks
* trimming images
* additional spritesheet formats
  * Easel.js
  * cocos2D
