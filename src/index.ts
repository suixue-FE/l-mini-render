import {parseHtml} from './html'
import {parseCss} from './css'
import {get_style_tree} from './style'
import {layout_tree,defaultDimensions} from './layout'
import {paint} from './painting'
import {writeFileSync} from 'fs'
const str = `<html>
<div class="outer">
  <p class="inner">
    Hello,world!
  </p>
  <p class="textTest">
    Text Test
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
.textTest{
  background: #008000;
  font-size:20px;
  color:#f0f00f;
}
.inner {
  border-color: #cc0000;
  border-width: 4px;
  height: 100px;
  margin: auto;
  margin-bottom: 20px;
  width: 500px;
  background: #0000ff;
  font-size:24px;
  color:#ffffff;
}`

export function render_main(htmlStr,cssStr):Buffer{
  const parsed_dom = parseHtml(htmlStr)
  const parsed_style_sheet = parseCss(cssStr)
  
  const pStyle = get_style_tree(parsed_dom,parsed_style_sheet)
  
  const viewport =  defaultDimensions()
  viewport.content.width  = 1000;
  viewport.content.height = 1000;
  const pLayout = layout_tree(pStyle,viewport)
  const viewport2 =  defaultDimensions()
  viewport2.content.width  = 1000;
  viewport2.content.height = 1000;
  const buffer = paint(pLayout,viewport2)
  // console.log(JSON.stringify(pLayout,null,4));
  return buffer
  
}



writeFileSync('./test.png', render_main(str,cssStr))
