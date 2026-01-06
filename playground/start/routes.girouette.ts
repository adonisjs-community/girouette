/*
|--------------------------------------------------------------------------
| Girouette routes loader file
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD PROCESS
|
| It automatically register your resolvers present in `app/controllers`.
| You can disable this behavior by removing the `indexControllers` from your `adonisrc.ts`.
|
*/

import girouette from '@adonisjs-community/girouette/services/main'
import app from '@adonisjs/core/services/app'

await girouette.controllers([
  () => import('#controllers/new_account_controller'),
  () => import('#controllers/session_controller'),
  () => import('#controllers/test_controller'),
])

girouette.hmr(app.makePath('app/controllers'))
