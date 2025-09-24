import process from 'process'
import { IApi } from 'umi'

export default function (api: IApi) {
    api.onBuildComplete(({ stats }) => {
        api.logger.info('Buiuld succeed')
        //process.exit()
    })
}