import {render_main} from './index'
import {writeFileSync,readFileSync} from 'fs'

let htmlStr = readFileSync('./example/perf-rainbow.html', "utf8");
let cssStr = readFileSync('./example/perf-rainbow.css', "utf8");
// console.log(htmlStr,cssStr);

writeFileSync('./example.png', render_main(htmlStr,cssStr))