// eslint-disable-next-line unicorn/import-style, unicorn/prefer-node-protocol
import * as path from 'path';
import ApigSwaggerUi = require('.');
import type { CredentialsOptions } from 'aws-sdk/lib/credentials';

export class Context {
    awsCredentialsOption?: CredentialsOptions;
    swaggerUiFolder: string;
    swaggerUiIndexFile: string;
    swaggerUiInitializerJsFile: string;
    apiFolder: string;
    homePageFile: string;

    constructor(public options: typeof ApigSwaggerUi.Options,
        public basePathSwaggerUi = 'swagger-ui',
        private basePathApi = 'api',
        private pathHomePage = 'index.html') {
      this.swaggerUiFolder = path.join(this.options.args.path, this.basePathSwaggerUi);
      this.swaggerUiIndexFile = path.join(this.swaggerUiFolder, 'index.html');
      this.swaggerUiInitializerJsFile = path.join(this.swaggerUiFolder, 'swagger-initializer.js');
      this.apiFolder = path.join(this.options.args.path, this.basePathApi);
      this.homePageFile = path.join(this.options.args.path, this.pathHomePage);

      const accessKeyId = this.options.flags.key;
      const secretAccessKey = this.options.flags.secret;
      const sessionToken = this.options.flags.token;

      this.awsCredentialsOption = (accessKeyId && secretAccessKey) ? {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      } : undefined;
    }

    domainFolder(domain: string) {
      return path.join(this.apiFolder, domain);
    }

    specFileName(basePath: string) {
      return basePath + '.json';
    }

    specFile(domain: string, basePath: string) {
      return path.join(this.domainFolder(domain), this.specFileName(basePath));
    }

    /**
     * Build the URL path to an API spec file
     * @param domain domain name of the API
     * @param basePath base path of the API
     * @returns path to the spec file
     */
    pathSpecFile(domain: string, basePath: string) {
      return `${this.basePathApi}/${domain}/${this.specFileName(basePath)}`;
    }

    info(message?: any, ...optionalParams: any[]): void {
      if (this.options.flags.quiet !== true) {
        console.log(message, ...optionalParams);
      }
    }

    debug(message?: any, ...optionalParams: any[]): void {
      if (this.options.flags.debug === true) {
        console.log(message, ...optionalParams);
      }
    }
}
