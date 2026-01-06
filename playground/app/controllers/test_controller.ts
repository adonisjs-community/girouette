import { Get } from '@adonisjs-community/girouette'

export default class TestController {
  @Get('/')
  home() {
    return 'Homepage eee'
  }
}
