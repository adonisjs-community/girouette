// eslint-disable-next-line unicorn/filename-case
import { Get } from '../../../src/decorators/methods.js'
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  @Get('/posts', 'posts.custom_regex.index')
  async index({}: HttpContext) {}
}
