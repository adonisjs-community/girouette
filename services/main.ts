import app from '@adonisjs/core/services/app'
import type { Girouette } from '../src/girouette.ts'

let girouette: Girouette

await app.booted(async () => {
  girouette = await app.container.make('girouette')
})

export { girouette as default }
