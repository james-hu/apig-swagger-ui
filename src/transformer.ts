import { Configuration } from './configuration';
import { OpenAPIV3, OpenAPIV2 } from "openapi-types";
import { APIGateway } from 'aws-sdk';

export type OpenApiDocument = OpenAPIV3.Document & {
    securityDefinitions?: OpenAPIV2.Document['securityDefinitions'];
}

type OpenApiDocumentPathItemObject = OpenAPIV3.Document['paths']['key'];
type OpenApiDocumentOperationObject = Exclude<OpenApiDocumentPathItemObject['get'], undefined>;
type OpenApiDocumentReferenceOrParameterObject = Exclude<OpenApiDocumentOperationObject['parameters'], undefined>[0];

export class Transformer {
    constructor(private config: Configuration) {}

    /**
     * Hack the OpenAPI spec for various purposes.
     * This method modifies the first argument.
     * @param doc the input that will be modified
     * @param domainNameObj API Gateway DomainName
     * @param basePathMapping API Gateway BasePathMapping
     */
    transform(doc: OpenApiDocument, domainNameObj: APIGateway.DomainName, basePathMapping: APIGateway.BasePathMapping): void {
        // remove unnecessary basePath variable
        if (doc.servers && doc.servers.length == 1) {
            const server = doc.servers[0];
            const defaultBasePath = server.variables?.basePath?.default;
            if (defaultBasePath && server.url) {
                server.url = (server.url as string).replace('/{basePath}', defaultBasePath);
                if (Object.keys(server.variables!).length == 1) {
                    delete server.variables;
                }
            }
        }

        // if x-api-key header has been ever mentioned
        let xApiKeyParameterFound = false;
        Object.entries(doc.paths).forEach(([_, pathItem]) => {
            Object.entries(pathItem)
                .map(([key, value]) => { // not all values are actually OperationObject
                    const operationObject = value as OpenApiDocumentOperationObject;
                    if (['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(key)) {
                        if (operationObject.parameters == null) {
                            operationObject.parameters = [];
                        }
                        return operationObject
                    }
                    return null;
                })
                .filter(value => value != null)   // a valid OperationObject with parameters
                .forEach(operationObj => {
                    operationObj!.parameters = operationObj!.parameters!.filter(refOrParam => {
                        const param = refOrParam as Extract<OpenApiDocumentReferenceOrParameterObject, {name: string; in: string}>;
                        if (param.name && param.name.toLowerCase() === 'x-api-key' && param.in === 'header') {
                            xApiKeyParameterFound = true;
                            return false;
                        } else {
                            return true;
                        }
                    })
                })
        });
        if (xApiKeyParameterFound && !doc.components?.securitySchemes?.api_key) {
            const apiKeyDef = {
                "type": "apiKey",
                "name": "x-api-key",
                "in": "header"
            };

            if (!doc.components) {
                doc.components = {};
            }
            if (!doc.components.securitySchemes) {
                doc.components.securitySchemes = {};
            }
            if (!doc.components.securitySchemes.api_key) {
                doc.components.securitySchemes.api_key = apiKeyDef as any;
            }
        }

        // api_key in securityDefinitions (is this a V2 compatibility thing?)
        if (doc.components?.securitySchemes?.api_key && !doc.securityDefinitions) {
            doc.securityDefinitions = {
                api_key: doc.components?.securitySchemes?.api_key as unknown as any,
            }
        }


        // ensure 
        
    }
}