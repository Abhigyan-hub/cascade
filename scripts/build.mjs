import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

const entry = path.join(root, 'index.html')
if (!fs.existsSync(entry)) {
  console.error('Vite entry missing:', entry)
  console.error('cwd:', process.cwd())
  console.error('root files:', fs.readdirSync(root).join(', '))
  process.exit(1)
}

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const child = spawn(process.execPath, [viteBin, 'build', '--config', path.join(root, 'vite.config.js')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => process.exit(code ?? 1))
