import {Command, flags} from '@oclif/command'
import * as Parser from '@oclif/parser';
import { Generator } from './generator';
import { LocalServer } from './local-server';
import { Configuration } from './configuration';


class ApigSwaggerUi extends Command {
  static Options: ApigSwaggerUiOptions  // just to hold the type
  static description = 'Command line tool for generating OpenAPI spec and SwaggerUI from AWS API Gateway'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    region: flags.string({char: 'r', description: 'AWS region'}),
    include: flags.string({char: 'i', default: ['*/*', '*/'], multiple: true, description: 'custom domains to include'}),
    exclude: flags.string({char: 'x', multiple: true, description: 'custom domains to exclude'}),
    server: flags.boolean({char: 's', description: 'start a local http server and open a browser for viewing generated files'}),
    port: flags.integer({char: 'p', default: 8001, description: 'port number of the local http server'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [
    {name: 'path' as const, default: 'api-doc', description: 'path for putting generated files'}
  ]

  
  async run() {
    const options = this.parse<GetF<typeof ApigSwaggerUi>, ArgType>(ApigSwaggerUi)
    console.log(options);
    const config = new Configuration(options);
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
