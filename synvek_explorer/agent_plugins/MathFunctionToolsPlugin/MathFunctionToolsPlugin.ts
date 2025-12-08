const plugin = {
  tools: [
    {
      name: 'multiply',
      description: 'multiply two numbers',
      schema: [
        {
          name: 'a',
          type: 'number',
          description: 'the first number to multiply',
          optional: false,
          array: false,
        },
        {
          name: 'b',
          type: 'number',
          description: 'the second number to multiply',
          optional: false,
          array: false,
        },
      ],
      action: async ({ a, b }: { a: number; b: number }) => {
        console.log(`Function:multiply is called now.`)
        return a * b
      },
    },
    {
      name: 'add',
      description: 'add two numbers',
      schema: [
        {
          name: 'a',
          type: 'number',
          description: 'the first number to add',
          optional: false,
          array: false,
        },
        {
          name: 'b',
          type: 'number',
          description: 'the second number to add',
          optional: false,
          array: false,
        },
      ],
      action: async ({ a, b }: { a: number; b: number }) => {
        console.log(`Function:add is called now.`)
        return a + b
      },
    },
  ],

  async execute(data: { operation: string; a: number; b: number }): Promise<any> {
    console.log('Executing math function tools plugin with data:', data)

    if (data.operation === 'schema') {
      const schema = {
        toolSchemas: new Array<any>(),
      }
      this.tools.forEach((tool) => {
        schema.toolSchemas.push(tool)
      })
      return JSON.stringify(schema)
    } else if (data.operation === 'multiply') {
      return await this.tools[0].action({a: data.a, b: data.b})
    } else if (data.operation === 'add') {
      return await this.tools[0].action({a: data.a, b: data.b})
    } else {
      throw new Error(`Unknown operation: ${data.operation}`)
    }
  },
}
