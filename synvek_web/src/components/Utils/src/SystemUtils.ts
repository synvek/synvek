import moment from 'moment'

export enum OSType {
  MACOS,
  WINDOWS,
  IOS,
  ANDROID,
  LINUX,
  UNKNOWN,
}

export class SystemUtils {
  public static getOS() {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const macOS = /Mac OS/.test(userAgent)
    const windows = /win16|win8|win32|win64|x64|x32/.test(userAgent) || /wow64/.test(userAgent)
    const ios = /iPhone|iPad|iPod/.test(userAgent) && /OS [1-9]_/.test(userAgent)
    const android = /Android/.test(userAgent)
    const linux = /Linux/.test(platform)

    if (macOS) return OSType.MACOS
    if (windows) return OSType.WINDOWS
    if (ios) return OSType.IOS
    if (android) return OSType.ANDROID
    if (linux) return OSType.LINUX

    return OSType.UNKNOWN
  }

  public static extractDateFromServerCalendar(dateTime: number) {
    return moment(dateTime).format('YYYY-MM-DD')
  }

  public static extractTimeFromServerCalendar(dateTime: number) {
    return moment(dateTime).format('HH:mm')
  }

  public static extractDateTimeFromServerCalendar(dateTime: number) {
    return moment(dateTime).format('YYYY-MM-DD HH:mm')
  }

  public static convertDocumentData(documentData: any) {
    let content = documentData.data.data.content.content
    let data = JSON.parse(content)
    return data
  }

  public static handleInternalError(message: string) {
    alert(message)
    console.log(message)
  }

  public static generateUUID(): string {
    let d = new Date().getTime()
    if (window.performance && typeof window.performance.now === 'function') {
      d += performance.now()
    }
    let id = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0
      d = Math.floor(d / 16)
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return id
  }

  public static generateRandomInteger(min: number, max: number): number {
    const minValue = Math.ceil(min)
    const maxValue = Math.floor(max)
    return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
  }

  public static parseUrl(url: string) {
    const urlObj = {
      protocol: /^(.+):\/\//,
      host: /:\/\/(.+?)[?#\s/]/,
      path: /\w(\/.*?)[?#\s]/,
      query: /\?(.+?)[#/\s]/,
      hash: /#(\w+)\s$/,
    }
    const theUrl = url + ' '
    // eslint-disable-next-line guard-for-in
    for (const key in urlObj) {
      // @ts-ignore
      const pattern = urlObj[key]
      // @ts-ignore
      urlObj[key] = key === 'query' ? pattern.exec(theUrl) && SystemUtils.formatQuery(pattern.exec(theUrl)[1]) : pattern.exec(theUrl) && pattern.exec(theUrl)[1]
    }
    return urlObj
  }

  private static formatQuery(str: string) {
    return str.split('&').reduce((a, b) => {
      const arr = b.split('=')
      // @ts-ignore
      a[arr[0]] = arr[1]
      return a
    }, {})
  }

  public static formatFileSize(size: number) {
    let result = ''
    if (size > 1024 * 1024 * 1024) {
      result = Number(size / 1024 / 1024 / 1024).toFixed(2) + 'GB'
    } else if (size > 1024 * 1024) {
      result = Number(size / 1024 / 1024).toFixed(2) + 'MB'
    } else {
      result = Number(size / 1024).toFixed(2) + 'KB'
    }
    return result
  }

  /**
   * Convert base64 image to Blob for future use
   * @param base64Text
   */
  public static convertBase64StringToBlob(base64Text: string) {
    const attrs = base64Text.split(',')
    const matches = attrs[0].match(/:(.*?);/)
    if (matches) {
      const mime = matches[1]
      const blobStr = atob(attrs[1])
      let n = blobStr.length
      const u8Data = new Uint8Array(n)
      while (n--) {
        u8Data[n] = blobStr.charCodeAt(n)
      }
      return new Blob([u8Data], { type: mime })
    } else {
      return undefined
    }
  }

  public static async resizeImage(base64ImageData: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        // 创建Canvas并绘制缩略图
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Canvas context error')
        canvas.width = width
        canvas.height = height

        // 绘制并导出Base64缩略图
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8)) // 质量参数0.8
      }
      image.onerror = () => reject('Image load error')
      image.src = base64ImageData
    })
    // const image = document.createElement('img')
    // const canvas = document.createElement('canvas')
    // image.src = base64ImageData
    // canvas.width = width
    // canvas.height = height
    // await pica().resize(image, canvas, {})
    // return canvas.toDataURL('image/jpeg', 0.9)
  }

  /**
   * 将多行KEY=VALUE文本转换为对象
   * @param text 输入的文本
   * @param output
   * @returns valid
   */
  public static parseKeyValueText(text: string, output: { [key: string]: string }): boolean {
    const lines = text.split('\n').filter((line) => line.trim() !== '')
    let valid = true
    for (const line of lines) {
      const firstEqualsIndex = line.indexOf('=')
      if (firstEqualsIndex === -1) {
        valid = false
        continue
      }

      const key = line.substring(0, firstEqualsIndex).trim()
      const value = line.substring(firstEqualsIndex + 1).trim()

      if (key === '') {
        valid = false
        continue
      }

      output[key] = value
    }

    return valid
  }

  public static isStringKeyValueObject(obj: any): obj is { [key: string]: string } {
    // 检查解析结果是否为非null的对象（数组也不符合）
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return false
    }

    // 遍历对象的所有属性值
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // 如果任何一个属性的值不是字符串，则返回false
        if (typeof obj[key] !== 'string') {
          return false
        }
      }
    }
    return true
  }

  public static isJsonOfStringMap(str: string): boolean {
    let parsed
    try {
      parsed = JSON.parse(str)
    } catch (e) {
      return false
    }

    return this.isStringKeyValueObject(parsed)
  }

  public static isJsonOfStringArray(jsonString: string): boolean {
    let parsedValue
    try {
      parsedValue = JSON.parse(jsonString)
    } catch (e) {
      return false
    }

    if (!Array.isArray(parsedValue)) {
      return false
    }

    return parsedValue.every((item) => typeof item === 'string')
  }

  /**
   * User friendly format for time duration
   * @param milliseconds
   * @param showAll
   * @param maxUnits
   * @returns
   */
  public static formatDuration(milliseconds: number, showAll: boolean, maxUnits: number): string {
    const SECOND_MS = 1000
    const MINUTE_MS = 60 * SECOND_MS
    const HOUR_MS = 60 * MINUTE_MS
    const DAY_MS = 24 * HOUR_MS

    let remainingMs = Math.abs(milliseconds)
    const days = Math.floor(remainingMs / DAY_MS)
    remainingMs %= DAY_MS
    const hours = Math.floor(remainingMs / HOUR_MS)
    remainingMs %= HOUR_MS
    const minutes = Math.floor(remainingMs / MINUTE_MS)
    remainingMs %= MINUTE_MS
    const seconds = Math.floor(remainingMs / SECOND_MS)

    const parts = []
    if (days > 0 || showAll) parts.push(`${days}d`)
    if (hours > 0 || showAll) parts.push(`${hours}h`)
    if (minutes > 0 || showAll) parts.push(`${minutes}m`)
    if (seconds > 0 || showAll) parts.push(`${seconds}s`)

    const finalParts = maxUnits ? parts.slice(0, maxUnits) : parts

    if (finalParts.length === 0) {
      return `0s`
    }

    return finalParts.join('')
  }
}
