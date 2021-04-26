// 样式规则
interface StyleSheet {
  rules:Array<Rules>
}
interface Rules{
  selectors:Array<Selector>, // 选择器
  declarations:Array<Declaration<string|ColorValue>> // 描述
}

// 选择器（id、类、标签）
class Selector {
  Simple:SimpleSelector;
  constructor(Simple:SimpleSelector){
    this.Simple = Simple
  }
  // 权重
  specificity(Simple:SimpleSelector):Array<number>{
    let result:Array<number> = [0,0,0]
    result[0] = Simple.id.length
    result[1] = Simple.class.length
    result[2] = Simple.tag_name.length
    return result
  }
}


interface SimpleSelector{
  tag_name: Array<string>,
  id:Array<string>,
  class:Array<string>
}

// 属性值
interface Declaration<T>{
  name:string,
  value:T
}
interface ColorValue {
  r: number,
  g: number,
  b: number,
  a: number
}

// 匹配正确的标签
function valid_identifier_char(str:string):boolean{
    const regWord = /[A-Za-z0-9_-]/;
    if(str.match(regWord)){
      return true
    }
    return false
  }

export function parseCss(source:string):StyleSheet{
  const parser = new Parser(0,source);
  return {rules:parser.parse_rules()}
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
  // 匹配选择器或者标签
  parse_identifier(){
    return this.check_str(valid_identifier_char)
  }

  // 解析选择器
  parse_selectors():Array<Selector>{
    let selectors:Array<Selector> = []
    while (this.next_char()!='{'){
      
      this.check_str_empty()
      selectors.push(new Selector(this.parse_simple_selector()))
      this.check_str_empty()
      const nextStr = this.next_char()
      if (nextStr==','){
        this.next_char_skip()
        this.check_str_empty()
      }else if(nextStr=='{'){
        break
      }else{
        throw new Error('类型选择器编排格式错误')
      }
      this.check_str_empty()
    }
    return selectors
  }
  // 解析单个选择器
  parse_simple_selector():SimpleSelector{
    let selector:SimpleSelector = {
      tag_name:[],
      id:[],
      class:[]
    }
    // 当前不是最后
    while(!this.is_over()){
      const nextStr = this.next_char()
      if (nextStr === '#') {
        this.next_char_skip()
          selector.id.push(this.parse_identifier())
      }else if(nextStr === '.'){
        this.next_char_skip()
        selector.class.push(this.parse_identifier());
      }else if(nextStr === '*'){
        this.next_char_skip()
      }else if (valid_identifier_char(nextStr)){
        selector.tag_name.push(this.parse_identifier())
      }else{
        break
      }
    }
    return selector
  }

  // 解析描述组
  parse_declarations():Array<Declaration<string|ColorValue>>{
    this.check_str_empty()
    if (this.next_char_skip()==='{') {
      let declarationArr:Array<Declaration<string|ColorValue>> = []
      while(this.next_char()!=='}') {
        this.check_str_empty()
        declarationArr.push(this.parse_declaration());
        this.check_str_empty()
      }
      this.next_char_skip()
      return declarationArr
    }else{
      throw new Error('css语法错误')
    }
  }
  // 解析单个描述（css的键值对）
  parse_declaration():Declaration<string|ColorValue>{
    this.check_str_empty()
    let prototype_name = this.parse_identifier() // 获取属性名
    
    
    this.check_str_empty()
    // console.log(prototype_name,this.pos,this.next_char());
    const nextStr = this.next_char_skip()
    
    if (nextStr==':') {
      this.check_str_empty()
      let value = this.parse_value()
      this.check_str_empty()
      
      if (this.next_char_skip()==';') {
        return {
          name:prototype_name,
          value:value
        }
      }else{
        
        throw new Error('css属性没有;关闭')
      }
      
    }else{
      throw new Error('css属性语法错误')
    }
  }
  // 解析属性的值
  parse_value():string|ColorValue{
    const next_char = this.next_char()
    if (next_char.match(/[0-9]/)) {
      return this.parse_length()
    }else if (next_char=== '#'){
      return this.parse_color()
    }else{
      return this.parse_identifier()
    }
  }
  parse_length():string{
    const reg =/^[0-9.]*$/
    let s = this.check_str((str:string)=> reg.test(str))
    const px = this.parse_identifier().toLowerCase()
    if (px !== 'px') {
      throw new Error('css无px单位')
    }
    return s
  }
  parse_color():ColorValue{
    this.next_char_skip()
    return {
      r: this.parse_hex_pair(),
      g: this.parse_hex_pair(),
      b: this.parse_hex_pair(),
      a: 255 
    }
  }
  parse_hex_pair():number{
    let s = parseInt(`${this.next_char_skip()}${this.next_char_skip()}`,16)
    return s
  }

  // 解析全部选择器
  // 解析选择器规则
  parse_rule():Rules{
    return {
      selectors:this.parse_selectors(), // 选择器
      declarations:this.parse_declarations() // 属性值
    }
  }
  parse_rules():Array<Rules>{
    let rules:Array<Rules> = []
    while(!this.is_over()){
      this.check_str_empty()
      rules.push(this.parse_rule())
    }
    return rules
  }
}