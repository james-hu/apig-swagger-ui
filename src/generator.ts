import * as fs from 'fs-extra';
import * as SwaggerUIDist from 'swagger-ui-dist';
import micromatch = require('micromatch');
import { withRetry } from '@handy-common-utils/aws-utils';
import { APIGateway } from 'aws-sdk';
import { HomePage } from './home-page';
import { Context } from './context';
import { Transformer } from './transformer';

export class Generator {
  constructor(protected context: Context) {}

  async generate() {
    const homePage = new HomePage(this.context);
    const transformer = new Transformer(this.context);

    const apig = new APIGateway({ region: this.context.options.flags.region });
    const domainNameObjects = (await withRetry(() => apig.getDomainNames({ limit: 500 }).promise()))?.items;
    if (domainNameObjects != null) {
      this.context.info(`Generating files to: ${this.context.options.args.path}`);
      const copySwaggerUiPromise = this.copySwaggerUi();
      await this.emptyApiFolder();
      for (const domainNameObj of domainNameObjects) {
        const domainName = domainNameObj.domainName!;
        this.context.debug(`Found custom domain: ${domainName}`);
        const supportHttps = domainNameObj.securityPolicy != null;
        const mappings = (await withRetry(() => apig.getBasePathMappings({ domainName, limit: 500 }).promise()))?.items;
        if (mappings != null) {
          await this.emptyDomainFolder(domainName);
          let hasSpecFileWritten = false;
          for (const mapping of mappings) {
            const basePath = mapping.basePath === '(none)' ? '' : mapping.basePath!;
            const domainAndBasePath = `${domainName}/${basePath}`;
            const shouldInclude = micromatch.isMatch(domainAndBasePath, this.context.options.flags.include);
            const shouldExclude = this.context.options.flags.exclude == null ? false : micromatch.isMatch(domainAndBasePath, this.context.options.flags.exclude);
            this.context.debug(`Found API: ${domainAndBasePath}, shouldInclude=${shouldInclude}, shouldExclude=${shouldExclude}`);
            if (shouldInclude && !shouldExclude) {
              const baseUrl = `${supportHttps ? 'https' : 'http'}://${domainAndBasePath}`;
              this.context.info(`Generating OpenAPI spec for: ${baseUrl}`);
              const exported = await withRetry(() => apig.getExport({
                restApiId: mapping.restApiId!,
                stageName: mapping.stage!,
                exportType: 'oas30',
                parameters: {},
              }).promise());
              const specString = exported.body?.toString('utf8');
              if (specString != null) {
                const specFile = this.context.specFile(domainName, basePath);
                const specObj = JSON.parse(specString);
                // write original version, then transform, then write transformed version
                fs.writeJson(specFile.replace(/\.json$/, '.apig.json'), specObj, { spaces: 2 }).then(() => {
                  transformer.transform(specObj, domainNameObj, mapping, domainAndBasePath);
                  return fs.writeJson(specFile, specObj, { spaces: 2 });
                });
                hasSpecFileWritten = true;
                homePage.addApi(baseUrl, this.context.pathSpecFile(domainName, basePath));
              }
            }
          }
          if (!hasSpecFileWritten) {
            this.removeDomainFolder(domainName);
          }
        }
      }
      await copySwaggerUiPromise; // because we copy swagger-ui/index.html to home page and then modify it
      await homePage.generate();
    }
  }

  protected async copySwaggerUi() {
    const swaggerUiDestDir = this.context.swaggerUiFolder;
    await fs.emptyDir(swaggerUiDestDir);
    return fs.copy(SwaggerUIDist.getAbsoluteFSPath(), swaggerUiDestDir, {
      filter: (src, _dest) => {
        return ![
          '.md',
          'package.json',
          'index.js',
          'absolute-path.js',
          ...(this.context.options.flags['enable-source-maps'] ? [] : ['.map']),
        ].some(suffix => src.endsWith(suffix));
      },
      preserveTimestamps: true,
    });
  }

  protected async emptyApiFolder() {
    return fs.emptyDir(this.context.apiFolder);
  }

  protected async emptyDomainFolder(domain: string) {
    return fs.emptyDir(this.context.domainFolder(domain));
  }

  protected async removeDomainFolder(domain: string) {
    return fs.remove(this.context.domainFolder(domain));
  }
}
