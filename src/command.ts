import ApigSwaggerUi = require('.');
import { APIGateway } from 'aws-sdk';

export const execute: (options: ReturnType<ApigSwaggerUi["parse"]>) => Promise<void> = async options => {
    const apig = new APIGateway();

    const domainNames = (await apig.getDomainNames({limit: 500}).promise())?.items;
    if (domainNames != null) {
        for (let domainName of domainNames) {
            console.log("##################")
            console.log(domainName);
            const mappings = (await apig.getBasePathMappings({domainName: domainName.domainName!, limit: 500}).promise())?.items;
            if (mappings != null) {
                for (let mapping of mappings) {
                    console.log(mapping);
                    const exported = await apig.getExport({
                        restApiId: mapping.restApiId!,
                        stageName: mapping.stage!,
                        exportType: 'oas30',
                        parameters: {

                        }
                    }).promise();
                    const spec = exported.body?.toString('utf8');
                    console.log(spec);
                    
                }
            }
        }
    }
    console.log('Done.');
    return;
};