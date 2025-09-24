import Axios from 'axios'
import fs from 'node:fs'
import * as stream from 'node:stream'
import { promisify } from 'node:util'
import Logger from './Logger.ts'

export class NetUtils {
  public static async writeDownloadFile(
    url: string,
    outputPath: string,
    method: 'get' | 'post' = 'get',
    headers: { [key: string]: any } = {},
    forceResume: boolean = false,
    onWriterDrain: ((url: string, contentLength: number | undefined, progress: number) => void) | null = null,
    onWriterError: ((url: string, error: Error) => void) | null = null,
    onWriterFinish: ((url: string, contentLength: number | undefined, progress: number, success: boolean) => void) | null = null,
    onWriterClose: ((url: string, contentLength: number | undefined, success: boolean) => void) | null = null,
    onError: ((url: string, error: Error | unknown) => void) | null = null,
  ) {
    let contentLength: number | undefined = undefined
    let fileCompleted = false
    let requireResume = false
    let downloadedBytes = 0
    try {
      Logger.debug(`Begin file check for ${url}`)
      const requestHeaders = headers ? { 'Accept-Encoding': 'identity', ...headers } : { 'Accept-Encoding': 'identity' }
      const responseHead = await Axios.head(url, { headers: requestHeaders })
      contentLength = responseHead.headers['content-length']
      Logger.debug(`File size of ${url} is ${contentLength}`)
      if (contentLength) {
        contentLength = Number.parseInt('' + contentLength)
        try {
          Logger.debug(`Check if file exists: ${outputPath}`)
          const stat = fs.statSync(outputPath, { throwIfNoEntry: false })
          if (stat) {
            Logger.debug(`File size check on ${outputPath} with size = ${stat.size}, file check is ${stat.isFile()}`)
          }
          if (stat && stat.isFile() && stat.size >= contentLength && !forceResume) {
            Logger.info(`File already exists on ${outputPath} with size = ${stat.size}. Downloading is ignored`)
            fileCompleted = true
          } else if (stat && stat.isFile() && stat.size >= contentLength && forceResume) {
            Logger.info(
              `File already exists on ${outputPath} with size = ${stat.size}, total size = ${contentLength}. but not marked as finished. Downloading will try to continue`,
            )
            downloadedBytes = stat.size
            requireResume = true
          } else if (stat && stat.isFile() && stat.size < contentLength && stat.size > 0) {
            Logger.info(`File already exists on ${outputPath} with size = ${stat.size}, total size = ${contentLength}. Downloading will try to continue`)
            downloadedBytes = stat.size
            requireResume = true
          }
        } catch (fError) {
          // Not found and ignore the error
          Logger.info(fError)
        }
      }
    } catch (error) {
      return false
    }

    if (!fileCompleted) {
      const finished = promisify(stream.finished)
      const requestHeaders = !requireResume ? headers : { range: `bytes=${downloadedBytes}`, ...headers }
      try {
        const responseStream = await Axios<stream>({
          method: method,
          url: url,
          responseType: 'stream',
          headers: requestHeaders,
        })
        const supportContinue = responseStream.status === 206
        contentLength = responseStream.headers['content-length']
        let fileCompleted = false
        if (contentLength) {
          contentLength = Number.parseInt('' + contentLength)
          try {
            const stat = fs.statSync(outputPath)
            if (stat.isFile() && stat.size >= contentLength) {
              fileCompleted = true
            }
          } catch (fError) {
            // Not found and ignore the error
          }
        }
        if (fileCompleted) {
          Logger.info(`${outputPath} already exists and ignore downloading.`)
        } else {
          let success = true
          let writer = fs
            .createWriteStream(outputPath, {
              flags: supportContinue ? 'a' : undefined,
            })
            .on('drain', () => {
              if (onWriterDrain) {
                try {
                  onWriterDrain(url, contentLength, writer.bytesWritten + downloadedBytes)
                } catch (error) {
                  Logger.error(`Exception happened on writerDrain: ${error}`)
                  success = false
                  writer.close()
                  return false
                }
              }
            })
            .on('finish', () => {
              if (onWriterFinish) {
                onWriterFinish(url, contentLength, writer.bytesWritten + downloadedBytes, success)
              }
            })
            .on('close', () => {
              if (onWriterClose) {
                onWriterClose(url, contentLength, success)
              }
            })
            .on('error', (error) => {
              if (onWriterError) {
                onWriterError(url, error)
              }
            })
          responseStream.data.pipe(writer)
          await finished(writer)
          return true
        }
      } catch (error) {
        if (onError) {
          onError(url, error)
        }
        return false
      }
    }
    return true
  }

  public static test() {
    const url = 'https://ratel.ivipa.com/basic-icons/Rectangle.svg'
    const outputDir = './output/Rectangle.svg'
    const onWriterDrain = (url: string, contentLength: number | undefined, currentProgress: number) => {
      Logger.info(`Downloading ${url} with progress ${currentProgress}/${contentLength}`)
    }
    const onWriterError = (url: string, error: Error) => {
      Logger.info(`current error is ${error}`)
    }
    const onWriterFinish = (url: string, contentLength: number | undefined) => {
      Logger.info(`Downloading is finished`)
    }
    const onWriterClose = (url: string, contentLength: number | undefined) => {
      Logger.info(`Downloading is closed`)
    }
    // const onFulfilled = (url: string) => {
    //     console.info(`Downloading is ready`)
    // }
    const onError = (url: string, error: Error | unknown) => {
      Logger.error(`Downloading failed: ${error}`)
    }
    NetUtils.writeDownloadFile(url, outputDir, 'get', {}, false, onWriterDrain, onWriterError, onWriterFinish, onWriterClose, onError)
  }
}
