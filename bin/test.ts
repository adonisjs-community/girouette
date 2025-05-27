/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "test.ts" file is the entrypoint for running tests using Japa.
|
| Either you can run this file directly or use the "test"
| command to run this file and monitor file changes.
|
*/

process.env.NODE_ENV = 'test'

import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'
import { TestUtilsFactory } from '@adonisjs/core/factories'
import { assert } from '@japa/assert'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .testRunner()
  .configure(async (app) => {
    processCLIArgs(process.argv.splice(2))

    const testFactory = new TestUtilsFactory()

    const testUtils = testFactory.create(app.appRoot)

    await testUtils.app.init()

    await testUtils.app.boot()

    await testUtils.boot()

    configure({
      ...app.rcFile.tests,
      files: ['test/**/*.spec.ts'],
      plugins: [assert()],
      configureSuite(suite) {
        return suite.setup(() => testUtils.httpServer().start())
      },
    })
  })
  .run(async () => run())
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
