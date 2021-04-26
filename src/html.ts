import * as dom from './dom'

export function parseHtml(html: string):dom.Node{
  // debugger
  let nodes = new Parser(0,html).parse_nodes()
  console.log(nodes);
  
  if(nodes.length==1){
    return nodes[0]
  }else{
    return dom.buildNode('html',{},nodes)
  }
}

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
  // 是否遍历到字符的最后一个
  is_over():boolean{
    return this.pos>=this.input.length
  }
  // 返回当前字符，并将this.pos+1。
  next_char_skip():string {
    let iter = this.input[this.pos]
    this.pos++
    return iter;
  }
  // 当前位置的开头
  starts_with_point(str:string):boolean {
    return this.input.startsWith(str,this.pos)
  }

  // 选中某种字符
  check_str(test:(str:string)=>boolean):string {
    let result:string = ''
    while (!this.is_over() && test(this.next_char())) {
        result=`${result}${this.next_char_skip()}`
      }
      return result
  }
  // 匹配空字符
  check_str_empty(){
    const reg = /\s/
    this.check_str((str)=>reg.test(str))
  }

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

  // 解析参数
  parse_attributes():dom.strHash{
    let obj = {}
    while(this.next_char()!='>'){
      this.check_str_empty()
      let [name, value] = this.parse_attrs()
      obj[name] = value
      // console.log(this.next_char());
    }
    return obj
  }
  // 解析参数-内部参数
  parse_attrs():Array<string>{
    let name = this.parse_tag_name();
    // console.log(name);
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

  // 解析一个节点
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
      let tag_name = this.parse_tag_name();
      let attrs = this.parse_attributes();
      if (this.next_char_skip()  == '>') {
        let children = this.parse_nodes();
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
  // 解析一组节点
  parse_nodes():Array<dom.Node>{
    let nodesArr = []
    while (!this.is_over()&&!this.starts_with_point("</")){
      this.check_str_empty()
      const value = this.parse_node()
      // console.log(value);
      nodesArr.push(value)
    }
    return nodesArr
  }
}