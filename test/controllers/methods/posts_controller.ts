import { type HttpContext } from '@adonisjs/core/http'
import { Get, Post, Put, Patch, Delete, Any, GroupMiddleware } from '../../../index.js'
import { fakeMiddleware } from '../../utils.js'

@GroupMiddleware(fakeMiddleware)
export default class PostsController {
  @Get('/posts', 'posts')
  async index({}: HttpContext) {}

  @Get('/posts/:id', 'posts.show')
  async show({}: HttpContext) {}

  @Post('/posts/', 'posts.store')
  async store({}: HttpContext) {}

  @Put('/posts/:id', 'posts.update')
  async update({}: HttpContext) {}

  @Patch('/posts/:id', 'posts.partialUpdate')
  async partialUpdate({}: HttpContext) {}

  @Delete('/posts/:id', 'posts.destroy')
  async destroy({}: HttpContext) {}

  @Any('/posts-any', 'posts.any')
  async any({}: HttpContext) {}
}
