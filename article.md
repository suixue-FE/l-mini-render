# 用TS实现一个简单渲染引擎
## 简介
### 原因
1. 作为前端开发，长期与浏览器打交道，需要或者说想要了解部分浏览器的内部流程，但是功能齐全的浏览器又十分复杂，所以想通过实现个玩具来了解流程。
2. 我想练下TS。。。
### 浏览器流程
想要实现一个渲染引擎，需要先确认渲染引擎是浏览器的哪一部分，具体是做什么的，有什么功能。
先来看一下Chrome浏览器：
- Browser Process：
  - 负责包括地址栏，书签栏，前进后退按钮等部分的工作；
  - 负责处理浏览器的一些不可见的底层操作，比如网络请求和文件访问；
- Renderer Process：
  - 负责一个 tab 内关于网页呈现的所有事情
- Plugin Process：
  - 负责控制一个网页用到的所有插件，如 flash
- GPU Process
  - 负责处理 GPU 相关的任务


很明显渲染引擎部分肯定是存在于Renderer Process下了，那我们来看一下渲染进程的构成：

而我们要实现的“渲染”引擎，仅仅是渲染进程中的GUI渲染线程这一小部分。

### 主流程
这里是一张网上流传很久的图，就按照他来做。

来源（可能需要合理上网）：https://www.html5rocks.com/zh/tutorials/internals/howbrowserswork/

## 实现
下面我们就按照上图一步一步的来做，因为掺杂代码且篇幅较长，大家可以选择感兴趣的章节查看。

