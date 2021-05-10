import {parseHtml} from './html'
import {parseCss} from './css'
import {get_style_tree} from './style'
import {layout_tree,defaultDimensions} from './layout'

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
const pCss = parseCss(cssStr)
console.log(pDom,pCss);

const pStyle = get_style_tree(pDom,pCss)
console.log(pStyle);

const viewport =  defaultDimensions()
viewport.content.width  = 800.0;
viewport.content.height = 600.0;
const pLayout = layout_tree(pStyle,viewport)
console.log(pLayout);

