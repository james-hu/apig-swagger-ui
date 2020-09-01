import * as path from 'path';
import ApigSwaggerUi = require('.');

export class Configuration {
    swaggerUiFolder: string;
    swaggerUiIndexFile: string;
    apiFolder: string;
    homePageFile: string;

    constructor(public options: typeof ApigSwaggerUi.Options,
                public basePathSwaggerUi = 'swagger-ui',
                private basePathApi = 'api',
                private pathHomePage = 'index.html') {
        this.swaggerUiFolder = path.join(this.options.args.path, this.basePathSwaggerUi);
        this.swaggerUiIndexFile = path.join(this.swaggerUiFolder, 'index.html');
        this.apiFolder = path.join(this.options.args.path, this.basePathApi);
        this.homePageFile = path.join(this.options.args.path, this.pathHomePage);
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
     */
    pathSpecFile(domain: string, basePath: string) {
        return `${this.basePathApi}/${domain}/${this.specFileName(basePath)}`;
    }
}