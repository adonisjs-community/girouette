import { HttpContext } from '@adonisjs/core/http'
import { Get, Group, GroupMiddleware } from '../../../index.js'
import { fakeMiddleware } from '../../../src/utils.js'

@Group({ name: 'posts', prefix: 'posts' })
@GroupMiddleware([fakeMiddleware])
export default class PostsController {
  @Get('/')
  async index({}: HttpContext) {}

  @Get('/:id')
  async show({}: HttpContext) {}
}
