//  定义一个全局的stringHash类型
export type strHash = {
  [details: string]:string
}

// node节点的属性字典
export type AttrMap = strHash

// 定义一个node节点的类（格式）
export interface Node {
  children:Array<Node>,
  node_type:NodeType
}

// nodeType 简写可以是字符串，也可以是复杂的ElementData类型
/// type声明可以这样写（搜索type和interface的区别可看到）
export type NodeType = ElementData | string

// 声明一个类，主要是有两个需要挂在原型上的方法，所以用类
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
    return this.attributes["class"]??[]
  }
}

// 这是构建node的函数
export function buildNode(name: string, attrs?: AttrMap,children?:Array<Node>):Node {
  let nodeObj:Node = {
    children:[],
    node_type:''
  }
  if(attrs){
    nodeObj.node_type = new ElementData(name,attrs)
  }else{
    nodeObj.node_type = name
  }
  nodeObj.children = children??[]
  return nodeObj
}