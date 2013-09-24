spritesheet.js
==============

Spritesheet (a.k.a. Texture Atlas) generator in node.js

###Supported spritesheet formats###
* Starling / Sparrow
* JSON (i.e. PIXI.js)
* Easel.js
* cocos2d

###Usage###
1. Command Line
    ```bash
    $ spritesheet-js
    Usage: spritesheet-js [options] <files>

	Options:
	  -f, --format  format of spritesheet (starling, sparrow, json, pixi.js, easel.js, cocos2d)  [default: "json"]
	  -n, --name    name of generated spritesheet                                                [default: "spritesheet"]
	  -p, --path    path to export directory                                                     [default: "."]
	  --square      texture should be s square                                                   [default: true]
	  --powerOfTwo  texture width and height should be power of two                              [default: true]
    ```
2. Node.js 
    ```javascript
    var spritesheet = require('spritesheet-js');
    
    spritesheet('assets/*.png', {name: 'spritesheet', format: 'json'}, function (err) {
      if (err) throw err;

      console.log('spritesheet successfully generated');
    });
  ```
  
###Installation###
1. Install [ImageMagick](http://www.imagemagick.org/)
2. ```npm install spritesheet-js -g```

###Test###
```
mocha test
```

###TODO:###
* trimming images
