import { denoPlugins } from 'jsr:@luca/esbuild-deno-loader'
import * as esbuild from 'npm:esbuild'

const result = await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: './build/synvek_agent.cjs',
  format: 'cjs',
})

console.log(result)

esbuild.stop()
