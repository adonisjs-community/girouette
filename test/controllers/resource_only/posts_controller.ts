import { Only, Resource } from '../../../index.js'
import { HttpContext } from '@adonisjs/core/http'

@Resource('posts')
@Only(['update', 'destroy'])
export default class PostsController {
  async update({}: HttpContext) {}

  async destroy({}: HttpContext) {}
}
