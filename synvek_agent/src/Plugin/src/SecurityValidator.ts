import { PluginMetadata } from './PluginTypes.ts'

export class SecurityValidator {
  private allowedPermissions = ['net', 'read', 'write', 'env', 'run']

  validateMetadata(metadata: PluginMetadata): boolean {
    if (!metadata.name || !metadata.version || !metadata.entry) {
      return false
    }

    if (!this.isValidVersion(metadata.version)) {
      return false
    }

    // 验证入口路径安全性
    if (!this.isSafePath(metadata.entry)) {
      return false
    }

    // 验证权限
    if (metadata.permissions) {
      for (const permission of metadata.permissions) {
        if (!this.allowedPermissions.includes(permission)) {
          return false
        }
      }
    }

    return true
  }

  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version)
  }

  private isSafePath(path: string): boolean {
    // 防止路径遍历攻击
    const unsafePatterns = [
      /\.\.\//g,
      /^\//g,
      /^[a-zA-Z]:\\/g, // Windows 绝对路径
    ]

    for (const pattern of unsafePatterns) {
      if (pattern.test(path)) {
        return false
      }
    }

    return true
  }
}
