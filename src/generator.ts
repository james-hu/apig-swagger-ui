import * as fs from 'fs-extra';
import * as path from 'path';
import * as SwaggerUIDist from 'swagger-ui-dist';
import micromatch = require('micromatch');
import ApigSwaggerUi = require('.');
import { APIGateway } from 'aws-sdk';
import { HomePage } from './home-page';
import { Configuration } from './configuration';
import { Transformer } from './transformer';

export class Generator {
    constructor(protected config: Configuration) {}

    async generate() {
        const homePage = new HomePage(this.config);
        const transformer = new Transformer(this.config);

        const apig = new APIGateway({region: this.config.options.flags.region});
        const domainNameObjects = (await apig.getDomainNames({limit: 500}).promise())?.items;
        if (domainNameObjects != null) {
            this.config.info(`Generating files to: ${this.config.options.args.path}`);
            const copySwaggerUiPromise = this.copySwaggerUi();
            await this.emptyApiFolder();
            for (let domainNameObj of domainNameObjects) {
                const domainName = domainNameObj.domainName!
                this.config.debug(`Found custom domain: ${domainName}`);
                const supportHttps = domainNameObj.securityPolicy != null;
                const mappings = (await apig.getBasePathMappings({domainName, limit: 500}).promise())?.items;
                if (mappings != null) {
                    await this.emptyDomainFolder(domainName);
                    let hasSpecFileWritten = false;
                    for (let mapping of mappings) {
                        const basePath = mapping.basePath === '(none)' ? '' : mapping.basePath!;
                        const domainAndBasePath = `${domainName}/${basePath}`;
                        const shouldInclude = micromatch.isMatch(domainAndBasePath, this.config.options.flags.include);
                        const shouldExclude = this.config.options.flags.exclude == null ? false : micromatch.isMatch(domainAndBasePath, this.config.options.flags.exclude);
                        this.config.debug(`Found API: ${domainAndBasePath}, shouldInclude=${shouldInclude}, shouldExclude=${shouldExclude}`);
                        if (shouldInclude && !shouldExclude) {
                            const baseUrl = `${supportHttps ? 'https' : 'http'}://${domainAndBasePath}`;
                            this.config.info(`Generating OpenAPI spec for: ${baseUrl}`);
                            const exported = await apig.getExport({
                                restApiId: mapping.restApiId!,
                                stageName: mapping.stage!,
                                exportType: 'oas30',
                                parameters: {
        
                                }
                            }).promise();
                            const specString = exported.body?.toString('utf8');
                            if (specString != null) {
                                const specFile = this.config.specFile(domainName, basePath);
                                let specObj = JSON.parse(specString);
                                // write original version, then transform, then write transformed version
                                fs.writeJson(specFile.replace(/\.json$/, '.apig.json'), specObj, {spaces: 2}).then(() => {
                                    transformer.transform(specObj, domainNameObj, mapping);
                                    return fs.writeJson(specFile, specObj, {spaces: 2});
                                });
                                hasSpecFileWritten = true;
                                homePage.addApi(baseUrl, this.config.pathSpecFile(domainName, basePath));
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
        return;
    }

    protected async copySwaggerUi() {
        const swaggerUiDestDir = this.config.swaggerUiFolder;
        await fs.emptyDir(swaggerUiDestDir);
        return fs.copy(SwaggerUIDist.getAbsoluteFSPath(), swaggerUiDestDir,
                       {filter: (src, dest) => {
                            return ['.md', 'package.json', 'index.js', 'absolute-path.js']
                                    .find(suffix => src.endsWith(suffix)) == null;
                       },
        });
    }
    
    protected async emptyApiFolder() {
        return fs.emptyDir(this.config.apiFolder);
    }
    protected async emptyDomainFolder(domain: string) {
        return fs.emptyDir(this.config.domainFolder(domain));
    }
    protected async removeDomainFolder(domain: string) {
        return fs.remove(this.config.domainFolder(domain));
    }
    
}
