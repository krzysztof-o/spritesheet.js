var spritesheet = require('../index');

spritesheet(__dirname + '/assets/*', {name: 'generator', 'path': __dirname}, function (err) {
  if (err) throw err;

  console.log('Spritesheet successfully generated in', __dirname);
});