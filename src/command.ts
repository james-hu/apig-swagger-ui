import micromatch = require('micromatch');
import ApigSwaggerUi = require('.');
import { APIGateway } from 'aws-sdk';

export const execute: (options: typeof ApigSwaggerUi.Options) => Promise<any> = async options => {
    const apig = new APIGateway({region: options.flags.region});

    const domainNames = (await apig.getDomainNames({limit: 500}).promise())?.items;
    if (domainNames != null) {
        for (let domainName of domainNames) {
            const supportHttps = domainName.securityPolicy != null;
            const mappings = (await apig.getBasePathMappings({domainName: domainName.domainName!, limit: 500}).promise())?.items;
            if (mappings != null) {
                for (let mapping of mappings) {
                    const basePath = mapping.basePath === '(none)' ? '' : mapping.basePath;
                    const domainAndBasePath = `${domainName.domainName}/${basePath}`;
                    const shouldInclude = micromatch.isMatch(domainAndBasePath, options.flags.include);
                    const shouldExclude = options.flags.exclude == null ? false : micromatch.isMatch(domainAndBasePath, options.flags.exclude);
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
                        //console.log(spec);
                    }
                }
            }
        }
    }
    console.log('Done.');
    return;
};