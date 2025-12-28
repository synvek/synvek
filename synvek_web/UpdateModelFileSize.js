const fs = require('fs')
const path = require('path')

// 读取 repo_files.json
console.log('读取 repo_files.json...')
const repoFilesPath = path.join(__dirname, 'repo_files.json')
const repoFiles = JSON.parse(fs.readFileSync(repoFilesPath, 'utf-8'))

// 创建快速查找的 Map
const repoSizeMap = new Map() // repo_source|repo_name -> total size
const fileSizeMap = new Map() // repo_source|repo_name|file_path -> file size

repoFiles.forEach((file) => {
  const repoKey = `${file.repo_source}|${file.repo_name}`
  const fileKey = `${file.repo_source}|${file.repo_name}|${file.file_path}`

  // 累加 repo 总大小
  repoSizeMap.set(repoKey, (repoSizeMap.get(repoKey) || 0) + file.file_size)

  // 存储单个文件大小
  fileSizeMap.set(fileKey, file.file_size)
})

console.log(`已加载 ${repoFiles.length} 个文件记录`)
console.log(`已建立 ${repoSizeMap.size} 个仓库索引`)
console.log(`已建立 ${fileSizeMap.size} 个文件索引\n`)

// 读取 ModelProviders.ts
const modelProvidersPath = path.join(__dirname, 'src/components/Utils/src/ModelProviders.ts')
let content = fs.readFileSync(modelProvidersPath, 'utf-8')
const originalContent = content

// 格式化为 GB，保留2位小数
function formatSizeToGB(bytes) {
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + 'GB'
}

// 计算大小
function calculateSize(modelSource, reposStr, filesStr) {
  let totalSize = 0

  // 解析 repos
  const repoMatches = [...reposStr.matchAll(/repoName:\s*['"]([^'"]+)['"]/g)]
  for (const match of repoMatches) {
    const repoName = match[1]
    const repoKey = `${modelSource}|${repoName}`
    const size = repoSizeMap.get(repoKey) || 0
    totalSize += size
  }

  // 解析 files
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

// 逐字符扫描，找到每个 modelOption 并计算
let i = 0
while (i < content.length) {
  // 查找 modelSource
  const modelSourceMatch = content.substring(i).match(/modelSource:\s*['"]([^'"]+)['"]/)
  if (modelSourceMatch && modelSourceMatch.index === 0) {
    currentModelSource = modelSourceMatch[1]
    i += modelSourceMatch[0].length
    continue
  }

  // 查找 modelId
  const modelIdMatch = content.substring(i).match(/modelId:\s*['"]([^'"]+)['"]/)
  if (modelIdMatch && modelIdMatch.index === 0) {
    currentModelId = modelIdMatch[1]
    i += modelIdMatch[0].length
    continue
  }

  // 查找 name 字段（modelOption 的开始）
  const nameMatch = content.substring(i).match(/name:\s*['"]([^'"]+)['"]/)
  if (nameMatch && nameMatch.index < 50) {
    // 确保在附近
    const optionName = nameMatch[1]
    const nameStart = i + nameMatch.index
    const nameEnd = nameStart + nameMatch[0].length

    // 从 name 位置开始查找 fileSize, repos, files
    let searchPos = nameEnd
    let fileSize = null
    let fileSizeStart = -1
    let fileSizeEnd = -1
    let repos = null
    let files = null

    // 查找接下来的 500 个字符内的 fileSize, repos, files
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

    // 如果找到了所有必要信息，计算并更新
    if (fileSize && repos && files && currentModelSource && fileSizeStart >= 0) {
      processedCount++

      const totalSize = calculateSize(currentModelSource, repos, files)
      const newFileSize = formatSizeToGB(totalSize)

      if (fileSize !== newFileSize) {
        console.log(`[${processedCount}] ${currentModelId} - ${optionName}`)
        console.log(`  ${fileSize} -> ${newFileSize}`)

        // 替换 fileSize
        const before = content.substring(0, fileSizeStart)
        const after = content.substring(fileSizeEnd)
        const replacement = `fileSize: '${newFileSize}'`
        content = before + replacement + after

        // 调整索引
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

console.log(`\n处理了 ${processedCount} 个 modelOption`)
console.log(`更新了 ${updatedCount} 个 fileSize`)

// 写回文件
if (content !== originalContent) {
  fs.writeFileSync(modelProvidersPath, content, 'utf-8')
  console.log('\nModelProviders.ts 已成功更新！')
} else {
  console.log('\n没有需要更新的内容')
}
