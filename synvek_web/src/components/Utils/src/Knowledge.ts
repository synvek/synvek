export class Knowledge {
  private _id: string | undefined
  private _name: string
  private _description: string

  public constructor(name: string, id: string | undefined = undefined, description: string = '') {
    this._name = name
    this._id = id
    this._description = description
  }

  public get id(): string | undefined {
    return this._id
  }

  public set id(value: string) {
    this._id = value
  }

  public get name(): string {
    return this._name
  }

  public set name(value: string) {
    this._name = value
  }

  public get description(): string {
    return this._description
  }

  public set description(value: string) {
    this._description = value
  }
}
