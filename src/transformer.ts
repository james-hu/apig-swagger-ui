/* eslint-disable unicorn/no-array-for-each */
import { Context } from './context';
import { OpenAPIV3, OpenAPIV2 } from 'openapi-types';
import { APIGateway } from 'aws-sdk';

export type OpenApiDocument = OpenAPIV3.Document & {
    securityDefinitions?: OpenAPIV2.Document['securityDefinitions'];
}

type OpenApiDocumentPathItemObject = OpenAPIV3.Document['paths']['key'];
type OpenApiDocumentOperationObject = Exclude<OpenApiDocumentPathItemObject['get'], undefined>;
type OpenApiDocumentReferenceOrParameterObject = Exclude<OpenApiDocumentOperationObject['parameters'], undefined>[0];
type OpenApiDocumentResponsesObject = Exclude<OpenApiDocumentOperationObject['responses'], undefined>;

const defaultStandardResponses: OpenApiDocumentResponsesObject = {
  200: {
    description: 'OK. The request has succeeded. The information returned with the response is dependent on the method used in the request.',
    content: {},
  },
  201: {
    description: 'Created. The request has been fulfilled and resulted in a new resource being created.',
    content: {},
  },
  202: {
    description: 'Accepted. The request has been accepted for processing, but the processing has not been completed.',
    content: {},
  },
  204: {
    description: 'No Content. The server has fulfilled the request but does not need to return an entity-body, and might want to return updated metainformation.',
    content: {},
  },
  400: {
    description: 'Bad Request. The request could not be understood by the server due to malformed syntax. The client SHOULD NOT repeat the request without modifications.',
    content: {},
  },
  401: {
    description: 'Unauthorized. The request requires user authentication. The client MAY repeat the request with a suitable Authorization header field. If the request already included Authorization credentials, then the 401 response indicates that authorization has been refused for those credentials.',
    content: {},
  },
  403: {
    description: 'Forbidden. The server understood the request, but is refusing to fulfill it. Authorization will not help and the request SHOULD NOT be repeated.',
    content: {},
  },
  404: {
    description: 'Not Found. The server has not found anything matching the Request-URI.',
    content: {},
  },
  409: {
    description: 'Conflict. The request could not be completed due to a conflict with the current state of the resource.',
    content: {},
  },
  429: {
    description: 'Too Many Requests. The 429 status code indicates that the user has sent too many requests in a given amount of time ("rate limiting").',
    content: {},
  },
  500: {
    description: 'Internal Server Error. The server encountered an unexpected condition which prevented it from fulfilling the request.',
    content: {},
  },
  502: {
    description: 'Bad Gateway. The server, while acting as a gateway or proxy, received an invalid response from the upstream server it accessed in attempting to fulfill the request.',
    content: {},
  },
  503: {
    description: 'Service Unavailable. The server is currently unable to handle the request due to a temporary overloading or maintenance of the server. The implication is that this is a temporary condition which will be alleviated after some delay.',
    content: {},
  },
  504: {
    description: 'Gateway Timeout. The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server specified by the URI (e.g. HTTP, FTP, LDAP) or some other auxiliary server (e.g. DNS) it needed to access in attempting to complete the request.',
    content: {},
  },
};

export class Transformer {
  constructor(private context: Context) {}

