import * as fs from 'fs-extra';
import * as path from 'path';
import * as SwaggerUIDist from 'swagger-ui-dist';
import micromatch = require('micromatch');
import ApigSwaggerUi = require('.');
import { APIGateway } from 'aws-sdk';
import { HomePage } from './home-page';
import { Configuration } from './configuration';

export class Generator {
    constructor(protected config: Configuration) {}

    async generate() {
        const homePage = new HomePage(this.config);

        const apig = new APIGateway({region: this.config.options.flags.region});
        const domainNameObjects = (await apig.getDomainNames({limit: 500}).promise())?.items;
        if (domainNameObjects != null) {
            const copySwaggerUiPromise = this.copySwaggerUi();
            await this.emptyApiFolder();
            for (let domainNameObj of domainNameObjects) {
                const domainName = domainNameObj.domainName!
                console.log(domainName);
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
                        if (shouldInclude && !shouldExclude) {
                            const baseUrl = `${supportHttps ? 'https' : 'http'}://${domainAndBasePath}`;
                            console.log(baseUrl);
                            const exported = await apig.getExport({
                                restApiId: mapping.restApiId!,
                                stageName: mapping.stage!,
                                exportType: 'oas30',
                                parameters: {
        
                                }
                            }).promise();
                            const spec = exported.body?.toString('utf8');
                            if (spec != null) {
                                this.writeSpecFile(spec, domainName, basePath);
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
        console.log('Done.');
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
    
    protected async writeSpecFile(specString: string, domain: string, basePath: string) {
        const file = this.config.specFile(domain, basePath);
        const specObject = JSON.parse(specString);

        // remove unnecessary basePath variable
        if (specObject.servers.length == 1) {
            const server = specObject.servers[0];
            const defaultBasePath = server.variables?.basePath?.default;
            if (defaultBasePath && server.url) {
                server.url = (server.url as string).replace('{basePath}', defaultBasePath)
                                                   .replace('//', '/');
                if (Object.keys(server.variables).length == 1) {
                    delete server.variables;
                }
            }
        }

        return fs.writeJson(file, specObject, {spaces: 2});
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
