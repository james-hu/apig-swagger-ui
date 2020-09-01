import * as fs from 'fs-extra';
import ApigSwaggerUi = require('.');
import { Configuration } from './configuration';

interface Api {
    baseUrl: string,
    specFilePath: string,
}

export class HomePage {
    private apis: Api[] = [];

    constructor(private config: Configuration) {}

    addApi(baseUrl: string, specFilePath: string) {
        this.apis.push({baseUrl, specFilePath});
    }

    async generate() {
        this.apis.sort((a, b) => a.baseUrl.localeCompare(b.baseUrl));
        const urls = this.apis.map(api => ({name: api.baseUrl, url: api.specFilePath}));
        const urlsText = JSON.stringify(urls, null, 2);

        const basePath = this.config.basePathSwaggerUi;
        let html = fs.readFileSync(this.config.swaggerUiIndexFile).toString('utf8');
        html = html.replace(/href=".\//g, `href="./${basePath}/`)
                   .replace(/src=".\//g, `src="./${basePath}/`)
                   .replace(/url:.*petstore.swagger.io.*swagger.json\"/, `urls: ${urlsText}`);
        fs.writeFileSync(this.config.homePageFile, html);
    }
}