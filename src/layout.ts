import {StyleNode,BoxType} from './style'

// 盒模型，margin_box、border_box、padding_box、content等均为Rect类，可以直接得到大小、位置信息。
export class Dimensions{
  // 相对于原点的位置,内容大小
  content:Rect
  // 盒模型 四个方向尺寸
  padding: EdgeSizes
  border: EdgeSizes
  margin: EdgeSizes 
  constructor(content:Rect,padding:EdgeSizes,border: EdgeSizes,margin: EdgeSizes){
    this.content = content
    this.padding = padding
    this.border = border
    this.margin = margin
  }
  padding_box():Rect{
    return this.content.expanded_by(this.padding)
  }
  border_box():Rect{
    return this.padding_box().expanded_by(this.border)
  }
  margin_box():Rect{
    return this.border_box().expanded_by(this.margin)
  }
}
// 大小和位置的信息集
export class Rect{
  x: number
  y: number
  width: number
  height: number
  constructor(x: number, y: number, width: number, height: number){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
  // 套壳子，比如，当前盒子是content盒子，传入padding，返回一个padding_box
  // 根据Dimensions中的使用就很好理解了
  expanded_by(edge: EdgeSizes):Rect {
    return new Rect(
      this.x - edge.left,
      this.y - edge.top,
      this.width + edge.left + edge.right,
      this.height + edge.top + edge.bottom,
    )
  }
}
interface EdgeSizes{
  left: number,
  right: number,
  top: number,
  bottom: number,
}
let defaultRect=():Rect => new Rect(0, 0, 0, 0)
const defaultEdgeSizes=():EdgeSizes=> {
  return {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
}
export function defaultDimensions():Dimensions{
  return new Dimensions(defaultRect(),defaultEdgeSizes(),defaultEdgeSizes(),defaultEdgeSizes())
}  
// 布局树的节点
export class LayoutBox{
  dimensions:Dimensions // 盒模型
  box_type:BoxType // 盒子类型
  children:Array<LayoutBox>
  style_node:StyleNode|null
  constructor(box_type:BoxType,children: Array<LayoutBox>,style_node:StyleNode,dimensions:Dimensions=defaultDimensions()){
    this.dimensions = dimensions
    this.box_type = box_type
    this.children = children
    switch(box_type){
      case BoxType.BlockNode:
      case BoxType.InlineBlockNode: 
      case BoxType.InlineNode:
      case BoxType.TextNode:
        this.style_node = style_node
      break
      case BoxType.NoneBlock:
      default:
        this.style_node = null
    }
  }
  // 布局
  layout(containing_block: Dimensions):void{
    switch(this.box_type){
      case BoxType.BlockNode:
      case BoxType.InlineBlockNode:
      case BoxType.TextNode: 
        this.layout_block(containing_block)
      break
      case BoxType.InlineNode:
        console.log('InlineNode');
      break
      case BoxType.NoneBlock:
        console.log('display:none');
      break
    }
  }
  // 块模式布局
  layout_block(containing_block: Dimensions):void {
    // console.log(containing_block);
    
    // 计算块宽度（宽度取决于父节点，所以先计算宽度在计算子节点）
    this.calculate_block_width(containing_block)
    // 计算块的位置
    this.calculate_block_position(containing_block);
    // 计算子节点（计算宽度后计算子节点）
    this.calculate_block_children()
    // 计算块高度（高度取决于子节点，所以先计算子节点之后才能处理高度）
    /// 第二轮，增加个文本节点的高度
    if (this.box_type === BoxType.TextNode) {
      // 文本节点的高度计算
      this.calculate_Text_hight()
    }else{
      this.calculate_block_hight()
    }
    
    
    // child.dimensions
    // console.log(this.dimensions);
    
  }
  // 计算宽度
  calculate_block_width(containing_block: Dimensions){
    
    if(this.style_node){
      let style = this.style_node

      let margin_left = style.lookup("margin-left", "margin", '0');
      let margin_right = style.lookup("margin-right", "margin", '0');

      let border_left = style.lookup("border-left-width", "border-width", '0');
      let border_right = style.lookup("border-right-width", "border-width", '0');

      let padding_left = style.lookup("padding-left", "padding", '0');
      let padding_right = style.lookup("padding-right", "padding", '0');

      let width = style.value("width") || 'auto'
      
      
      let total = add_px(
        margin_left as string,
        margin_right as string,
        border_left as string,
        border_right as string,
        padding_left as string,
        padding_right as string,
        width as string);
      // 如果宽度超了，而且margin设置的auto，那就给他默认值0
      if (width != 'auto' && total > containing_block.content.width) {
        if (margin_left == 'auto') {margin_left = '0'}
        if (margin_right == 'auto') {margin_right = '0'}
      }
      // 如果宽度小了，按照各种规则给他弄满，最终还是要占满（用margin补）
      let underflow = containing_block.content.width - total;
      const [width_auto,margin_r_auto,margin_l_auto] = 
      [width=='auto',margin_right=='auto',margin_left=='auto']
      if(width_auto){
        // 如果宽度是自适应
        if (margin_l_auto) margin_left = '0' 
        if (margin_r_auto) margin_right = '0'
        if (underflow >= 0) {
          // 那宽度直接等于需要补充的值
          width = `${underflow}`
        } else {
           //或者已经超出了，则margin_right变短（也就是右侧截掉）
            width = '0'
            margin_right = `${Number(margin_right)+underflow}`
        }
      }else{
        // 如果宽度固定
        if(margin_l_auto&&margin_r_auto){
          // 左右都自适应，各取一半
          margin_left = `${underflow/2}`
          margin_right = `${underflow/2}`
        }else{
          if(!margin_l_auto&&!margin_r_auto){
            // 左右都不自适应，margin_right自己去适应，还要计算上自己本身的值
            margin_right = `${Number(margin_right)+underflow}`
          }else if(margin_r_auto){
            // 右自适应
            margin_right =`${underflow}`
          }else{
            // 左自适应
            margin_left =`${underflow}`
          }
        }
      }
      // console.log(containing_block.content.width);
    
      // 盒模型开始赋值
      let di = this.dimensions;
      // console.log(di);
      
      di.content.width = Number(width)

      // console.log(di.content.width,this.style_node.node.node_type);
      di.padding.left = Number(padding_left)
      di.padding.right =  Number(padding_right)

      di.border.left = Number(border_left)
      di.border.right = Number(border_right)

      di.margin.left = Number(margin_left)
      di.margin.right = Number(margin_right)
      
    }
  }
  // 计算位置
  calculate_block_position(containing_block: Dimensions){
    let style = this.style_node
    if (style) {
      let d = this.dimensions;
      // 这里很有意思，上一个执行的子节点会将父节点height增加，所以当前的Y值直接
      // 可以取父节点的高度，父节点就是参数 containing_block
      // 如果是auto变为0
      const getNumber = (str:string):number=>{
        if (str == 'auto') {return 0}
        return Number(str)
      }
      d.margin.top = getNumber(style.lookup("margin-top", "margin", '0') as string)
      d.margin.bottom = getNumber(style.lookup("margin-bottom", "margin", '0') as string) 

      d.border.top = getNumber(style.lookup("border-top-width", "border-width", '0') as string)
      d.border.bottom = getNumber(style.lookup("border-bottom-width", "border-width", '0') as string)

      d.padding.top = getNumber(style.lookup("padding-top", "padding", '0') as string)
      d.padding.bottom = getNumber(style.lookup("padding-bottom", "padding", '0') as string)

      d.content.x = containing_block.content.x +
                    d.margin.left + d.border.left + d.padding.left;
      d.content.y = containing_block.content.height + containing_block.content.y +
                    d.margin.top + d.border.top + d.padding.top;
    }
  }
  // 计算子节点
  calculate_block_children(){
    // 直接把孩子递归，但是记得在递归过程中取高度出来
    const children = this.children,di=this.dimensions
    for (const child of children) {
      child.layout(di);
      di.content.height+=child.dimensions.margin_box().height;
    }
  }
  // 计算高度
  calculate_block_hight(){
    // 如果有明确的高度则使用明确高度，如果没有就直接使用已存在的（子节点布局时加的）
    if (this.style_node) {
      const cssHight = this.style_node.value('height')
      if (cssHight&&cssHight!=='auto') {
        this.dimensions.content.height = Number(cssHight);
      }
    }
  }

  calculate_Text_hight(){
    if (this.style_node&&this.style_node.value('font-size')) {
      this.dimensions.content.height = Number(this.style_node.value('font-size'));
    }else{
      this.dimensions.content.height = 12
    }
  }
  // 放一个子节点进去
  pushChild(child_node:StyleNode){
    // if(child_node.display()===)
    switch(child_node.display()){
      case BoxType.BlockNode:
      case BoxType.TextNode:
        this.children.push(build_layout_tree(child_node))
        break
      case BoxType.InlineNode:
      case BoxType.InlineBlockNode:
        this.inlineChild(child_node).children.push(build_layout_tree(child_node))
        break
      case BoxType.NoneBlock:
        break
    }
  }
  /**
   * 获取行内块
   * 如果当前父节点本身就是InlineNode，那就直接返回父节点
   * 如果当前父节点不是InlineNode，那看当前最后的子节点是不是InlineNode，如果是就直接用它，如果不是就新建一个来用
   * @returns 一个InlineNode类型的节点
   */
  inlineChild(node:StyleNode):LayoutBox{
    if(this.box_type === BoxType.InlineNode||this.box_type === BoxType.NoneBlock){
      return this
    }else{
      if(!this.children.length||this.children[this.children.length-1].box_type!==BoxType.InlineNode){
        this.children.push(new LayoutBox(BoxType.InlineNode,[],node))
      }
      return this.children[this.children.length-1]
    } 
  }
}


export function layout_tree(node:StyleNode, content_block:Dimensions):LayoutBox {
  // 保存初始块的高度，以计算百分比高度。
  content_block.content.height = 0.0;

  let layout_box:LayoutBox = build_layout_tree(node);
  layout_box.layout(content_block);
  return layout_box
}

function build_layout_tree(style_node:StyleNode):LayoutBox{
  let root = new LayoutBox(style_node.display(),[],
  // 这一步主要是将子节点置空（我个人认为后面占用内存小）
  new StyleNode(style_node.node,[],style_node.specified_values))
  style_node.children.forEach(child_node =>{
    root.pushChild(child_node)
  })
  return root
}
/**
 * 计算宽/高 的和，auto 暂时当做0
 * @param restNums 所有参数
 * @returns 所有参数的和
 */
function add_px(...restNums:string[]){ 
  return restNums.reduce((prev,next)=>{
    let nextNums:number 
    if(next=='auto'){
      nextNums = 0
    }else{
      nextNums = Number(next)
      if(Number.isNaN(nextNums)){
        throw new Error('布局过程中发现错误px类型')
      }
    } 
    return nextNums+prev
  },0)
}