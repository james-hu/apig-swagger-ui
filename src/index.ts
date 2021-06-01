import { Command, flags } from '@oclif/command';
import * as Parser from '@oclif/parser';
import { Generator } from './generator';
import { LocalServer } from './local-server';
import { Context } from './context';
import { OclifUtils } from '@handy-common-utils/oclif-utils';

class ApigSwaggerUi extends Command {
  static Options: CommandOptions<typeof ApigSwaggerUi>;  // just to hold the type
  static description = 'Command line tool for generating OpenAPI spec and Swagger UI from AWS API Gateway\n' +
  `This command line tool can generate a static website that you can host for serving Swagger UI of your API Gateway APIs.
  It generates website files locally and can optionally launch a local server for you to preview.
  Before running this tool, you need to log into your AWS account (through command line like aws, saml2aws, okta-aws, etc.) first.
  Please note that only APIs that have been mapped to custom domains will be included in the website generated.`;

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    'update-readme.md': flags.boolean({ hidden: true, description: 'For developers only, don\'t use' }),

    region: flags.string({ char: 'r', description: 'AWS region' }),

    include: flags.string({ char: 'i', default: ['*/*', '*/'], multiple: true, description: 'custom domains and base path mappings to include' }),
    exclude: flags.string({ char: 'x', multiple: true, description: 'custom domains and base path mappings to exclude' }),

    server: flags.boolean({ char: 's', description: 'start a local http server and open a browser for pre-viewing generated website' }),
    port: flags.integer({ char: 'p', default: 8001, description: 'port number of the local http server for preview' }),

    quiet: flags.boolean({ char: 'q', description: 'no console output' }),
    debug: flags.boolean({ char: 'd', description: 'output debug messages' }),

    'validator-url': flags.string({ char: 'a', default: undefined, description: 'custom validator URL, or "none" for disabling validation' }),
    'enable-source-maps': flags.boolean({ char: 'm', default: true, description: 'include swagger-ui\'s source map files or not' }),
  };

  static args = [
    { name: 'path' as const, default: 'api-doc', description: 'path for putting generated website files' },
  ];

  static examples = [
    '^ -r ap-southeast-2 -s',
    "^ -r ap-southeast-2 -s -i '*uat1*/*' -x 'datahub.uat1.*/*'",
    "^ -r ap-southeast-2 -s -i '*/key*' -i 'boi.stg.*/*' path/to/api-doc/directory",
  ];

  protected async init() {
    OclifUtils.prependCliToExamples(this);
    return super.init();
  }

  async run(argv?: string[]) {
    const options = this.parse<CommandFlags<typeof ApigSwaggerUi>, CommandArgs<typeof ApigSwaggerUi>>(ApigSwaggerUi, argv);
    if (options.flags['update-readme.md']) {
      OclifUtils.injectHelpTextIntoReadmeMd(this);
      return;
    }

    const reconstructedcommandLine = OclifUtils.reconstructCommandLine(this, options);
    const context = new Context(options);
    context.debug('Command line: ', reconstructedcommandLine);
    context.debug('Options: ', options);

    try {
      await this.doRun(context);
    } catch (error) {
      context.debug(error);
      if (typeof error.code === 'string' && error.code.startsWith('ExpiredToken')) {
        context.info('Did you forget to log into AWS? Please log into your AWS account and try again.');
        context.info(`  ${error}`);
      } else {
        throw error;
      }
    }
  }

  protected async doRun(context: Context) {
    const generator = new Generator(context);
    await generator.generate();
    if (context.options.flags.server) {
      const server = new LocalServer(context);
      server.start();
    }
  }
}

export = ApigSwaggerUi;

type CommandFlags<T> = T extends Parser.Input<infer F> ? F : never
type CommandArgNames<T> = T extends {name: infer A}[] ? A : never
type CommandArgs<T extends {args: Array<{name: string}>}> = {
  [x in CommandArgNames<T['args']>]: string;
}
type CommandOptions<T extends {args: Array<{name: string}>}> = Parser.Output<CommandFlags<T>, CommandArgs<T>>

