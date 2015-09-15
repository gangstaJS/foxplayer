const gulp = require('gulp');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const jshint = require('gulp-jshint');
const GulpSSH  = require('gulp-ssh');
const fs  = require('fs');

var vjsFiles = [
    './js/video.js',
    './js/vjs-state.js', 
  	'./js/vjs-playlist.js', 
  	'./js/vjs-hotkeys.js', 
  	'./js/vjs-progress-tooltip.js', 
  	'./js/vjs-vast-trecking.js',
  	'./js/videojs.ads.js',
  	'./js/vjs-prepare-data.js',  	
  	'./js/vjs-start-foxplayer.js'
];


var vjsCss = [
  './css/video-js.css', 
  './css/video-js-custom.css', 
  './css/videojs.ads.css'
];

var config = {
  host: 'ex.ua',
  username: 'fexpub',
  privateKey: fs.readFileSync('./secret/id_rsa')
};

var gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: config
});

// --
 
gulp.task('js', function() {
  return gulp.src(vjsFiles)
  	.pipe(jshint())
  	.pipe(jshint.reporter('default', { ignoreWarning: true, verbose: true }))
    // .pipe(sourcemaps.init())
    .pipe(concat('concat.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('vjs.min.js'))
    .pipe(uglify({
        sourceMap: false,
        // sourceMapIn: 'dist/vjs.min.js.map',
        // sourceMapRoot: './',
        preserveComments: false,
        mangle: true,
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: false
        }
      }))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

// --

gulp.task('css', function() {
   return gulp.src(vjsCss)
   .pipe(sourcemaps.init())
    .pipe(concat('concat.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});


gulp.task('dest', ['js', 'css'], function () {
  return gulp.src('./dist/*')
    .pipe(gulpSSH.dest('/home/fex/htdocs/ex2_player_test/dist'));
});
// --

gulp.task('default', [
  'dest', 
  'watch'
  ]);

gulp.task('watch', function() {
    gulp.watch(['js/*.js', 'css/*.css'], [ 
      'dest'
      ]);
});

// --