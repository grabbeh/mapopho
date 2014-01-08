var gulp = require('gulp');  
var refresh = require('gulp-livereload');  
var lr = require('tiny-lr');  
var server = lr();

gulp.task('scripts', function() {  
    gulp.src(['public/javascript/**/*.js'])
        .pipe(refresh(server))
})

gulp.task('styles', function() {  
    gulp.src(['public/css/**/*.css'])
        .pipe(refresh(server))
})

gulp.task('html', function(){
    gulp.src(['public/partials/**/*.html'])
        .pipe(refresh(server))
})

gulp.task('controllers', function(){
    gulp.src(['public/controllers/**/*.js'])
        .pipe(refresh(server))
})

gulp.task('lr-server', function() {  
    server.listen(35729, function(err) {
        if(err) return console.log(err);
    });
})

gulp.task('default', function() {  
    gulp.run('lr-server', 'scripts', 'styles');

    gulp.watch('public/javascript/**', function(event) {
        gulp.run('scripts');
    })

    gulp.watch('public/css/**', function(event) {
        gulp.run('styles');
    })

    gulp.watch('public/partials/**', function(event){
        gulp.run('html')
    })

    gulp.watch('public/controllers/**', function(event){
        gulp.run('controllers')
    })
})