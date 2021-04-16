// 样式规则
interface StyleSheet {
  rules:Rules
}
interface Rules{
  selectors:Selector, // 选择器
  declarations:Declaration<string|ColorValue> // 描述
}

// 选择器（id、类、标签）
type Selector = {
  Simple:SimpleSelector,
}
interface SimpleSelector{
  tag_name: string,
  id:string,
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
  return {rules:parser.parse_value()}
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
    return this.input.startsWith("</",this.pos)
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
    this.check_str((str)=>str===' ')
  }


  // 解析单个选择器
  parse_simple_selector(){
    let selector:SimpleSelector = {
      tag_name:'',
      id:'',
      class:[]
    }
    // 当前不是最后
    while(!this.is_over()){
      const nextStr = this.next_char()
      if (nextStr == '#') {
        this.next_char_skip()
        selector.id = this.parse_identifier()
      }else if (nextStr =='.'){
        this.next_char_skip()
        selector.class.push(this.parse_identifier());
      }else if (nextStr =='*') {
        // 通用选择器
        this.next_char_skip()
      }else if (valid_identifier_char(nextStr)){
        selector.tag_name = this.parse_identifier()
      }else{
        throw new Error('css语法错误')
      }
    }
  }
  // 匹配选择器或者标签
  parse_identifier(){
    return this.check_str(valid_identifier_char)
  }
  
}