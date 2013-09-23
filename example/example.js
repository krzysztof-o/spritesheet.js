var spritesheet = require('../');

spritesheet(__dirname + '/assets/*', {format: 'json', 'path': __dirname}, function (err) {
  if (err) throw err;

  console.log('Spritesheet successfully generated in', __dirname);
});