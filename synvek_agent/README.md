# Build for Deno

## Setup 

deno install --allow-scripts=npm:ssh2@1.16.0,npm:cpu-features@0.0.10

## Build for Tauri 
deno run --unstable-sloppy-imports --unstable-worker-options  --allow-run --allow-env --allow-sys --allow-net --allow-read --allow-write ./src/Build.ts


