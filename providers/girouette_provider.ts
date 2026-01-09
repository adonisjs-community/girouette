import 'reflect-metadata'
import type { ApplicationService } from '@adonisjs/core/types'
import { Girouette } from '../src/girouette.ts'

/**
 * The GirouetteProvider is responsible for generating a routes.ts file from decorated controllers.
 * It scans the application's controllers directory and generates a standard AdonisJS routes file.
 */
export default class GirouetteProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('girouette', async (resolver) => {
      const router = await resolver.make('router')
      const logger = await resolver.make('logger')
      return new Girouette(router, logger.child({ service: 'girouette' }))
    })
  }

  async boot() {
    const girouette = await this.app.container.make('girouette')
    await girouette.boot()
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    girouette: Girouette
  }
}
