import { Get } from '@adonisjs-community/girouette'

export default class UsersController {
  @Get('/users')
  list() {
    return 'testest hello'
  }
}