[标签树（HTML Parser）](#2.1)

[样式（CSS Parser）](#2.2)

[渲染树（attchment）](#2.3)

[布局计算（Layout）](#2.4)

[渲染（Painting）](#2.5)

<h3 id="2.1">标签树（HTML Parser）</h3>
这里我们主要是要解析HTML构建一个DOM树，也就是输入一个字符串，输出个树。

我们首先来定一下DOM树的数据格式，然后实现一个解析器（不确定我实现的算不算接解析器）

#### 简易DOM
当在浏览器里console.dir(document)的时候，可以看到详细的DOM对象的属性，很多，肯定写不完…… 还是写个简单的吧。
首先，树就是节点带个子节点数组：
```typescript
export interface Node {
  children:Array<Node>,
  node_type:NodeType
}
// 构建node
export function buildNode(name: string, attrs?: AttrMap,children?:Array<Node>):Node {
  // 因篇幅省略
}
```
详细解释一下上面的类型

这个NodeType暂时只实现了文本节点和普通节点，而且为了方便文本节点没有设置任何属性（后续样式直接继承了父节点）。

而通用节点也是使用了最简单的描述方式： 标签名、标签属性。
```ts
//  定义一个全局的stringHash类型
export type strHash = {
  [details: string]:string
}
// 这里NodeType有两种类型，一直不知道TS这样使用对不对，有更好的使用方式还请大佬评论提点
export type NodeType = ElementData | string
// node节点的属性字典
export type AttrMap = strHash
export class ElementData {
  tag_name: string;
  attributes: AttrMap;
  constructor(tag_name: string, attributes: AttrMap){
    this.tag_name = tag_name
    this.attributes = attributes
  }
  idGet():string{
    return this.attributes['id']
  }
  classGet(){
    return this.attributes?.["class"]?.split(' ')||[]
  }
}
```
#### 解析HTML
HTML的解析器其实十分复杂，因为他有大量的错误语法兼容。市面上也有很多成熟的实现：[gumbo-parser](https://github.com/google/gumbo-parser)、[Beautiful Soup](https://zh.wikipedia.org/wiki/Beautiful_Soup) 等等，而我只准备实现其中最基础的标签、属性、文字。
入口方法：
```ts
parseHtml(html: string):dom.Node{
  let nodes = new Parser(0,html).parse_nodes()
  if(nodes.length==1){
    return nodes[0]
  }else{
    return dom.buildNode('html',{},nodes)
  }
}
```
我使用指针扫描字符串,下面是指针和最基础的几个扫描函数。
```ts
class Parser{
    pos: number;
    input: string;
    constructor(pos: number, input: string){
      this.pos = pos
      this.input = input
    }
    // 下一字符
    next_char():string{
      return this.input[this.pos]
    }
    // 返回当前字符，并将this.pos+1。
    next_char_skip():string {
      let iter = this.input[this.pos]
      this.pos++
      return iter;
    }
    // 是否遍历到字符的最后一个
    is_over():boolean{
      return this.pos>=this.input.length
    }
    // 当前位置的开头
    starts_with_point(str:string):boolean {
      return this.input.startsWith(str,this.pos)
    }
    /**
     * 此函数是解析类的核心方法，根据传入的匹配函数来连续匹配符合某种规则的字符
     * 既能获取符合规则的字符串，又能跳过指定字符串，后续解析大多基于此方法。
     * @param test 匹配字符函数
     * @returns 符合规则的连续字符
     */
    check_str(test:(str:string)=>boolean):string {
      let result:string = ''
      while (!this.is_over() && test(this.next_char())) {
          result=`${result}${this.next_char_skip()}`
        }
      return result
    }
    /// ……其余详细函数
  }
```
有了基础方法，后面就是利用基础方法匹配语法。注：本小节下方所有函数均为Parser类中的函数

先来个简单的，跳过空格/回车等无用字符：
```ts
  check_str_empty(){
    const reg = /\s/
    this.check_str((str)=>reg.test(str))
  }
```
标签、属性名都是连续的字母/数字字符串，所以：
```ts
  // 解析 标签 或者 属性名 (就是匹配一串字母、数字的字符串)
  parse_tag_name():string {
    return this.check_str((str)=>{
      const regWord = /[A-Za-z0-9]/;
      if(str.match(regWord)){
        return true
      }
      return false
    })
  }
```
然后，终于到正式解析节点的部分了：
```ts
  // 解析一个节点
  // 如果是"<"就解析Dom，否则就当文本节点解析
  parse_node():dom.Node{
    if (this.next_char()=="<") {
      return this.parse_ele_node()
    }else{
      return this.parse_text_node()
    }
  }
  // 解析一个文本节点
  parse_text_node():dom.Node{
    const textNode = this.check_str(str=>str!='<')
    return dom.buildNode(textNode)
  }
  // 解析一个dom节点
  parse_ele_node():dom.Node{
    if (this.next_char_skip() == '<') {
      // 初始标签，< 之后就是标签名，直接调用解析标签名方法
      let tag_name = this.parse_tag_name();
      // HTML是在标签名后面直接写属性，所以解析完标签名之后，解析属性
      let attrs = this.parse_attributes();
      // 解析完属性如果是闭合标识那就继续
      if (this.next_char_skip()  == '>') {
        // 标签的开始部分就完成了，这时候进入标签内部了，内部就是子节点，见下方
        let children = this.parse_nodes();
        // 下面这部分是判断结束标签的语法和是否与开始标签相同
        if (this.next_char_skip() == '<'&&
        this.next_char_skip() == '/'&&
        this.parse_tag_name() == tag_name&&
        this.next_char_skip() == '>'
        ){
          return dom.buildNode(tag_name,attrs,children)
        }else{
          throw new Error('HTML模板错误，结束标签错误')
        }
      }else{
        throw new Error('HTML模板错误，不以’>‘结束')
      }
    }else{
      throw new Error('HTML模板错误，不以’<‘开始')
    }
  }
  // 解析一组节点 就是一直匹配到结束
  parse_nodes():Array<dom.Node>{
    // 函数在parse_ele_node中调用，而函数内又调用了parse_node，形成递归
    let nodesArr = []
    while(1){
      this.check_str_empty();
      if (this.is_over() || this.starts_with_point("</")) {
          break;
      }
      nodesArr.push(this.parse_node());
    }
    return nodesArr
  }
```
看到这里，解析一个dom节点的流程就基本清晰了，耐心点，我们再看看流程中的参数解析的过程：
```ts
// 解析参数主要就是匹配到“=”，等号左侧为属性名，右侧为属性值，直到发现“>”为止
// 流程中掺杂部分错误处理，仅此而已
  parse_attributes():dom.strHash{
    let obj = {}
    while(this.next_char()!='>'){
      this.check_str_empty()
      let [name, value] = this.parse_attrs()
      obj[name] = value
    }
    return obj
  }
  // 解析参数-内部参数
  parse_attrs():Array<string>{
    let name = this.parse_tag_name();  
    if (this.next_char_skip()!="=") {
      throw new Error("标签内属性设置无‘=’")
    }
    let value = this.parse_attr_value();
    return [name, value]
  }
  // 解析参数-内部参数值
  parse_attr_value():string{
    let open_quote = this.next_char_skip();
    if (open_quote != '"'&&open_quote != '\'') {
      throw new Error('标签属性格式错误')
    }
    let value = this.check_str(c=> c != open_quote);
    if (open_quote != this.next_char_skip()) {
      throw new Error('标签属性格式错误')
    }
    return value 
  }
```
至此，我们的HTML解析就结束了
```ts
  import {parseHtml} from './html'
  const pDom = parseHtml(htmlStr)
```
此时这个pDom就是一个我们最初定义的DOM树，至此我们的[HTML解析](https://github.com/lisansang/l-mini-render/blob/main/src/html.ts)工作就完成了。

<h3 id="2.2">样式（CSS Parser）</h3>


<h3 id="2.3">渲染树（attchment）</h3>

<h3 id="2.4">布局计算（Layout）</h3>

<h3 id="2.5">渲染（Painting）</h3>