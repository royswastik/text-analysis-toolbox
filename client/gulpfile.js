'use strict';
 
var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel'); 
var plumber = require('gulp-plumber');

gulp.task('sass', function () {
  return gulp.src('./style/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./style'));
});

gulp.task('js', function(){
    return gulp.src('js/*.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'))
});
 
gulp.task('watch', function () {
  gulp.watch('./style/*.scss', ['sass']);
  gulp.watch('./js/*.js', ['js']);
});