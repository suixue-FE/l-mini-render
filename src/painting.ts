// use layout::{AnonymousBlock, BlockNode, InlineNode, LayoutBox, Rect};
// use css::{Value, Color};
import {Rect,LayoutBox,Dimensions} from './layout'
import {ColorValue} from './css'
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
      // console.log(context);
      
      context.fillStyle = this.color?parseFloat(this.color):'transparent'
      // console.log(this.rect,3);
      
      const rect = this.rect
      context.fillRect(rect.x, rect.y, rect.width, rect.height)
    }
  }
  export class drawText{
    color:ColorValue
    rect:Rect
    text:string
    constructor(color:ColorValue,text:string,rect:Rect){
      this.color = color
      this.text = text
      this.rect = rect
    }
    drawItem(context:CanvasRenderingContext2D){
      // console.log(this.rect);
      // console.log(this.color);
    }
  }
}
// 主函数，将绘制树变为图片
export function paint(layout_root:LayoutBox, bounds:Dimensions):Buffer{
  let display_list = build_display_list(layout_root);
  
  const canvas:Canvas = createCanvas(bounds.content.width, bounds.content.height)
  // console.log(canvas);
  
  
  const context:CanvasRenderingContext2D = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, bounds.content.width, bounds.content.height)
  for (const drawClass of display_list) {
    drawClass.drawItem(context)
  }
  // console.log(context);
  
  return canvas.toBuffer('image/png')
}
function build_display_list(layout_root: LayoutBox):DisplayList {
  let list:DisplayList = []
  build_layout_box(list, layout_root);
  return list;
}
function build_layout_box(list:DisplayList,layout_box:LayoutBox){
  render_background(list, layout_box);
  render_borders(list, layout_box);
  for (const boxChild of layout_box.children) {
    build_layout_box(list,boxChild)
  }
}

// 把矩形渲染放进去
function render_background(list:DisplayList,layout_box:LayoutBox){
  const colorValue = get_color(layout_box,'background','background-color')
  // console.log(layout_box);
  
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
  // console.log(d,123);
  
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
    new Rect (border_box.x,border_box.y+border_box.height,border_box.width,d.border.bottom),
    borderColor||undefined))
  // 左边框
  list.push(new PaintingDraw.drawRectangle(
    new Rect (border_box.x,border_box.y,d.border.left,border_box.height),
    borderColor||undefined))
}
function parseFloat(color:ColorValue):string{
  return "#" +
  ("0" + color.r.toString(16)).slice(-2) +
  ("0" + color.g.toString(16)).slice(-2) +
  ("0" + color.b.toString(16)).slice(-2)
}
