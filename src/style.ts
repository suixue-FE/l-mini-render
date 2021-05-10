// 用css 和 dom 构建一个带样式的🌲
import * as dom from './dom'
import * as css from './css'
type myHash<T> = {
  [details: string]:T
}
export enum BoxType {
  BlockNode,
  NoneBlock,
  InlineBlockNode,
  InlineNode,
}

// 单个样式树节点
export class StyleNode{
  node:dom.Node
  children:Array<StyleNode>
  specified_values:myHash<string|css.ColorValue>
  constructor(node,children,specified_valu){
    this.node = node
    this.children = children
    this.specified_values = specified_valu
  }
  // 如果存在，就返回属性值
  value(name:string){
    return this.specified_values[name]
  }
  // 获取display属性
  display():BoxType{
    // return <string>this.value('display')
    switch(this.value('display')){
      case 'inline':
        return BoxType.InlineNode
      case 'inline-block':
        return BoxType.InlineBlockNode
      case 'none':
        return BoxType.NoneBlock
      default:
        return BoxType.BlockNode
    }
  }
  /**
   * 获取属性值，如果name找不到就找fallback_name，还没有就直接返回默认值value
   * @param name 
   * @param fallback_name 
   * @param value 
   */
  lookup(name:string, fallback_name:string,value:string|css.ColorValue){
    return this.value(name)||this.value(fallback_name)||value;
  }
}
interface ruleHight{
  declarations:Array<css.Declaration<string|css.ColorValue>>,
  selector_specificity_all:number
}

// 样式表
export function get_style_tree(root:dom.Node, stylesheet:css.StyleSheet):StyleNode {
  let style_values:myHash<string|css.ColorValue> = 
  typeof root.node_type !== 'string'?specified_values(root.node_type,stylesheet):
  {}
  let style_tree:StyleNode = new StyleNode(
    root,root.children.map(node => get_style_tree(node,stylesheet)),style_values)
  return style_tree
}

/**
 * 获取对应dom的style值
 * @param elem dom的参数
 * @param stylesheet 样式树
 * @returns 
 */
function specified_values(elem:dom.ElementData,stylesheet:css.StyleSheet):myHash<string|css.ColorValue>{
  let res = {}
  const rules = match_rules(elem,stylesheet)
  rules.sort((a,b)=>{
    return a.selector_specificity_all-b.selector_specificity_all
  })
  
  rules.forEach(ruleHight=>{
    ruleHight.declarations.forEach(declaration=>{
      res[declaration.name] = declaration.value
    })
  })
  
  return res
}
/**
 * 获取有对应class/tagname/id的规则组，并给权重
 * @param elem 
 * @param stylesheet 
 * @returns 
 */
function match_rules(elem:dom.ElementData,stylesheet:css.StyleSheet):Array<ruleHight>{
  return stylesheet.rules.map(rule =>{
    return {
      declarations:rule.declarations,
      selector_specificity_all:match_selector(rule.selectors,elem)
    }
  }).filter(ruleHight=>ruleHight.selector_specificity_all>0)
}
/**
 * 获取选择器组和节点匹配的权重
 * @param selector css选择器
 * @param element dom节点
 */
function match_selector(selectors:Array<css.Selector>,element:dom.ElementData):number{
  return selectors.reduce((prev,selector)=>{
    if(matches_simple_selector(selector.Simple,element)){
      return selector.specificity()+prev
    }
  },0)
}

function matches_simple_selector(simple:css.SimpleSelector,element:dom.ElementData):boolean{
  const tag_name_has:boolean = simple.tag_name.includes(element.tag_name)
  const id_arr:boolean = simple.id.includes(element.idGet())
  const class_arr:boolean = simple.class.some(cl=>{
    return element.classGet().includes(cl)
  })
  return tag_name_has||id_arr||class_arr
}