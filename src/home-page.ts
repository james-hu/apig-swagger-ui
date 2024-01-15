import * as fs from 'fs-extra';
import { Context } from './context';

interface Api {
  baseUrl: string;
  specFilePath: string;
}

export class HomePage {
  private apis: Api[] = [];

  constructor(private context: Context) {}

  addApi(baseUrl: string, specFilePath: string) {
    this.apis.push({ baseUrl, specFilePath });
  }

  async generate() {
    this.apis.sort((a, b) => a.baseUrl.localeCompare(b.baseUrl));
    const urls = this.apis.map(api => ({ name: api.baseUrl, url: api.specFilePath }));
    const urlsText = JSON.stringify(urls, undefined, 2);
    const validatorUrlText = JSON.stringify(this.context.options.flags['validator-url']);

    const basePath = this.context.basePathSwaggerUi;
    function customise(original: string) {
      return original
        .replace(/href="(.\/)?/g, `href="./${basePath}/`)
        .replace(/src="(.\/)?/g, `src="./${basePath}/`)
        .replace(/url:.*petstore.swagger.io.*swagger.json"/, `urls: ${urlsText}, validatorUrl: ${validatorUrlText}`)
        .replace('<title>.+</title', '<title>Swagger UI with specs generated by apig-swagger-ui</title>');
    }

    // Create a modified copy
    const indexHtml = fs.readFileSync(this.context.swaggerUiIndexFile).toString('utf8');
    fs.writeFileSync(this.context.homePageFile, customise(indexHtml));

    // Modify in place
    const initializerJs = fs.readFileSync(this.context.swaggerUiInitializerJsFile).toString('utf8');
    fs.writeFileSync(this.context.swaggerUiInitializerJsFile, customise(initializerJs));
  }
}
