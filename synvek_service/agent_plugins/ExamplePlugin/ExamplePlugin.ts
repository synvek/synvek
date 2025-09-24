const plugin = {
  async execute(data: any) {
    console.log('Executing math plugin with data:', data)
    if (data.operation === 'add') {
      return { result: data.a + data.b }
    } else if (data.operation === 'multiply') {
      return { result: data.a * data.b }
    } else if (data.operation === 'fibonacci') {
      return { result: this.fibonacci(data.n) }
    } else {
      throw new Error(`Unknown operation: ${data.operation}`)
    }
  },

  fibonacci(n: number): number {
    if (n <= 1) return n
    return this.fibonacci(n - 1) + this.fibonacci(n - 2)
  },
}
