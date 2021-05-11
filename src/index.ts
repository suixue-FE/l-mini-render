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
const pDom = parseHtml(str)

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
}`
const pCss = parseCss(cssStr)
// console.log(pDom,pCss);

const pStyle = get_style_tree(pDom,pCss)
// console.log(pStyle);

const viewport =  defaultDimensions()
viewport.content.width  = 1000;
viewport.content.height = 1000;
const pLayout = layout_tree(pStyle,viewport)
// console.log(viewport);
// console.log(JSON.stringify(pLayout, null, 2));
const viewport2 =  defaultDimensions()
viewport2.content.width  = 2000;
viewport2.content.height = 2000;
const buffer = paint(pLayout,viewport2)
// console.log(pLayout);

writeFileSync('./test.png', buffer)
// 


// console.log(111);
