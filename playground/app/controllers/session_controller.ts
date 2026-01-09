import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { Resource, ResourceMiddleware, Only } from '@adonisjs-community/girouette'
import { middleware } from '#start/kernel'

@Resource({ name: 'session' })
@Only(['create', 'index', 'destroy'])
@ResourceMiddleware('*', middleware.auth())
export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth }: HttpContext) {
    const { email, password } = request.all()
    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(user)
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect().toRoute('new_account.store')
  }
}
