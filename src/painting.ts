// use layout::{AnonymousBlock, BlockNode, InlineNode, LayoutBox, Rect};
// use css::{Value, Color};
import {Rect,LayoutBox,Dimensions} from './layout'
import {ColorValue} from './css'
import {BoxType} from './style'
import { createCanvas,CanvasRenderingContext2D,Canvas } from 'canvas'

type DisplayList = Array<DisplayCommand>;

type DisplayCommand = PaintingDraw.drawRectangle | PaintingDraw.drawText
namespace PaintingDraw{
  export class drawRectangle{
    color?:ColorValue
    rect:Rect
    constructor(rect:Rect,color?:ColorValue){
      this.color = color
      this.rect = rect
    }
    drawItem(context:CanvasRenderingContext2D){
      
      context.fillStyle = this.color?parseFloat(this.color):'transparent'
      
      const rect = this.rect
      context.fillRect(rect.x, rect.y, rect.width, rect.height)
    }
  }
  export class drawText{
    color:ColorValue
    rect:Rect
    text:string
    constructor(text:string,rect:Rect,color:ColorValue={
      r:0,g:0,b:0,a:255
    }){
      this.color = color
      this.text = text
      this.rect = rect
    }
    drawItem(context:CanvasRenderingContext2D){
      context.fillStyle = this.color?parseFloat(this.color):'transparent'
      
      const rect = this.rect
      const fillStyle = this.color?parseFloat(this.color):'transparent'
      context.textBaseline = 'top'
      context.fillStyle = fillStyle
      
      context.font = `${rect.height}px Impact`
      context.fillText(this.text, rect.x, rect.y)
    }
  }
}
// 主函数，将绘制树变为图片
export function paint(layout_root:LayoutBox, bounds:Dimensions):Buffer{
  let display_list = build_display_list(layout_root); 
  
  const canvas:Canvas = createCanvas(bounds.content.width, bounds.content.height)

  const context:CanvasRenderingContext2D = canvas.getContext('2d')
  for (const drawClass of display_list) {
    drawClass.drawItem(context)
  }
  
  return canvas.toBuffer('image/png')
}
function build_display_list(layout_root: LayoutBox):DisplayList {
  let list:DisplayList = []
  build_layout(list, layout_root);
  return list;
}
function build_layout(list:DisplayList, layout_root:LayoutBox){
  // console.log(layout_root.box_type);
  
  if (layout_root.box_type===BoxType.TextNode) {
    build_layout_Text(list, layout_root)
  }else if(layout_root.box_type===BoxType.BlockNode){
    build_layout_box(list, layout_root)
  }
  for (const boxChild of layout_root.children) {
    build_layout(list,boxChild)
  }
}
function build_layout_box(list:DisplayList,layout_box:LayoutBox){
  render_background(list, layout_box);
  render_borders(list, layout_box);
}

// 把矩形渲染放进去
function render_background(list:DisplayList,layout_box:LayoutBox){
  const colorValue = get_color(layout_box,'background','background-color')
  
  list.push(new PaintingDraw.drawRectangle(layout_box.dimensions.border_box(),colorValue||undefined))
}
function get_color(layout_box:LayoutBox,name:string,otherName?:string){
  if (layout_box.style_node) {
    if (otherName){
      return layout_box.style_node.lookup(name,otherName,null) as ColorValue
    } 
    return layout_box.style_node.value(name) as ColorValue
  }
  return null
}
// 渲染边框，其实是渲染四个矩形
function render_borders(list:DisplayList,layout_box:LayoutBox){
  const borderColor = get_color(layout_box,'border-color')
  let d = layout_box.dimensions
  
  let border_box = d.border_box();
  // 上边框
  list.push(new PaintingDraw.drawRectangle(
    new Rect (border_box.x,border_box.y,border_box.width,d.border.top),
    borderColor||undefined))
  // 右边框
  list.push(new PaintingDraw.drawRectangle(
    new Rect (border_box.x+border_box.width,border_box.y,d.border.right,border_box.height),
    borderColor||undefined))
  // 下边框
  list.push(new PaintingDraw.drawRectangle(
    new Rect (border_box.x,border_box.y+border_box.height,border_box.width+d.border.right,d.border.bottom),
    borderColor||undefined))
  // 左边框
  list.push(new PaintingDraw.drawRectangle(
    new Rect (border_box.x,border_box.y,d.border.left,border_box.height),
    borderColor||undefined))
}
// 渲染文字
function build_layout_Text(list:DisplayList,layout_box:LayoutBox){
  const fontColor = get_color(layout_box,'color')
  list.push(new PaintingDraw.drawText(layout_box.style_node.node.node_type as string,
    layout_box.dimensions.border_box(),fontColor||undefined))
}
function parseFloat(color:ColorValue):string{
  return "#" +
  ("0" + color.r.toString(16)).slice(-2) +
  ("0" + color.g.toString(16)).slice(-2) +
  ("0" + color.b.toString(16)).slice(-2)
}
