const { src, dest, watch, parallel, series } = require("gulp");
const sass =  require('gulp-sass')(require('sass'));
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const eslint = require("gulp-eslint");
const mocha = require("gulp-mocha");
const sync = require("browser-sync").create();
// function mytask(callback){
//     callback();
// }

// exports.mytask=mytask;



// To mark successful completion call cb without arguments:
// cb()

// On error, call the callback with an Error instance:
// cb(new Error('Something bad has happened'));

// Exported functions are directly callable from the command line:
// $ gulp mytask

// function copy(cb){
//     src('routes/*.js')
//         .pipe(dest('copies'));
//     cb();
// }
// exports.copy=copy;

function generateCSS(cb) {
    src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('public/stylesheets'))
        .pipe(sync.stream());
    cb();
}

function generateHTML(cb) {
    src("./views/index.ejs")
        .pipe(ejs({
            title: "Hello Semaphore!",
        }))
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(dest("public"));
    cb();
}

function runLinter(cb) {
    return src(['**/*.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format()) 
        .pipe(eslint.failAfterError())
        .on('end', function() {
            cb();
        });
}

function runTests(cb) {
    return src(['**/*.test.js'])
        .pipe(mocha())
        .on('error', function() {
            cb(new Error('Test failed'));
        })
        .on('end', function() {
            cb();
        });
}

// watch is required to automatically do
// all the processing tasks when a change 
//happens in the code.
//watch takes as arguments:
// Files to be watched.
// Callback to be triggered after the change.

function watchFiles(cb) {
    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch([ '**/*.js', '!node_modules/**'], parallel(runLinter, runTests));
}

// Templates: every time a file in views/ with ejs extension is changed, generateHTML is called.
// Sass: the same thing happens with scss files in the sass/ directory.
// Tests: triggers every time a JavaScript file outside node_modules/ is modified. We’re using the parallel() function we imported at the beginning to start both functions concurrently. Gulp also provides a series() function to call functions one after the other.
// The watch task will continue running until stopped


function browserSync(cb) {
    sync.init({
        server: {
            baseDir: "./public"
        }
    });

    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch("./public/**.html").on('change', sync.reload);
}

exports.css = generateCSS;
exports.html = generateHTML;
exports.lint = runLinter;
exports.test = runTests;
exports.watch = watchFiles;
exports.sync = browserSync;

exports.default = series(runLinter,parallel(generateCSS,generateHTML),runTests);