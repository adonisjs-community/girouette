import { AllHooks } from '@adonisjs/core/types/app'

export interface IndexControllersOptions {
  /**
   * Source directory for resolvers
   *
   * @default 'app/graphql/resolvers'
   * */
  source?: string

  /**
   * Import alias for resolvers
   *
   * @default '#graphql/resolvers'
   */
  importAlias?: string

  /**
   * Glob patterns for matching resolver files
   */
  glob?: string[]
}

export function indexControllers({
  source = 'app/controllers',
  glob = ['**/*_controller.ts'],
  importAlias = '#controllers',
}: IndexControllersOptions = {}): AllHooks['init'][number] {
  return {
    run(_, __, indexGenerator) {
      indexGenerator.add('girouetteControllers', {
        source,
        glob,
        output: 'start/routes.girouette.ts',
        importAlias,
        as(vfs, buffer, ___, helpers) {
          const filesList = vfs.asList()

          buffer.writeLine(`/*
|--------------------------------------------------------------------------
| Girouette routes loader file
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD PROCESS
|
| It automatically register your resolvers present in \`${source}\`.
| You can disable this behavior by removing the \`indexControllers\` from your \`adonisrc.ts\`.
|
*/`)

          const imports = [
            `import girouette from '@adonisjs-community/girouette/services/main'`,
            `import app from '@adonisjs/core/services/app'`,
          ]

          buffer.writeLine(imports.join('\n'))

          buffer.write(`await girouette.controllers([`).indent()

          for (const [, path] of Object.entries(filesList)) {
            const specifier = helpers.toImportPath(path)
            buffer.write(`() => import('${specifier}'),`)
          }

          buffer.dedent().write(`])`)

          buffer.write(`\ngirouette.hmr(app.makePath('${source}'))`)
        },
      })
    },
  }
}
