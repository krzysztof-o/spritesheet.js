#!/bin/bash

node ../index.js -p json -f json assets/*
node ../index.js -p starling_sparrow -f starling assets/*
node ../index.js -p easel_js -f easel.js assets/*
node ../index.js -p cocos2d -f cocos2d assets/*