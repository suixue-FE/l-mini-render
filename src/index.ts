import {parseHtml} from './html'
import {parseCss} from './css'
import {get_style_tree} from './style'
import {layout_tree,defaultDimensions} from './layout'
import {paint} from './painting'
import {writeFileSync} from 'fs'
const str = `<html>
<head>
  <title>Test</title>
</head>
<div class="outer">
  <p class="inner">
    Hello, <span id="name">world!</span>
  </p>
  <p class="inner" id="bye">
    Goodbye!
  </p>
</div>
</html>`

const cssStr = `* {
  display: block;
}

span {
  display: inline;
}

html {
  margin: auto;
  background: #ffffff;
}

head {
  display: none;
}

.outer {
  width:600px;
  background: #00ccff;
  border-color: #666666;
  border-width: 2px;
  margin: 50px;
}

.inner {
  border-color: #cc0000;
  border-width: 4px;
  height: 100px;
  margin: auto;
  margin-bottom: 20px;
  width: 500px;
  background: #0000ff;
}`

export function render_main(htmlStr,cssStr):Buffer{
  const pDom = parseHtml(htmlStr)
  const pCss = parseCss(cssStr)
  
  const pStyle = get_style_tree(pDom,pCss)
  
  const viewport =  defaultDimensions()
  viewport.content.width  = 1000;
  viewport.content.height = 1000;
  const pLayout = layout_tree(pStyle,viewport)
  const viewport2 =  defaultDimensions()
  viewport2.content.width  = 1000;
  viewport2.content.height = 1000;
  const buffer = paint(pLayout,viewport2)
  return buffer
}


writeFileSync('./test.png', render_main(str,cssStr))
// 


// console.log(111);
