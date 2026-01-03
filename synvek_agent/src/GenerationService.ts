import { Elysia, t } from 'elysia'
import moment from 'moment'
import { Generation, GenerationRow } from './Types.ts'
import { SqliteUtils } from './Utils/SqliteUtils.ts'
import { SystemUtils } from './Utils/SystemUtils.ts'

const generation = new Elysia().state({ message: '' })

export class GenerationService {
  public static getGenerations(fullContent: boolean, limitation: number | undefined): Generation[] {
    const db = SqliteUtils.connectStorageDatabase()
    const rows = db
      .prepare(
        'select generation_id, generation_type, generation_prompt, generation_context, ' +
          'generation_key, ' +
          (fullContent ? '' : ' null as ') +
          'generation_content, generation_summary, generation_time, ' +
          'model_name, finish_reason, system_fingerprint, input_tokens, ' +
          'output_tokens, total_tokens, updated_date, created_date from generation ' +
          'order by created_date desc ' + (limitation ? 'limit ' + limitation : ''),
      ).all()
    return rows.map((row: GenerationRow) => {
      const rowData: GenerationRow = row as GenerationRow
      const generation: Generation = {
        generationId: rowData.generation_id,
        generationType: rowData.generation_type,
        generationPrompt: rowData.generation_prompt,
        generationContext: rowData.generation_context,
        generationKey: rowData.generation_key,
        generationContent: rowData.generation_content,
        generationSummary: rowData.generation_summary,
        generationTime: rowData.generation_time,
        modelName: rowData.model_name,
        finishReason: rowData.finish_reason,
        systemFingerprint: rowData.system_fingerprint,
        inputTokens: rowData.input_tokens,
        outputTokens: rowData.output_tokens,
        totalTokens: rowData.total_tokens,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return generation
    })
  }

  public static addGeneration(
    generationType: string,
    generationPrompt: string,
    generationContext: string,
    generationKey: string,
    generationContent: string,
    generationSummary: string,
    generationTime: number,
    modelName: string,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
  ) {
    const db = SqliteUtils.connectStorageDatabase()
    const newGeneration: Generation = {
      generationId: 0,
      generationType: generationType,
      generationPrompt: generationPrompt,
      generationContext: generationContext,
      generationKey: generationKey,
      generationContent: generationContent,
      generationSummary: generationSummary,
      generationTime: generationTime,
      modelName: modelName,
      finishReason: finishReason,
      systemFingerprint: systemFingerprint,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      updatedDate: moment().valueOf(),
      createdDate: moment().valueOf(),
    }
    const row = db
      .prepare(
        'insert into generation(generation_type, generation_prompt, generation_context, ' +
          'generation_key, generation_content, generation_summary, generation_time, ' +
          'model_name, finish_reason, system_fingerprint, input_tokens, ' +
          'output_tokens, total_tokens, updated_date, created_date) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      )
      .run(
        newGeneration.generationType,
        newGeneration.generationPrompt,
        newGeneration.generationContext,
        newGeneration.generationKey,
        newGeneration.generationContent,
        newGeneration.generationSummary,
        newGeneration.generationTime,
        newGeneration.modelName,
        newGeneration.finishReason,
        newGeneration.systemFingerprint,
        newGeneration.inputTokens,
        newGeneration.outputTokens,
        newGeneration.totalTokens,
        newGeneration.updatedDate,
        newGeneration.createdDate,
      )
    return row.lastInsertRowid as number
  }

  public static deleteGeneration(generationId: number) {
    const db = SqliteUtils.connectStorageDatabase()
    const update = db.prepare(`delete from generation where generation_id = ?`)
    update.run(generationId)
  }

  public static deleteAllGenerations() {
    const db = SqliteUtils.connectStorageDatabase()
    db.exec(`delete from generation`)
  }

  public static updateGeneration(
    generationId: number,
    generationType: string,
    generationPrompt: string,
    generationContext: string,
    generationKey: string,
    generationContent: string,
    generationSummary: string,
    generationTime: number,
    modelName: string,
    finishReason: string | null,
    systemFingerprint: string | null,
    inputTokens: number | null,
    outputTokens: number | null,
    totalTokens: number | null,
  ) {
    const db = SqliteUtils.connectStorageDatabase()
    const oldGeneration = GenerationService.getGeneration(generationId, false)
    if (oldGeneration != null) {
      const newGeneration: Generation = {
        generationId: generationId,
        generationType: generationType,
        generationPrompt: generationPrompt,
        generationContext: generationContext,
        generationKey: generationKey,
        generationContent: generationContent,
        generationSummary: generationSummary,
        generationTime: generationTime,
        modelName: modelName,
        finishReason: finishReason,
        systemFingerprint: systemFingerprint,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: totalTokens,
        updatedDate: moment().valueOf(),
        createdDate: oldGeneration.createdDate,
      }
      const update = db.prepare(
        'UPDATE generation SET generation_type = ?, generation_prompt = ?, generation_context = ?, ' +
          'generation_key = ?, generation_content = ?, generation_summary = ?, generation_time = ?, ' +
          'model_name = ?, finish_reason = ?, system_fingerprint = ?, ' +
          'input_tokens = ?, output_tokens = ?, total_tokens = ?, updated_date = ?, created_date = ? ' +
          'WHERE generation_id = ?',
      )
      const result = update.run(
        newGeneration.generationType,
        newGeneration.generationPrompt,
        newGeneration.generationContext,
        newGeneration.generationKey,
        newGeneration.generationContent,
        newGeneration.generationSummary,
        newGeneration.generationTime,
        newGeneration.modelName,
        newGeneration.finishReason,
        newGeneration.systemFingerprint,
        newGeneration.inputTokens,
        newGeneration.outputTokens,
        newGeneration.totalTokens,
        newGeneration.updatedDate,
        newGeneration.createdDate,
        newGeneration.generationId,
      )
      return result.changes as number
    } else {
      return 0
    }
  }

  public static getGeneration(generationId: number, fullContent: boolean) {
    const db = SqliteUtils.connectStorageDatabase()
    const row = db
      .prepare(
        'select generation_id, generation_type, generation_prompt, generation_context, generation_key, ' +
          (fullContent ? '' : ' null as ') +
          'generation_content, generation_summary, generation_time, ' +
          'model_name, finish_reason, system_fingerprint, input_tokens, ' +
          'output_tokens, total_tokens, updated_date, created_date from generation where generation_id = ?',
      )
      .get(generationId)
    const rowData = row as GenerationRow
    if (rowData) {
      const generation: Generation = {
        generationId: rowData.generation_id,
        generationType: rowData.generation_type,
        generationPrompt: rowData.generation_prompt,
        generationContext: rowData.generation_context,
        generationKey: rowData.generation_key,
        generationContent: rowData.generation_content,
        generationSummary: rowData.generation_summary,
        generationTime: rowData.generation_time,
        modelName: rowData.model_name,
        finishReason: rowData.finish_reason,
        systemFingerprint: rowData.system_fingerprint,
        inputTokens: rowData.input_tokens,
        outputTokens: rowData.output_tokens,
        totalTokens: rowData.total_tokens,
        updatedDate: rowData.updated_date,
        createdDate: rowData.created_date,
      }
      return generation
    } else {
      return null
    }
  }
}

export const generationService = new Elysia({ prefix: 'generation' })
  .use(generation)
  .post(
    '/generations',
    ({ body, set }) => {
      const generations = GenerationService.getGenerations(body.fullContent, body.limitation)
      if (generations !== null) {
        return SystemUtils.buildResponse(true, generations)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load generations')
      }
    },
    {
      body: t.Object({
        fullContent: t.Boolean(),
        limitation: t.Optional(t.Number()),
      }),
    },
  )
  .post(
    '/generation',
    ({ body, set }) => {
      const generation = GenerationService.getGeneration(body.generationId, body.fullContent)
      if (generation !== null) {
        return SystemUtils.buildResponse(true, generation)
      } else {
        return SystemUtils.buildResponse(false, null, 'Failed to load generation')
      }
    },
    {
      body: t.Object({
        generationId: t.Number(),
        fullContent: t.Boolean(),
      }),
    },
  )
  .post(
    '/delete',
    ({ body, set }) => {
      GenerationService.deleteGeneration(body.generationId)
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        generationId: t.Number(),
      }),
    },
  )
  .post(
    '/add',
    ({ body, set }) => {
      const generationId = GenerationService.addGeneration(
        body.generationType,
        body.generationPrompt,
        body.generationContext,
        body.generationKey,
        body.generationContent,
        body.generationSummary,
        body.generationTime,
        body.modelName,
        body.finishReason,
        body.systemFingerprint,
        body.inputTokens,
        body.outputTokens,
        body.totalTokens,
      )
      return SystemUtils.buildResponse(true, generationId, null)
    },
    {
      body: t.Object({
        generationType: t.String(),
        generationPrompt: t.String(),
        generationContext: t.String(),
        generationKey: t.String(),
        generationContent: t.String(),
        generationSummary: t.String(),
        generationTime: t.Number(),
        modelName: t.String(),
        finishReason: t.Nullable(t.String()),
        systemFingerprint: t.Nullable(t.String()),
        inputTokens: t.Nullable(t.Number()),
        outputTokens: t.Nullable(t.Number()),
        totalTokens: t.Nullable(t.Number()),
      }),
    },
  )
  .post(
    '/update',
    ({ body, store: generation, set }) => {
      GenerationService.updateGeneration(
        body.generationId,
        body.generationType,
        body.generationPrompt,
        body.generationContext,
        body.generationKey,
        body.generationContent,
        body.generationSummary,
        body.generationTime,
        body.modelName,
        body.finishReason,
        body.systemFingerprint,
        body.inputTokens,
        body.outputTokens,
        body.totalTokens,
      )
      return SystemUtils.buildResponse(true, null, null)
    },
    {
      body: t.Object({
        generationId: t.Number(),
        generationType: t.String(),
        generationPrompt: t.String(),
        generationContext: t.String(),
        generationKey: t.String(),
        generationContent: t.String(),
        generationSummary: t.String(),
        generationTime: t.Number(),
        modelName: t.String(),
        finishReason: t.Nullable(t.String()),
        systemFingerprint: t.Nullable(t.String()),
        inputTokens: t.Nullable(t.Number()),
        outputTokens: t.Nullable(t.Number()),
        totalTokens: t.Nullable(t.Number()),
      }),
    },
  )
