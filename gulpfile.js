var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');


var vjsFiles = [
  	'./js/vjs-playlist.js', 
  	'./js/vjs-hotkeys.js', 
  	'./js/vjs-progress-tooltip.js', 
  	'./js/vjs-prepare-data.js',
  	'./js/videojs.ads.js',
  	'./js/fox_play.js'
];

// --
 
gulp.task('javascript', function() {
  return gulp.src(vjsFiles)
    .pipe(sourcemaps.init())
    .pipe(concat('concat.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('vjs.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

// --

gulp.task('watch', function() {
    gulp.watch(['js/*.js', 'css/*.css'], ['javascript']);
});

// --

gulp.task('default', ['javascript', 'watch']);