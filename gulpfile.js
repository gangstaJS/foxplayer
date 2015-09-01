var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var sftp = require('gulp-sftp');


var sftpConf = {
    host: 'ex.ua',
    user: 'fexpub',
    key: {
      location: './secret/id_rsa'
    },
    remotePath: '/home/fex/htdocs/ex2_player_test/dist'
};

var vjsFiles = [
    './js/video.js', 
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

// --
 
gulp.task('js', function() {
  return gulp.src(vjsFiles)
  	.pipe(jshint())
  	.pipe(reporter = jshint.reporter('default', { ignoreWarning: true, verbose: true }))
    .pipe(sourcemaps.init())
    .pipe(concat('concat.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('vjs.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
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

gulp.task('sftp', function() {
   return gulp.src('./dist/*')
    .pipe(sftp(sftpConf));
});

// --

gulp.task('default', ['js', 'css', 'sftp', 'watch']);

gulp.task('watch', function() {
    gulp.watch(['js/*.js', 'css/*.css'], ['js', 'css', 'sftp']);
});

// --