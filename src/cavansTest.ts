import { createCanvas,CanvasRenderingContext2D,Canvas } from 'canvas'
import {writeFileSync} from 'fs'
// const canvas = createCanvas(200, 200)
// const ctx:CanvasRenderingContext2D = canvas.getContext('2d')
const width = 600
const height = 400
 
const canvas:Canvas = createCanvas(width, height)
const context:CanvasRenderingContext2D = canvas.getContext('2d')
context.fillStyle = '#000'
context.fillRect(0, 0, width, height)

const text = 'Hello, World!'
context.textBaseline = 'top'
context.fillStyle = '#3574d4'
const textWidth = context.measureText(text).width
context.fillRect(200 - textWidth / 2 - 10, 150 - 5, textWidth*2, 50)
context.fillStyle = '#fff'
context.fillText(text, 200, 150)

export function loadImg ():void{
  const buffer = canvas.toBuffer('image/png')
  writeFileSync('./test.png', buffer)
}
