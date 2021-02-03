const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')
const browserSync = require('browser-sync')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const bs = browserSync.create()
const cwd = process.cwd()  //返回当前命令行所在的工作目录
let config={
  //default config
  //抽象src这种目录结构,使之能够灵活去配置
  build:{
    src:'src',
    dist:'dist',
    temp:'temp',
    public:'public',
    paths:{
      styles:'assets/styles/*.scss',
      scripts:'assets/scripts/*.js',
      pages:'*.html',
      image:'assets/images/**',
      fonts:'assets/fonts/**'
    }
  }
}
try{
  const loadConfig=require(`${cwd}/pages.config.js`)
  config=Object.assign({},config,loadConfig)
}catch(e){

}
const clean = () => {
  return del([config.build.dist, config.build.temp])
}
//更改路径
const style = () => {
  //添加cwd表示当前目录(src)下面的目录
  return src(config.build.paths.styles, { base: config.build.src,cwd:config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src,cwd:config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] })) //替换成require,如果当前目录没有,会去上级目录查找
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src,cwd:config.build.src })
    .pipe(plugins.swig({data: config.data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.image, { base: config.build.src,cwd:config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src,cwd:config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public,cwd:config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles,{cwd:config.build.src}, style)
  watch(config.build.paths.scripts,{cwd:config.build.src},script)
  watch(config.build.paths.pages,{cwd:config.build.src},page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    config.build.paths.image,
    config.build.paths.fonts
  ],{cwd:config.build.src}, bs.reload)
 watch('**',{cwd:config.build.public}, bs.reload)
  bs.init({
    notify: false,
    port: 2080,
    // open: false,
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {

  return src(config.build.paths.pages, { base: config.build.temp,cwd:config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build =  series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}
