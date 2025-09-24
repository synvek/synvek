import { Client } from 'ssh2'


export class SSHUtils {
    public static test() {
        const conn = new Client()
        conn.on('ready', () => {
            console.log('Client :: ready')
            conn.shell((err, stream) => {
                if (err) throw err
                stream.on('close', () => {
                    console.log('Stream :: close')
                    conn.end()
                }).on('data', (data: any) => {
                    console.log('OUTPUT: ' + data)
                })
                stream.end('ls -l\nexit\n')
            })
        }).connect({
            host: '47.83.3.253',
            port: 50022,
            username: 'ivipa',
            password: 'ivipa@2025!123',
        })
    }
}