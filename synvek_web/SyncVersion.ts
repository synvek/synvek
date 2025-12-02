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

// 4. Sync to Synvek Explorer tauri.conf.json
const tauriConfPath = path.join(__dirname, '..', 'synvek_explorer', 'tauri.conf.json5')
const tauriConf = JSON5.parse(fs.readFileSync(tauriConfPath, 'utf8'))
tauriConf.version = version
fs.writeFileSync(tauriConfPath, JSON5.stringify(tauriConf, null, 2))
console.log('✓ Updated synvek_explorer/tauri.conf.json5')

// 5. Sync to Synvek Agent package.json
const webPackageJsonPath = path.join(__dirname, '..', 'synvek_agent', 'package.json')
if (fs.existsSync(webPackageJsonPath)) {
  const webPackageJson = JSON.parse(fs.readFileSync(webPackageJsonPath, 'utf8'))
  webPackageJson.version = version
  fs.writeFileSync(webPackageJsonPath, JSON.stringify(webPackageJson, null, 2))
  console.log('✓ Updated synvek_agent/package.json')
}

// 6. Syn to version.txt of Synvek Service config dir
const versionPath = path.join(__dirname, '..', 'synvek_service', 'config', 'version.txt')
fs.writeFileSync(versionPath, version)
console.log('✓ Updated synvek_service/config/version.txt')

// 7. Sync to Synvek docs package.json
const docsJsonPath = path.join(__dirname, '..', 'docs', 'package.json')
if (fs.existsSync(docsJsonPath)) {
  const docPackageJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'))
  docPackageJson.version = version
  fs.writeFileSync(docsJsonPath, JSON.stringify(docPackageJson, null, 2))
  console.log('✓ Updated docs/package.json')
}

// 6. Syn to version.txt of Synvek Docs config dir
const docsVersionPath = path.join(__dirname, '..', 'docs', 'version.txt')
fs.writeFileSync(docsVersionPath, version)
console.log('✓ Updated docs/version.txt')

console.log('Version sync completed!')
