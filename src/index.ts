import {Command, flags} from '@oclif/command'
import * as Parser from '@oclif/parser';
import {execute} from './command';


class ApigSwaggerUi extends Command {
  static Options: ApigSwaggerUiOptions  // just to hold the type
  static description = 'Command line tool for generating OpenAPI spec and SwaggerUI from AWS API Gateway'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    region: flags.string({char: 'r', description: 'AWS region'}),
    include: flags.string({char: 'i', default: '*/*', multiple: true, description: 'custom domains to include'}),
    exclude: flags.string({char: 'x', multiple: true, description: 'custom domains to exclude'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [
    {name: 'path' as const, default: 'api-doc', description: 'path for putting generated files'}
  ]

  
  async run() {
    const options = this.parse<GetF<typeof ApigSwaggerUi>, ArgType>(ApigSwaggerUi)
    console.log(options);
    return execute(options);
  }


}

export = ApigSwaggerUi;

type GetF<T> = T extends Parser.Input<infer F> ? F : never
type GetArgNames<T> = T extends {name: infer A}[] ? A : never
type ArgNames = GetArgNames<typeof ApigSwaggerUi.args>
type ArgType = {
  [x in ArgNames]: string;
};
type ApigSwaggerUiOptions = Parser.Output<GetF<typeof ApigSwaggerUi>, ArgType>
