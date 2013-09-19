var spritesheet = require('../spritesheet');

spritesheet(__dirname + '/assets/*', {name: 'spritesheet', 'path': __dirname}, function (err) {
  if (err) throw err;

  console.log('Spritesheet successfully generated in', __dirname);
});