  /**
   * Hack the OpenAPI spec for various purposes.
   * This method modifies the first argument.
   * @param doc the input that will be modified
   * @param _domainNameObj API Gateway DomainName
   * @param _basePathMapping API Gateway BasePathMapping
   * @param domainAndBasePath domain/path
   * @returns void
   */
  transform(doc: OpenApiDocument, _domainNameObj: APIGateway.DomainName, _basePathMapping: APIGateway.BasePathMapping, domainAndBasePath: string): void {
    // remove unnecessary basePath variable
    if (doc.servers && doc.servers.length === 1) {
      const server = doc.servers[0];
      const defaultBasePath = server.variables?.basePath?.default;
      if (defaultBasePath && server.url) {
        server.url = (server.url as string).replace('/{basePath}', defaultBasePath);
        this.context.debug(`Simplify server URL for ${domainAndBasePath}: ${server.url}`);
        if (Object.keys(server.variables!).length === 1) {
          delete server.variables;
        }
      }
    }

    // if x-api-key header has been ever mentioned
    let xApiKeyHeaderParameter: string|null = null;
    // if api_key query parameter has been ever mentioned
    let apiKeyQueryParameter: string|null = null;
    Object.entries(doc.paths).forEach(([path, pathItem]) => {
      // if "options" is not the only method, delete it because it must be there just for facilitating CORS
      if (Object.keys(pathItem).length > 1) {
        delete pathItem.options;
      }

      Object.entries(pathItem)
                .map(([key, value]) => { // not all values are actually OperationObject
                  const operationObject = value as OpenApiDocumentOperationObject;
                  if (['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(key)) {
                    const operationLabel = `${key.toUpperCase()} ${domainAndBasePath}${path}`;
                    // make sure there is a parameters array
                    if (operationObject.parameters == null) {
                      this.context.debug(`Add empty parameter list for ${operationLabel}`);
                      operationObject.parameters = [];
                    }
                    // make sure there is a responses array
                    if (operationObject.responses == null) {
                      this.context.debug(`Add default standard response list for ${operationLabel}`);
                      operationObject.responses = defaultStandardResponses;
                    } else {
                      Object.entries(operationObject.responses).forEach(([key, value]) => {
                        this.context.debug(`Enrich response ${key} for ${operationLabel}`);
                                operationObject.responses![key] = { ...defaultStandardResponses[key], ...value };
                      });
                    }
                    return operationObject;
                  }
                  return null;
                })
                .filter(value => value != null)   // a valid OperationObject with parameters
                .forEach(operationObj => {
                    operationObj!.parameters = operationObj!.parameters!.filter(refOrParam => {
                      const param = refOrParam as Extract<OpenApiDocumentReferenceOrParameterObject, {name: string; in: string}>;
                      if (param.name && param.name.toLowerCase() === 'x-api-key' && param.in === 'header') {
                        this.context.debug(`Use xApiKeyHeader (${param.name} in ${param.in}) authentication for ${domainAndBasePath}${path}`);
                        xApiKeyHeaderParameter = param.name;
                        operationObj!.security = operationObj!.security ?? [];
                        operationObj!.security.push({
                          xApiKeyHeader: [],
                        });
                        // return false;
                      }
                      if (param.name && param.name.toLowerCase() === 'api_key' && param.in === 'query') {
                        this.context.debug(`Use apiKeyParam (${param.name} in ${param.in}) authentication for ${domainAndBasePath}${path}`);
                        apiKeyQueryParameter = param.name;
                        operationObj!.security = operationObj!.security ?? [];
                        operationObj!.security.push({
                          apiKeyParam: [],
                        });
                        // return false;
                      }
                      return true;
                    });
                });
    });

    if (!doc.components) {
      doc.components = {};
    }
    if (!doc.components.securitySchemes) {
      doc.components.securitySchemes = {};
    }
    if (xApiKeyHeaderParameter && !doc.components?.securitySchemes?.xApiKeyHeader) {
      this.context.debug(`Add xApiKeyHeader authentication for ${domainAndBasePath}`);
      const apiKeyDef = {
        type: 'apiKey' as const,
        name: xApiKeyHeaderParameter,
        in: 'header',
        description: `API key in header ${xApiKeyHeaderParameter}`,
      };
      doc.components.securitySchemes.xApiKeyHeader = apiKeyDef;
    }
    if (apiKeyQueryParameter && !doc.components?.securitySchemes?.apiKeyParam) {
      this.context.debug(`Add apiKeyParam authentication for ${domainAndBasePath}`);
      const apiKeyDef = {
        type: 'apiKey' as const,
        name: apiKeyQueryParameter,
        in: 'query',
        description: `API key in query string parameter "${apiKeyQueryParameter}"`,
      };
      doc.components.securitySchemes.apiKeyParam = apiKeyDef;
    }

    // in securityDefinitions (is this a V2 compatibility thing?)
    this.context.debug(`Set securityDefinitions for ${domainAndBasePath}`);
    doc.securityDefinitions = {
      ...doc.securityDefinitions,
      ...doc.components?.securitySchemes as any,
    };
  }
}

