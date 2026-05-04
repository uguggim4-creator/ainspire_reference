import fs from 'fs'
import path from 'path'
import { buildIndex } from './src/lib/data'

const OUTPUT_PATH = path.resolve('public/data.json')

const data = buildIndex()
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data), 'utf-8')

console.log(`index.json written: ${data.total} images`)
