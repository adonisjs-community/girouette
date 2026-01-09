import { Group, GroupMiddleware, Post, Middleware } from '@adonisjs-community/girouette'
import { middleware } from '#start/kernel'

@Group({ prefix: '/api' })
@GroupMiddleware([middleware.auth()])
export default class ApiController {
  @Post('/expensive-operation')
  @Middleware([middleware.guest()])
  async expensiveOperation() {
    // Stricter limit for this endpoint
  }
}
