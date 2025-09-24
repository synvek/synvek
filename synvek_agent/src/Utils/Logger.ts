import pino from "pino"
import pretty from 'pino-pretty'

const Logger = pino(
    pretty({
        colorize: true,
        //ignore: 'pid,hostname',
        translateTime: true,
        levelFirst: true,
        minimumLevel: 'trace'
    })
)

export default Logger