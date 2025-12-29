import { Get } from '../../../src/decorators/methods.js'
import { type HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  @Get('/posts', 'posts.custom_regex.index')
  async index({}: HttpContext) {}
}
