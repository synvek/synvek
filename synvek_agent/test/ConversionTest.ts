import { assertEquals, assertGreater } from 'https://deno.land/std/testing/asserts.ts'
import { ConversionService } from '../src/ConversionService.ts'

Deno.test('Test add conversion', () => {
  ConversionService.deleteAllConversions()
  let conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 1)
})

Deno.test('Test get conversion with valid data', () => {
  ConversionService.deleteAllConversions()
  const conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  const returnConversion = ConversionService.getConversion(conversionId)
  assertEquals(returnConversion !== null, true)
})

Deno.test('Test get conversion with invalid data', () => {
  ConversionService.deleteAllConversions()
  const conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  const returnConversion = ConversionService.getConversion(conversionId + 1)
  assertEquals(returnConversion === null, true)
})

Deno.test('Test update conversion', () => {
  ConversionService.deleteAllConversions()
  const conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  ConversionService.updateConversion(conversionId, 'updatedTestConversionName', null)
  const returnConversion = ConversionService.getConversion(conversionId)
  assertEquals(returnConversion !== null, true)
  assertEquals(returnConversion!.conversionName, 'updatedTestConversionName')
})
