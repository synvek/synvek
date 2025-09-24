# About


# TODO List

# Build

cargo build --features "cuda cudnn"

run --package synvek_service --features "cuda cudnn" --bin synvek_service -- start --port 1234 --isq 4 -m C:/source/works/huan/engine/models/Qwen/Qwen3-0.6B plain

run --package synvek_service --features "cuda cudnn" --bin synvek_service -- run hello.ts

run --package synvek_service --features "cuda cudnn" --bin synvek_service -- serve

run --package synvek_service --features "cuda cudnn" --bin synvek_service -- exec --worker-id abc --worker-name demo

run --package synvek_service --bin synvek_service -- serve