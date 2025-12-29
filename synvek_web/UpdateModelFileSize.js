const fs = require('fs')
const path = require('path')

// Read repo_files.json
console.log('Reading repo_files.json...')
const repoFilesPath = path.join(__dirname, './../synvek_explorer/config/repo_files.json')
const repoFiles = JSON.parse(fs.readFileSync(repoFilesPath, 'utf-8'))

// Create Map for quick search
const repoSizeMap = new Map() // repo_source|repo_name -> total size
const fileSizeMap = new Map() // repo_source|repo_name|file_path -> file size

repoFiles.forEach((file) => {
  const repoKey = `${file.repo_source}|${file.repo_name}`
  const fileKey = `${file.repo_source}|${file.repo_name}|${file.file_path}`

  // subtotal repo size
  repoSizeMap.set(repoKey, (repoSizeMap.get(repoKey) || 0) + file.file_size)

  // store single file size
  fileSizeMap.set(fileKey, file.file_size)
})

console.log(`Read ${repoFiles.length} records`)
console.log(`Build ${repoSizeMap.size} repo indices`)
console.log(`Build ${fileSizeMap.size} file indices\n`)

// Read ModelProviders.ts
const modelProvidersPath = path.join(__dirname, 'src/components/Utils/src/ModelProviders.ts')
let content = fs.readFileSync(modelProvidersPath, 'utf-8')
const originalContent = content

// Format as GB with 2 points
function formatSizeToGB(bytes) {
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + 'GB'
}

// Calculate size
function calculateSize(modelSource, reposStr, filesStr) {
  let totalSize = 0

  // Parse repos
  const repoMatches = [...reposStr.matchAll(/repoName:\s*['"]([^'"]+)['"]/g)]
  for (const match of repoMatches) {
    const repoName = match[1]
    const repoKey = `${modelSource}|${repoName}`
    const size = repoSizeMap.get(repoKey) || 0
    totalSize += size
  }

  // Parse files
  const fileMatches = [...filesStr.matchAll(/repoName:\s*['"]([^'"]+)['"],\s*repoFile:\s*['"]([^'"]+)['"]/g)]
  for (const match of fileMatches) {
    const repoName = match[1]
    const repoFile = match[2]
    const fileKey = `${modelSource}|${repoName}|${repoFile}`
    const size = fileSizeMap.get(fileKey) || 0
    totalSize += size
  }

  return totalSize
}

let updatedCount = 0
let processedCount = 0
let currentModelSource = ''
let currentModelId = ''

// Scan each character and search each modelOption and calculate
let i = 0
while (i < content.length) {
  // Search modelSource
  const modelSourceMatch = content.substring(i).match(/modelSource:\s*['"]([^'"]+)['"]/)
  if (modelSourceMatch && modelSourceMatch.index === 0) {
    currentModelSource = modelSourceMatch[1]
    i += modelSourceMatch[0].length
    continue
  }

  // Search modelId
  const modelIdMatch = content.substring(i).match(/modelId:\s*['"]([^'"]+)['"]/)
  if (modelIdMatch && modelIdMatch.index === 0) {
    currentModelId = modelIdMatch[1]
    i += modelIdMatch[0].length
    continue
  }

  // Search name field（beginning of modelOption）
  const nameMatch = content.substring(i).match(/name:\s*['"]([^'"]+)['"]/)
  if (nameMatch && nameMatch.index < 50) {
    // Make sure it is nearby
    const optionName = nameMatch[1]
    const nameStart = i + nameMatch.index
    const nameEnd = nameStart + nameMatch[0].length

    // Search fileSize, repos, files from 'name'
    let searchPos = nameEnd
    let fileSize = null
    let fileSizeStart = -1
    let fileSizeEnd = -1
    let repos = null
    let files = null

    // Search following 4000 chars for fileSize, repos, files
    const searchRange = content.substring(searchPos, searchPos + 4000)

    const fileSizeMatch = searchRange.match(/fileSize:\s*['"]([^'"]+)['"]/)
    if (fileSizeMatch) {
      fileSize = fileSizeMatch[1]
      fileSizeStart = searchPos + fileSizeMatch.index
      fileSizeEnd = fileSizeStart + fileSizeMatch[0].length
    }

    const reposMatch = searchRange.match(/repos:\s*(\[[^\]]*\])/)
    if (reposMatch) {
      repos = reposMatch[1]
    }

    const filesMatch = searchRange.match(/files:\s*(\[[^\]]*\])/)
    if (filesMatch) {
      files = filesMatch[1]
    }

    // calculate and update if we find necessary info
    if (fileSize && repos && files && currentModelSource && fileSizeStart >= 0) {
      processedCount++

      const totalSize = calculateSize(currentModelSource, repos, files)
      const newFileSize = formatSizeToGB(totalSize)

      if (fileSize !== newFileSize) {
        console.log(`[${processedCount}] ${currentModelId} - ${optionName}`)
        console.log(`  ${fileSize} -> ${newFileSize}`)

        // Replace fileSize
        const before = content.substring(0, fileSizeStart)
        const after = content.substring(fileSizeEnd)
        const replacement = `fileSize: '${newFileSize}'`
        content = before + replacement + after

        // Update index
        const lengthDiff = replacement.length - (fileSizeEnd - fileSizeStart)
        i = fileSizeStart + replacement.length

        updatedCount++
        continue
      }
    }

    i = nameEnd
    continue
  }

  i++
}

console.log(`\nFinish ${processedCount} modelOptions`)
console.log(`Update ${updatedCount}  fileSize`)

// Write file
if (content !== originalContent) {
  fs.writeFileSync(modelProvidersPath, content, 'utf-8')
  console.log('\nModelProviders.ts is updated')
} else {
  console.log('\nNo updatable content')
}
