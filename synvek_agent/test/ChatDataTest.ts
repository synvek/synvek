import { assertEquals, assertGreater } from 'https://deno.land/std/testing/asserts.ts'
import { ChatDataService } from '../src/ChatDataService.ts'
import { ConversionService } from '../src/ConversionService.ts'

Deno.test('Test add chat', () => {
  ChatDataService.deleteAllChats()
  ConversionService.deleteAllConversions()
  let conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 1)
  let chats = ChatDataService.getChats(conversionId)
  assertEquals(chats.length, 0)
  const chatId = ChatDataService.addChat(
    'LLM',
    'hello world',
    'text',
    'abc',
    true,
    1,
    'model',
    null,
    null,
    null,
    null,
    1,
    1,
    1,
    conversionId,
    null,
    null,
    null,
    null,
    true,
  )
  assertGreater(chatId, 0)
  chats = ChatDataService.getChats(conversionId)
  assertEquals(chats.length, 1)
})

Deno.test('Test get chat with valid data', () => {
  ChatDataService.deleteAllChats()
  ConversionService.deleteAllConversions()
  let conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 1)
  const chats = ChatDataService.getChats(conversionId)
  assertEquals(chats.length, 0)
  const chatId = ChatDataService.addChat(
    'LLM',
    'hello world',
    'text',
    'abc',
    true,
    1,
    'model',
    null,
    null,
    null,
    null,
    1,
    1,
    1,
    conversionId,
    null,
    null,
    null,
    null,
    true,
  )
  assertGreater(chatId, 0)
  const returnChat = ChatDataService.getChat(chatId)
  assertEquals(returnChat !== null, true)
})

Deno.test('Test get chat with invalid data', () => {
  ChatDataService.deleteAllChats()
  ConversionService.deleteAllConversions()
  let conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 1)
  const chats = ChatDataService.getChats(conversionId)
  assertEquals(chats.length, 0)
  const chatId = ChatDataService.addChat(
    'LLM',
    'hello world',
    'text',
    'abc',
    true,
    1,
    'model',
    null,
    null,
    null,
    null,
    1,
    1,
    1,
    conversionId,
    null,
    null,
    null,
    null,
    true,
  )
  assertGreater(chatId, 0)
  const returnChat = ChatDataService.getChat(chatId + 1)
  assertEquals(returnChat === null, true)
})

Deno.test('Test update chat', () => {
  ChatDataService.deleteAllChats()
  ConversionService.deleteAllConversions()
  let conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 0)
  const conversionId = ConversionService.addConversion('testConversionName', null)
  assertGreater(conversionId, 0)
  conversions = ConversionService.getConversions()
  assertEquals(conversions.length, 1)
  const chats = ChatDataService.getChats(conversionId)
  assertEquals(chats.length, 0)
  const chatId = ChatDataService.addChat(
    'LLM',
    'hello world',
    'text',
    'abc',
    true,
    1,
    'model',
    null,
    null,
    null,
    null,
    1,
    1,
    1,
    1,
    null,
    null,
    null,
    null,
    true,
  )
  assertGreater(chatId, 0)
  ChatDataService.updateChat(
    chatId,
    'LLM',
    'updated hello world',
    'text',
    'abc',
    true,
    1,
    'model',
    null,
    null,
    null,
    null,
    1,
    1,
    1,
    conversionId,
    null,
    null,
    null,
    null,
    true,
  )
  const returnChat = ChatDataService.getChat(chatId)
  assertEquals(returnChat !== null, true)
  assertEquals(returnChat!.chatContent, 'updated hello world')
})
