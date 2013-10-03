#!/bin/bash

node ../index.js -p json -f json --trim assets/*.png
node ../index.js -p starling_sparrow -f starling --trim assets/*.png
node ../index.js -p easel_js -f easel.js --trim assets/*.png
node ../index.js -p cocos2d -f cocos2d --trim assets/*.png

