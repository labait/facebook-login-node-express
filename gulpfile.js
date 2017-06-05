

var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var exec = require('child_process').exec;


//gulp.task('default', ['browser-sync'], function () {
gulp.task('default', ['nodemon'], function () {
});


gulp.task('sass', function () {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public/css'));
});


gulp.task('sass:watch', function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
});


gulp.task('browser-sync', ['nodemon'], function() {
	browserSync.init(null, {
		proxy: "http://localhost:5000",
        files: ["public/**/*.*"],
        browser: "google chrome",
        port: 7000,
	});
});


gulp.task('nodemon', [ 'sass:watch'], function (cb) {
  //exec('mongod --dbpath ./data', function (err, stdout, stderr) {
  exec('mongod', function (err, stdout, stderr) {
     console.log(stdout);
     console.log(stderr);
     cb(err);
  });

	var started = false;
	return nodemon({
		script: 'app.js'
	}).on('start', function () {
		// to avoid nodemon being started multiple times
		// thanks @matthisk
		if (!started) {
			cb();
			started = true;
		}
	});
});
