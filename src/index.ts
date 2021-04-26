import {parseHtml} from './html'
import {parseCss} from './css'

const str = `<p class='colorRed'>请在输入框内贴入你需要转换的HTML代码</p>  
<p>HTML转换工具，可以将HTML代码转换为JavaScript字符串</p>  <p>直接将你所要用程序输出的大串HTML代码贴到输入框中，即可一键生成</p>  <p>如果您觉得好用，
别忘了推荐给朋友！</p>`
// console.log(html);

console.log(parseHtml(str));

const cssStr = `* {
  display: block;
}

span {
  display: inline;
}

html {
  width: 600px;
  padding: 10px;
  border-width: 1px;
  margin: auto;
  background: #ffffff;
}

head {
  display: none;
}

.outer {
  background: #00ccff;
  border-color: #666666;
  border-width: 2px;
  margin: 50px;
  padding: 50px;
}

.inner {
  border-color: #cc0000;
  border-width: 4px;
  height: 100px;
  margin-bottom: 20px;
  width: 500px;
}`
console.log(parseCss(cssStr));