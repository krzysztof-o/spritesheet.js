#!/bin/bash

node ../index.js -p json -f json assets/*.png
node ../index.js -p starling_sparrow -f starling assets/*.png
node ../index.js -p easel_js -f easel.js assets/*.png
node ../index.js -p cocos2d -f cocos2d assets/*.png

