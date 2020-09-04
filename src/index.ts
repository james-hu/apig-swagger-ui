import {Command, flags} from '@oclif/command'
import * as Parser from '@oclif/parser';
import { Generator } from './generator';
import { LocalServer } from './local-server';
import { Configuration } from './configuration';


class ApigSwaggerUi extends Command {
  static Options: ApigSwaggerUiOptions  // just to hold the type
  static description = 'Command line tool for generating OpenAPI spec and SwaggerUI from AWS API Gateway'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),

    region: flags.string({char: 'r', description: 'AWS region'}),

    include: flags.string({char: 'i', default: ['*/*', '*/'], multiple: true, description: 'custom domains and base path mappings to include'}),
    exclude: flags.string({char: 'x', multiple: true, description: 'custom domains and base path mappings to exclude'}),

    server: flags.boolean({char: 's', description: 'start a local http server and open a browser for viewing generated files'}),
    port: flags.integer({char: 'p', default: 8001, description: 'port number of the local http server'}),
    
    quiet: flags.boolean({char: 'q', description: 'no console output'}),
    debug: flags.boolean({char: 'd', description: 'output debug messages'}),
  }

  static args = [
    {name: 'path' as const, default: 'api-doc', description: 'path for putting generated files'}
  ]

  
  async run(argv?: string[]) {
    const options = this.parse<GetF<typeof ApigSwaggerUi>, ArgType>(ApigSwaggerUi, argv)
    const config = new Configuration(options);
    config.debug('Options: ', options);
    const generator = new Generator(config);
    await generator.generate();
    if (options.flags.server) {
      const server = new LocalServer(config);
      server.start();
    }
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
