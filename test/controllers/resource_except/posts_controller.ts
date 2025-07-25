import { Except, Resource } from '../../../index.js'
import { HttpContext } from '@adonisjs/core/http'

@Resource('posts')
@Except(['create', 'show'])
export default class PostsController {
  async create({}: HttpContext) {}

  async show({}: HttpContext) {}
}
