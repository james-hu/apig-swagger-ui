apig-swagger-ui
===============

Command line tool for generating OpenAPI spec and SwaggerUI from AWS API Gateway

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/apig-swagger-ui.svg)](https://npmjs.org/package/apig-swagger-ui)
[![Downloads/week](https://img.shields.io/npm/dw/apig-swagger-ui.svg)](https://npmjs.org/package/apig-swagger-ui)
[![License](https://img.shields.io/npm/l/apig-swagger-ui.svg)](https://github.com/james-hu/apig-swagger-ui/blob/master/package.json)

Typical usage:

```sh-session
$ npx apig-swagger-ui -r ap-southeast-2 -s
npx: installed 92 in 9.635s
Generating files to: api-doc
Generating OpenAPI spec for: https://api.dev1.insights.example.domain.com/analytics
Generating OpenAPI spec for: https://boi.uat1.env.example.domain.com/statement
Generating OpenAPI spec for: https://catalog.tst1.env.example.domain.com/
Generating OpenAPI spec for: https://cis.uat1.env.example.domain.com/
Generating OpenAPI spec for: https://leads.uat1.env.example.domain.com/v2
Generating OpenAPI spec for: https://leads.uat1.env.example.domain.com/inbound
Generating OpenAPI spec for: https://rulehub.uat1.env.example.domain.com/citizenship
Generating OpenAPI spec for: https://toggle-feature-flag-datadog.uat1.env.example.domain.com/
Generating OpenAPI spec for: https://v1pde.uat1.env.example.domain.com/key
Local server started. Ctrl-C to stop. Access URL: http://localhost:8001/
```

You can use `--include` and `--exclude` flags to specify which domain/path to include and which to exclude.

Necessary transformation/hacking is in place for making sure API spec looks good in Swagger UI.

Files generated are ready to be hosted as static website content in this structure:

* `api/` - folder containing all OpenAPI 3 spec files
  * `<domain>/` - folder containing OpenAPI 3 spec files under the same API Gateway custom domain name
    * `<basePath>.apig.json` - original OpenAPI 3 spec file exported from API Gateway
    * `<basePath>.json` - OpenAPI 3 spec file for SwaggerUI to consume. Necessary transformation/hacking has been applied for making sure the API spec looks good in Swagger UI.
* `swagger-ui/` - standard swagger-ui html/js/css/png 
* `index.html` - the home page / entry point

## Usage

You can have it installed globally like this:

```sh-session
$ npm install -g apig-swagger-ui
$ apig-swagger-ui ...
...
```

Or, you can just invoke it with `npx`:

```sh-session
$ npx apig-swagger-ui ...
...
```

By passing `-h` or `--help` to the command line, you can see the supported arguments and options.

## Arguments

```sh-session
  PATH  [default: api-doc] path for putting generated files
```

## Options

```sh-session
  -d, --debug            output debug messages
  -h, --help             show CLI help
  -i, --include=include  [default: */*,*/] custom domains and base path mappings to include
  -p, --port=port        [default: 8001] port number of the local http server
  -q, --quiet            no console output
  -r, --region=region    AWS region
  -s, --server           start a local http server and open a browser for viewing generated files
  -v, --version          show CLI version
  -x, --exclude=exclude  custom domains and base path mappings to exclude
```
