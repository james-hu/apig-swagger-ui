import * as fs from 'fs-extra';
import * as SwaggerUIDist from 'swagger-ui-dist';
import micromatch = require('micromatch');
import { withRetry } from '@handy-common-utils/aws-utils';
import { APIGateway, ApiGatewayV2 } from 'aws-sdk';
import { HomePage } from './home-page';
import { Context } from './context';
import { Transformer } from './transformer';

export class Generator {
  constructor(protected context: Context) {}

  async generate() {
    const homePage = new HomePage(this.context);
    const transformer = new Transformer(this.context);
    const regions = this.context.options.flags.region == null || this.context.options.flags.region.length === 0 ? [undefined] : this.context.options.flags.region;

    this.context.info(`Clearing destination folder: ${this.context.options.args.path}`);
    await this.emptyApiFolder();

    for (const region of regions) {
      await this.generateForOneRegion(homePage, transformer, region);
    }

    await this.copySwaggerUi();
    await homePage.generate();
  }

  async generateForOneRegion(homePage: HomePage, transformer: Transformer, region?: string) {
    const awsClientConfig = { region, credentials: this.context.awsCredentialsOption };
    const apig = new APIGateway(awsClientConfig);
    const apig2 = new ApiGatewayV2(awsClientConfig);
    // eslint-disable-next-line unicorn/no-await-expression-member
    const domainNameObjects = (await withRetry(() => apig.getDomainNames({ limit: 500 }).promise()))?.items;
    if (domainNameObjects != null) {
      for (const domainNameObj of domainNameObjects) {
        const domainName = domainNameObj.domainName!;
        this.context.debug(`Found custom domain: ${domainName}`);
        const supportHttps = domainNameObj.securityPolicy != null;
        // eslint-disable-next-line unicorn/no-await-expression-member
        const mappings = (await withRetry(() => apig2.getApiMappings({ DomainName: domainName, MaxResults: '500' }).promise()))?.Items;
        if (mappings != null) {
          await this.emptyDomainFolder(domainName);
          let hasSpecFileWritten = false;
          for (const mapping of mappings) {
            const basePath = mapping.ApiMappingKey === '(none)' ? '' : mapping.ApiMappingKey!;
            const domainAndBasePath = `${domainName}/${basePath}`;
            const shouldInclude = micromatch.isMatch(domainAndBasePath, this.context.options.flags.include);
            const shouldExclude = this.context.options.flags.exclude == null ? false : micromatch.isMatch(domainAndBasePath, this.context.options.flags.exclude);
            this.context.debug(`Found API: ${domainAndBasePath}, shouldInclude=${shouldInclude}, shouldExclude=${shouldExclude}`);
            if (shouldInclude && !shouldExclude) {
              const baseUrl = `${supportHttps ? 'https' : 'http'}://${domainAndBasePath}`;
              this.context.info(`Generating OpenAPI spec for: ${baseUrl}`);
              const exportedForRestOrNull = withRetry(() => apig.getExport({
                restApiId: mapping.ApiId!,
                stageName: mapping.Stage!,
                exportType: 'oas30',
                parameters: {},
              }).promise())
              .catch(() => null);
              const exportedForHttpOrNull = withRetry(() => apig2.exportApi({
                ApiId: mapping.ApiId!,
                StageName: mapping.Stage!,
                Specification: 'OAS30',
                OutputType: 'JSON',
              }).promise())
              .catch(() => null);
              const specString = (await exportedForRestOrNull ?? await exportedForHttpOrNull)?.body?.toString('utf8');
              if (specString == null) {
                this.context.info(`Can't find OpenAPI spec for: ${domainAndBasePath}`);
              } else {
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
