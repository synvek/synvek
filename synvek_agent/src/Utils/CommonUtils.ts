import delay from 'delay'
import ms from 'ms'
import Logger from './Logger.ts'
export class CommonUtils {
  /**
   * Sleep for some time. Example "1s" , "15s"
   * @param timeStr
   */
  public static async delay(timeStr: string) {
    await delay(ms(timeStr))
  }

  /**
   * Clear current line for output, it is useful to handle some progress tasks.
   * Ref: https://blog.csdn.net/qq_26657145/article/details/103583749
   * @param text
   * @param clearLine
   */
  public static logInfoSingleLine(text: string, clearLine: boolean) {
    const clearLines = `\x1b[1A\x1b[0J`
    if (clearLine) {
      //process.stdout.write(clearLines)
    }
    Logger.info(text)
  }

  /**
   * Clear current line for output, it is useful to handle some progress tasks.
   * @param text
   * @param clearLine
   */
  public static printSingleLine(text: string, clearLine: boolean) {
    const clearLines = `\x1b[1A\x1b[0J`
    if (clearLine) {
      process.stdout.write(clearLines)
    }
    console.log(text)
  }

  public static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}
