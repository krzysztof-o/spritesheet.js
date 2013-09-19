spritesheet.js
==============

Spritesheets generator in node.js

###Supported spritesheet formats###
* Starling / Sparrow

###Usage###
1. Command Line
    ```bash
    $ ./spritesheet.js 
    Usage: node ./spritesheet.js [options] <files>

    Options:
      --name        name of generated spritesheet                  
      --path        path to export directory                       
      --square      texture should be square                         [default: true]
      --powerOfTwo  texture width and height should be power of two  [default: true]
    ```
2. Node.js 
    ```javascript
    var spritesheet = require('spritesheet.js');
    
    spritesheet('assets/*.png', {name: 'spritesheet'}, function (err) {
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
* trimming images
* additional spritesheet formats
  * Easel.js
  * cocos2D
