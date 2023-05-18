'use strict';
/*

Author: Ivan Khohkriav

Date assembling: 2023

*/

const {src, dest, watch, parallel, series} = require('gulp');
//подключение sass
const scss          = require('gulp-sass')(require('sass'));

const concat        = require('gulp-concat');

const uglify        = require('gulp-uglify-es').default;

const browsersync   = require('browser-sync').create();

const autoprefixer  = require('gulp-autoprefixer');

const cssbeautify   = require("gulp-cssbeautify");

const clean         = require('gulp-clean');

const avif          = require('gulp-avif');

const webp          = require('gulp-webp');

const newer         = require('gulp-newer');

const imagemin      = require('gulp-imagemin');

const rename        = require('gulp-rename');

const gulpIf        = require('gulp-if');

const svgSprite     = require('gulp-svg-sprite');

const fonter        = require('gulp-fonter');

const ttf2woff2     = require('gulp-ttf2woff2');

const include       = require("gulp-include");

const typograf      = require("gulp-typograf");

const rigger        = require("gulp-rigger");

const plumber = require("gulp-plumber");

const fileInclude = require('gulp-file-include');




function script(){

    return src(['app/js/main.js'])
            .pipe(plumber(
              {
                errorHandler: function(err){
                  notify.onError({
                    title: "JS error",
                    message: "Error: <%= error.message %>"
                  })(err);
                  this.emit('end');
                }
              }
              ))
            .pipe(concat('main.min.js'))
            .pipe(rigger())
            .pipe(uglify())
            .pipe(dest('app/js'))
            .pipe(browsersync.stream())
}

function styles(){

    return src(['app/scss/style.scss'])
            .pipe(plumber(
              {
              errorHandler: function(err){
                notify.onError({
                  title: "less error",
                  message: "Error: <%= error.message %>"
                })(err);
                this.emit('end');
              }
            }
            ))
            .pipe(cssbeautify())
            .pipe(concat('styles.min.css'))
            .pipe(scss({outputStyle: 'compressed'}))
            .pipe(autoprefixer({
              cascade: false,
              grid: true,
              overrideBrowserslist: ["last 5 versions"]
            }))
            .pipe(dest('app/css'))
            .pipe(browsersync.stream())

}

function watching(){

  browsersync.init({
    server:{
        baseDir: 'app/',
        browser: "Chrome",
    }
})

    watch(['app/scss/**/*'], styles)
    watch(['app/img/src'], images)
    watch(['app/js/main.js'], script)
    watch(['app/partials/*.html','app/pages/*.html'], pages)
    watch(['app/**/*.html']).on('change', browsersync.reload)
}



function building(){

    return src([
      'app/css/styles.min.css',
      'app/vendor/*.*',
      'app/js/main.min.js',
      'app/js/components/*.*',
      'app/js/vendor/*.*',
      'app/img/*.*',
      'app/fonts/*.*',
      'app/resource/**.*',
      'app/*.html',
        ],{base: 'app'})
        .pipe(dest('dist'))
        .pipe(browsersync.stream())
}

function cleanDist(){

  return src('dist/**/*.*')
  .pipe(clean())
}

function textTypograf(){

  return src('app/*.html')
  .pipe(typograf({
    locale: ['ru', 'en-US'],
    // Type of HTML entities: 'digit' - &#160;, 'name' - &nbsp;, 'default' - UTF-8
    htmlEntity: { type: 'digit' },
    disableRule: ['ru/optalign/*'],
    enableRule: ['ru/money/ruble'],
    safeTags: [
        ['<\\?php', '\\?>'],
        ['<no-typography>', '</no-typography>']
    ]}))
  .pipe(dest('app'))

}

function images(){


  return src(['app/img/src/**/*.*', '!app/img/**/*.svg'])
          .pipe(newer('app/img'))
          .pipe(avif({quality: 50}))

          .pipe(src('app/img/src/**/*.*'))
          .pipe(newer('app/img'))
          .pipe(webp())

          .pipe(src('app/img/src/**/*.*'))
          .pipe(newer('app/img'))
          .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 70, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
              plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
              ]
            })
          ]))
          .pipe(dest('app/img'))
}

function sprite(){

  return src('app/img/*.svg')
          .pipe(svgSprite({
                mode:{
                  stack:{
                    sprite:"../sprite.svg",
                    example: true
                  }
                }
              }))
              .pipe(dest('app/img'))




}



function fonts() {

  return src('app/fonts/src/*.*')
          .pipe(fonter({
            formats: ['woff', 'ttf']
          }))
          .pipe(src('app/fonts/*.ttf'))
          .pipe(ttf2woff2())
          .pipe(dest('app/fonts'))
}

function pages(){

  return src('app/pages/*.html')
          .pipe(include({
            includePaths: 'app/partials'
          })).pipe(dest('app'))
          .pipe(browsersync.stream())
}

const htmlInclude = () => {
  return src([`app/*.html`])
    .pipe(fileInclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(typograf({
      locale: ['ru', 'en-US']
    }))
    .pipe(dest('app'))
    .pipe(browserSync.stream());
}




exports.styles = styles;

exports.script = script;

exports.watching = watching;

exports.images = images;

exports.sprite = sprite;

exports.fonts = fonts;

exports.pages= pages;

exports.building = building;

exports.textTypograf = textTypograf;

const build = series(parallel(styles,images,script,pages,textTypograf,watching,building));



exports.default = series(cleanDist,build);


