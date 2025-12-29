import { Resource } from '../../../index.js'
import { type HttpContext } from '@adonisjs/core/http'

@Resource({
  name: 'posts.comments',
  params: { posts: 'post', comments: 'comment' },
})
export default class PostsController {
  async index({}: HttpContext) {}

  async store({}: HttpContext) {}

  async show({}: HttpContext) {}

  async update({}: HttpContext) {}

  async destroy({}: HttpContext) {}
}
