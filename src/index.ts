import {parseHtml} from './html'
const str = "<p class='colorRed'>请在输入框内贴入你需要转换的HTML代码</p>  <p>HTML转换工具，可以将HTML代码转换为JavaScript字符串</p>  <p>直接将你所要用程序输出的大串HTML代码贴到输入框中，即可一键生成</p>  <p>如果您觉得好用，别忘了推荐给朋友！</p>"
// console.log(html);

console.log(parseHtml(str));
