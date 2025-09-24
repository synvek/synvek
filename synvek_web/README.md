# Ratel Web

[中文](README-CN.md), [English](README.md)

## About Ratel Web

Ratel is open source general diagram editor for flowchart, UML and other diagram tpyes. It can work online or offline(without network). Ratel Web is frontend of Ratel. There are 3 sub projects: Ratel-Web(frontend), Ratel-Server(backend) and Ratel-deployment(deployment).

Please visit: <https://ratel.ivipa.com>

Document: <https://iapoo.github.io/ratel-web/>

## Main Features

- Support basic shapes, flow chart, UML, Mockup, Pool, Code Textarea and so on.
- Support online or local environment. Most feature can work without internet.
- Support web browser or local desktop application work with Windows, Linux or MacOS
- Support export to PNG/JPG or SVG, support import PNG/JPG & SVG
- Support save diagram file to local environment or load from local environment, also support save & load online.
- Support code editor with syntax highlight as shape in diagram
- Support library feature, can add selected shapes as library or load image or svg as library (Require internet).
- Support share management, team management (Require internet)
- Support deploy to local environment(including desktop & backend server)

## Try

### Try online site

Please visit: <https://ratel.ivipa.com>.

### Try all-in-one docker image locally

docker run -d --name ratel -p 3306:3306 -p 6379:6379 -p 8000:8000 -p 8080:8080 -p 8081:8081 \
 -p 9000:9000 -p 9001:9001 -v ~/works/ratel/logs:/opt/logs -v ~/works/ratel/minio:/opt/minio/data \
 topoo/ratel-allinone:0.2.0

### Try all-in-one build with docker image

Pleae check Ratel-Deployment

## Build & Run locally

1. Install Node, require version 20.x. Other version may fail so far.
2. Build: npm run build
3. Run: npm run start

## Build with Electron for desktop installation

1. Run: npm run electron:build
2. Enter /app and Run: npm run electron:win for windows (or npm run electron:mac for MacOS)
