// global
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var fileinclude = require('gulp-file-include');
var replace = require('gulp-replace');
var include = require('gulp-file-include');

// assets

// css
var postcss = require('gulp-postcss');
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer');
var pcss_size = require('postcss-short-size');
var pcss_alias = require('postcss-alias');
var pcss_base_64 = require('postcss-base64');
var pcss_media_query_packer = require('css-mqpacker');

var post_process = [
	autoprefixer({browsers: ['last 60 version']}),
	pcss_size(),
	pcss_base_64(),
	pcss_base_64(),
	pcss_media_query_packer({ sort: true })
];

// js
var babel = require('gulp-babel');

// html
var pug = require('gulp-pug');

// server
var web_server = require('gulp-webserver');
var live_reload = require('gulp-livereload');

var file_paths = {
	src: {
		assets: "./src/assets/",
		css: "./src/scss/",
		js: "./src/js/",
		html: "./src/pug/",
		modules: "./src/modules/"
	},
	dist: {
		assets: "./dist/assets/",
		css: "./dist/assets/css/",
		js: "./dist/assets/js/",
		html: "./dist/"
	}
};

var file_names = {
	assets: {
		compile: ['**/*.*', '**/_*.*'],
		ignore: [],
		watch: ['**/*.*', '**/_*.*']
	},
	css: {
		compile: ['**/*.scss', '**/*.css'],
		ignore: [],
		watch: ['**/*.scss', '**/*.css']
	},
	js: {
		compile: ['**/*.js', '**/*.json'],
		ignore: ['**/_*.js'],
		watch: ['**/*.js', '**/*.json', '**/_*.js']
	},
	html: {
		compile: ['**/*.pug'],
		ignore: ['**/_*.pug'],
		watch: ['**/*.pug', '**/_*.pug']
	}
}

// params:
// 		file_type: name of object in file_names, file_paths.src and file_paths.dist
// returns:
// 		src: an array of file locations for gulp tasks
// 		dist: a file location for completed tasks
// 		watch: an array of file locations for watch tasks
function get_file_paths(file_type){
	var src_path = file_paths.src[file_type];
	var modules_path = file_paths.src.modules;
	var dist_path = file_paths.dist[file_type];
	var names = file_names[file_type+''];

	function get_source(){
		var arr = [];
		names.compile.forEach(function(item){
			arr.push(src_path+item);
		});
		names.ignore.forEach(function(item){
			arr.push("!"+src_path+item);
		});
		return arr;
	}
	function get_watch(){
		var arr = [];
		names.watch.forEach(function(item){
			arr.push(src_path+item);
			arr.push(modules_path+item);
		});
		return arr;
	}


	return{
		src: get_source(),
		dist: dist_path,
		watch: get_watch()
	}
}

// asset tasks
gulp.task('build:assets', function(){
	var task_info = get_file_paths("assets");
	return gulp.src(task_info.src)
	.pipe(gulp.dest(task_info.dist));
});

// css tasks
gulp.task('build:css', function(){
	var task_info = get_file_paths("css");
	return gulp.src(task_info.src)
		.pipe(plumber({errorHandler: errorAlert}))
		.pipe(sass({
			outputStyle: 'compressed',
			noCache: true,
			includePaths: [
				"./node_modules",
				file_paths.src.modules
			]
		}))
		.pipe(replace("../img/", "%%"))
		.pipe(replace(".jpg", "%%"))
		.pipe(replace(".png", "%%"))
		.pipe(postcss(post_process))
		.pipe(replace("-webkit-box-align:center;", ""))
		.pipe(replace("-moz-box-align:center;", ""))
		.pipe(gulp.dest(task_info.dist))
		.pipe(live_reload());
});

// js tasks
gulp.task('build:js', function(){
	var task_info = get_file_paths("js");
	return gulp.src(task_info.src)
		.pipe(plumber({errorHandler: errorAlert}))
		.pipe(fileinclude({prefix: '@', basepath: file_paths.src.modules}))
		.pipe(fileinclude({prefix: '@vendor_', basepath: './node_modules/'}))
		.pipe(babel({
			presets: ['es2017'],
			plugins: ['syntax-dynamic-import']
		}))
		.pipe(gulp.dest(task_info.dist))
		.pipe(live_reload());
});

// html tasks
gulp.task('build:html', function(){
	var task_info = get_file_paths("html");
	return gulp.src(task_info.src)
		.pipe(plumber({errorHandler: errorAlert}))
		//.pipe(fileinclude({prefix: '@', basepath: file_paths.src.modules}))
		.pipe(pug({
			basedir: file_paths.src.modules
		}))
		.pipe(gulp.dest(task_info.dist))
		.pipe(live_reload());
});

// server tasks
gulp.task('serve', function() {
	gulp.src('dist')
	.pipe(web_server({
		livereload: true,
		open: true
	}));
});


// global functions
function errorAlert(error){
	notify.onError({title: 'Gulp Error', message: 'Check your terminal', sound: 'Sosumi'})(error);
	console.log(error.toString());
	this.emit('end');
};

live_reload({
	start: true
});

// global tasks
gulp.task('build', ['build:html','build:css','build:js','build:assets']);

gulp.task('default', ['build', 'serve'], function() {
	live_reload.listen();
	gulp.watch(get_file_paths("html").watch, [ 'build:html' ]);
	gulp.watch(get_file_paths("css").watch, [ 'build:css' ]);
	gulp.watch(get_file_paths("js").watch, [ 'build:js' ]);
	gulp.watch(get_file_paths("assets").watch, [ 'build:assets' ]);
});
