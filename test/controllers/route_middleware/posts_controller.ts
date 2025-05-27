import { HttpContext } from '@adonisjs/core/http'
import { Get, Middleware } from '../../../index.js'
import { fakeMiddleware } from '../../../src/utils.js'

export default class PostsController {
  @Get('/posts')
  @Middleware([fakeMiddleware])
  async index({}: HttpContext) {}
}
