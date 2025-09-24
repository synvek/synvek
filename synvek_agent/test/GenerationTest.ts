import { assertEquals, assertGreater } from 'https://deno.land/std/testing/asserts.ts'
import { Constants } from '../src/Constants.ts'
import { GenerationService } from '../src/GenerationService.ts'

Deno.test('Test add generation', () => {
  GenerationService.deleteAllGenerations()
  let generations = GenerationService.getGenerations(Constants.GENERATION_TYPE_IMAGE, true)
  assertEquals(generations.length, 0)
  const generationId = GenerationService.addGeneration(
    Constants.GENERATION_TYPE_IMAGE,
    'hello',
    '{}',
    'hello',
    'hello content',
    'hello content',
    0,
    'model',
    null,
    null,
    null,
    null,
    null,
  )
  assertGreater(generationId, 0)
  generations = GenerationService.getGenerations(Constants.GENERATION_TYPE_IMAGE, true)
  assertEquals(generations.length, 1)
})

Deno.test('Test get generation with valid data', () => {
  GenerationService.deleteAllGenerations()
  const generations = GenerationService.getGenerations(Constants.GENERATION_TYPE_IMAGE, true)
  assertEquals(generations.length, 0)
  const generationId = GenerationService.addGeneration(
    Constants.GENERATION_TYPE_IMAGE,
    'hello',
    '{}',
    'hello',
    'hello content',
    'hello content',
    0,
    'model',
    null,
    null,
    null,
    null,
    null,
  )
  assertGreater(generationId, 0)
  const returnGeneration = GenerationService.getGeneration(generationId, true)
  assertEquals(returnGeneration !== null, true)
})

Deno.test('Test get generation with invalid data', () => {
  GenerationService.deleteAllGenerations()
  const generations = GenerationService.getGenerations(Constants.GENERATION_TYPE_IMAGE, true)
  assertEquals(generations.length, 0)
  const generationId = GenerationService.addGeneration(
    Constants.GENERATION_TYPE_IMAGE,
    'hello',
    '{}',
    'hello',
    'hello content',
    'hello content',
    0,
    'model',
    null,
    null,
    null,
    null,
    null,
  )
  assertGreater(generationId, 0)
  const returnGeneration = GenerationService.getGeneration(generationId + 1, true)
  assertEquals(returnGeneration === null, true)
})

Deno.test('Test get generation without full content', () => {
  GenerationService.deleteAllGenerations()
  const generations = GenerationService.getGenerations(Constants.GENERATION_TYPE_IMAGE, false)
  assertEquals(generations.length, 0)
  const generationId = GenerationService.addGeneration(
    Constants.GENERATION_TYPE_IMAGE,
    'hello',
    '{}',
    'hello',
    'hello content',
    'hello content',
    0,
    'model',
    null,
    null,
    null,
    null,
    null,
  )
  assertGreater(generationId, 0)
  const returnGeneration = GenerationService.getGeneration(generationId, false)
  assertEquals(returnGeneration !== null && returnGeneration.generationContent === null, true)
})

Deno.test('Test update generation', () => {
  GenerationService.deleteAllGenerations()
  const generations = GenerationService.getGenerations(Constants.GENERATION_TYPE_IMAGE, true)
  assertEquals(generations.length, 0)
  const generationId = GenerationService.addGeneration(
    Constants.GENERATION_TYPE_IMAGE,
    'hello',
    '{}',
    'hello',
    'hello content',
    'hello content',
    0,
    'model',
    null,
    null,
    null,
    null,
    null,
  )
  assertGreater(generationId, 0)
  GenerationService.updateGeneration(
    generationId,
    Constants.GENERATION_TYPE_IMAGE,
    'hello update',
    '{}',
    'hello',
    'hello content',
    'hello content',
    0,
    'model',
    null,
    null,
    null,
    null,
    null,
  )
  const returnGeneration = GenerationService.getGeneration(generationId, true)
  assertEquals(returnGeneration !== null, true)
  assertEquals(returnGeneration!.generationPrompt, 'hello update')
})
