import { type HttpContext } from '@adonisjs/core/http'
import { Get, Group, GroupDomain } from '../../../index.js'

@Group({ name: '/posts', prefix: '/posts' })
@GroupDomain('admin.example.com')
export default class PostsController {
  @Get('/', 'posts')
  async index({}: HttpContext) {}

  @Get('/:id', 'posts.id')
  async show({}: HttpContext) {}
}
