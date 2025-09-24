const source = new EventSource('http://localhost:8082')
source.onmessage = (event: MessageEvent) => {
  let message = JSON.parse(event.data)
  console.log(message)
}
