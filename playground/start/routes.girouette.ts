/*
|--------------------------------------------------------------------------
| Girouette routes loader file
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD PROCESS
|
| It automatically register your resolvers present in `./app`.
| You can disable this behavior by removing the `indexControllers` from your `adonisrc.ts`.
|
*/

import girouette from '@adonisjs-community/girouette/services/main'
import app from '@adonisjs/core/services/app'

await girouette.controllers([
  () => import('#app/controllers/api_controller'),
  () => import('#app/controllers/new_account_controller'),
  () => import('#app/controllers/session_controller'),
  () => import('#app/controllers/test_controller'),
  () => import('#app/features/users/controllers/users_controller'),
])

girouette.hmr(app.makePath('./app'))
