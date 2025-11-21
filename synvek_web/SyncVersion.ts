import fs from 'fs'
import path from 'path'
const JSON5 = require('json5')

// 1. Read package.json and retrieve version number
const rootPackageJsonPath = path.join(__dirname, '.', 'package.json')
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'))
const version = rootPackageJson.version

console.log(`Syncing version ${version} to all subprojects...`)

// 2. Sync to Synvek Explorer Cargo.toml
let cargoTomlPath = path.join(__dirname, '..', 'synvek_explorer', 'Cargo.toml')
let cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8')
cargoTomlContent = cargoTomlContent.replace(/(\[package\][\s\S]*?version\s*=\s*")[^"]*(")/, `$1${version}$2`)
fs.writeFileSync(cargoTomlPath, cargoTomlContent)
console.log('✓ Updated synvek_explorer/Cargo.toml')

// 3. Sync to Synvek Service Cargo.toml
cargoTomlPath = path.join(__dirname, '..', 'synvek_service', 'Cargo.toml')
cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8')
cargoTomlContent = cargoTomlContent.replace(/(\[package\][\s\S]*?version\s*=\s*")[^"]*(")/, `$1${version}$2`)

fs.writeFileSync(cargoTomlPath, cargoTomlContent)
console.log('✓ Updated synvek_service/Cargo.toml')

// 3. Sync to Synvek Explorer tauri.conf.json
const tauriConfPath = path.join(__dirname, '..', 'synvek_explorer', 'tauri.conf.json5')
const tauriConf = JSON5.parse(fs.readFileSync(tauriConfPath, 'utf8'))
tauriConf.version = version
fs.writeFileSync(tauriConfPath, JSON5.stringify(tauriConf, null, 2))
console.log('✓ Updated synvek_explorer/tauri.conf.json5')

// 4. Sync to Synvek Agent package.json
const webPackageJsonPath = path.join(__dirname, '..', 'synvek_agent', 'package.json')
if (fs.existsSync(webPackageJsonPath)) {
  const webPackageJson = JSON.parse(fs.readFileSync(webPackageJsonPath, 'utf8'))
  webPackageJson.version = version
  fs.writeFileSync(webPackageJsonPath, JSON.stringify(webPackageJson, null, 2))
  console.log('✓ Updated synvek_agent/package.json')
}

console.log('Version sync completed!')
