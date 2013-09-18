var spritesheet = require('../index');

var FILES = [
  __dirname + '/assets/50x50.jpg',
  __dirname + '/assets/100x100.jpg',
  __dirname + '/assets/200x200.jpg',
  __dirname + '/assets/500x500.jpg'
];

spritesheet.generate(FILES, {name: 'spritesheet', 'path': __dirname}, function (err) {
  if (err) throw err;

  console.log('Spritesheet successfully generated in', __dirname);
});