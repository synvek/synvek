export class Provider {
  private _providerId: string | undefined

  private _providerName: string

  private _ownerId: string | undefined

  private _description: string

  private _appId: string | undefined

  private _apiKey: string | undefined

  private _apiSecret: string | undefined

  private _apiVersion: string | undefined

  private _url: string | undefined

  private _orgId: string | undefined

  private _deploymentName: string | undefined

  private _modelVendor: string | undefined

  private _modelProduct: string | undefined

  private _modelTag: string | undefined

  private _modelType: string | undefined

  private _modelName: string | undefined

  private _modelContext: string | undefined

  private _maxTokens: string | undefined

  private _supportVision: string | undefined

  private _supportFunction: string | undefined

  private _temperature: string | undefined

  private _attributes: string | undefined

  public constructor(providerName: string, providerId: string | undefined = undefined, description: string = '') {
    this._providerName = providerName
    this._providerId = providerId
    this._description = description
    this._ownerId = undefined
  }

  public get providerId(): string | undefined {
    return this._providerId
  }

  public set providerId(value: string) {
    this._providerId = value
  }

  public get providerName(): string {
    return this._providerName
  }

  public set providerName(value: string) {
    this._providerName = value
  }

  public get description(): string {
    return this._description
  }

  public set description(value: string) {
    this._description = value
  }

  public get ownerId(): string | undefined {
    return this._ownerId
  }

  public set ownerId(value: string) {
    this._ownerId = value
  }

  public get appId() {
    return this._appId
  }

  public set appId(value: string | undefined) {
    this._appId = value
  }

  public get apiKey() {
    return this._apiKey
  }

  public set apiKey(value: string | undefined) {
    this._apiKey = value
  }

  public get apiSecret() {
    return this._apiSecret
  }

  public set apiSecret(value: string | undefined) {
    this._apiSecret = value
  }

  public get apiVersion() {
    return this._apiVersion
  }

  public set apiVersion(value: string | undefined) {
    this._apiVersion = value
  }

  public get orgId() {
    return this._orgId
  }

  public set orgId(value: string | undefined) {
    this._orgId = value
  }

  public get deploymentName() {
    return this._deploymentName
  }

  public set deploymentName(value: string | undefined) {
    this._deploymentName = value
  }

  public get modelName() {
    return this._modelName
  }

  public set modelName(value: string | undefined) {
    this._modelName = value
  }

  public get modelContext() {
    return this._modelContext
  }

  public set modelContext(value: string | undefined) {
    this._modelContext = value
  }

  public get maxTokens() {
    return this._maxTokens
  }

  public set maxTokens(value: string | undefined) {
    this._maxTokens = value
  }

  public get supportVision() {
    return this._supportVision
  }

  public set supportVision(value: string | undefined) {
    this._supportVision = value
  }

  public get supportFunction() {
    return this._supportFunction
  }

  public set supportFunction(value: string | undefined) {
    this._supportFunction = value
  }

  public get temperature() {
    return this._temperature
  }

  public set temperature(value: string | undefined) {
    this._temperature = value
  }

  public get attributes() {
    return this._attributes
  }

  public set attributes(value: string | undefined) {
    this._attributes = value
  }

  public get modelType() {
    return this._modelType
  }

  public set modelType(value: string | undefined) {
    this._modelType = value
  }

  public get modelVendor() {
    return this._modelVendor
  }

  public set modelVendor(value: string | undefined) {
    this._modelVendor = value
  }

  public get modelProduct() {
    return this._modelProduct
  }

  public set modelProduct(value: string | undefined) {
    this._modelProduct = value
  }

  public get modelTag() {
    return this._modelTag
  }

  public set modelTag(value: string | undefined) {
    this._modelTag = value
  }

  public get url() {
    return this._url
  }

  public set url(value: string | undefined) {
    this._url = value
  }
}
