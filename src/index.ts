import { Command, Flags } from '@oclif/core';
import { Generator } from './generator';
import { LocalServer } from './local-server';
import { Context } from './context';
import { CommandOptions, OclifUtils } from '@handy-common-utils/oclif-utils';

class ApigSwaggerUi extends Command {
  static Options: CommandOptions<typeof ApigSwaggerUi>;  // just to hold the type
  static description = 'Command line tool for generating OpenAPI spec and Swagger UI from AWS API Gateway\n' +
  `This command line tool can generate a static website that you can host for serving Swagger UI of your API Gateway APIs.
  It generates website files locally and can optionally launch a local server for you to preview.
  Before running this tool, you need to log into your AWS account (through command line like aws, saml2aws, okta-aws, etc.) first.
  Please note that only APIs that have been mapped to custom domains will be included in the website generated.`;

  static flags = {
    version: Flags.version({ char: 'v' }),
    help: { ...Flags.help({ char: 'h' }), parse: async (_: any, cmd: Command) => {
      cmd.log(await OclifUtils.generateHelpText(cmd));
      cmd.exit(0);
    } },
    'update-readme.md': Flags.boolean({ hidden: true, description: 'For developers only, don\'t use' }),

    region: Flags.string({ char: 'r', multiple: true, description: 'AWS region' }),

    include: Flags.string({ char: 'i', default: ['*/*', '*/'], multiple: true, description: 'custom domains and base path mappings to include' }),
    exclude: Flags.string({ char: 'x', multiple: true, description: 'custom domains and base path mappings to exclude' }),

    server: Flags.boolean({ char: 's', description: 'start a local http server and open a browser for pre-viewing generated website' }),
    port: Flags.integer({ char: 'p', default: 8001, description: 'port number of the local http server for preview' }),

    quiet: Flags.boolean({ char: 'q', description: 'no console output' }),
    debug: Flags.boolean({ char: 'd', description: 'output debug messages' }),

    'validator-url': Flags.string({ char: 'a', default: undefined, description: 'custom validator URL, or "none" for disabling validation' }),
    'enable-source-maps': Flags.boolean({ char: 'm', default: true, description: 'include swagger-ui\'s source map files or not' }),
  };

  static args = [
    { name: 'path' as const, default: 'api-doc', description: 'path for putting generated website files' },
  ];

  static examples = [
    '^ -r ap-southeast-2 -s',
    "^ -r ap-southeast-2 -r us-east-1 -s -i '*uat1*/*' -x 'datahub.uat1.*/*'",
    "^ -r ap-southeast-2 -s -i '*/key*' -i 'boi.stg.*/*' path/to/api-doc/directory",
  ];

  protected async init() {
    OclifUtils.prependCliToExamples(this);
    return super.init();
  }

  async run() {
    const options = await this.parse(ApigSwaggerUi) as CommandOptions<typeof ApigSwaggerUi>;
    if (options.flags['update-readme.md']) {
      OclifUtils.injectHelpTextIntoReadmeMd(this);
      return;
    }

    const reconstructedCommandLine = OclifUtils.reconstructCommandLine(this, options);
    const context = new Context(options);
    context.debug('Command line: ', reconstructedCommandLine);
    context.debug('Options: ', options);

    try {
      await this.doRun(context);
    } catch (error: any) {
      context.debug(error);
      if (typeof error.code === 'string' && error.code.startsWith('ExpiredToken')) {
        context.info('Did you forget to log into AWS? Please log into your AWS account and try again.');
        context.info(`  ${error}`);
      } else if (error.code === 'ConfigError' && typeof error.message === 'string' && error.message.startsWith('Missing region ')) {
        context.info('Did you forget to specify AWS region? Please specify at least one region in the command line and try again.');
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
