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
Clearing destination folder: api-doc
Generating OpenAPI spec for: https://api.dev1.insights.example.com/analytics
Generating OpenAPI spec for: https://boi.example.com/statement
Generating OpenAPI spec for: https://catalog.tst1.example.com/
Generating OpenAPI spec for: https://cis.example.com/
Generating OpenAPI spec for: https://leads.example.com/v2
Generating OpenAPI spec for: https://leads.example.com/inbound
Generating OpenAPI spec for: https://rulehub.example.com/citizenship
Generating OpenAPI spec for: https://toggle-feature-flag-datadog.example.com/
Generating OpenAPI spec for: https://v1pde.example.com/key
Local server started. Ctrl-C to stop. Access URL: http://localhost:8001/
```

Command line option `-r ap-southeast-2` specifies AWS region,
`-s` tells the command line to start up a local http server and then open the browser pointing to that local server for viewing generated website.

Multiple regions can be specified, in case you want to survey APIs in more than one region.

If you don't want to include all custom domains and APIs,
you can use `--include` and `--exclude` options to specify which domain/path to include and which to exclude.
Both of them can have multiple appearances.

For example, `--include 'leads*/*'` will make sure that only `https://leads.example.com/v2` and `https://leads.example.com/inbound` would be included.
Make sure you have the pattern enclosed with `'`.
`--include` is applied before `--exclude`, so that  `--include 'leads*/*' --exclude '*/v2'` will give you only `https://leads.example.com/inbound`.

To match an endpoint URL without a base path, use patterns like `*.example.*/` which matches `https://cis.example.com/`.
Please note that `*.example.*/*` does not match `https://cis.example.com/`.
This applies to both inclusion and exclusion.

Necessary transformation/hacking is in place for making sure API spec looks good in Swagger UI.
Feel free to let me know if you have any suggestions or needs, I would consider to add as new features.

Files generated are ready to be hosted as static website content in this structure:

* `api/` - folder containing all OpenAPI 3 spec files
  * `<domain>/` - folder containing OpenAPI 3 spec files under the same API Gateway custom domain name
    * `<basePath>.apig.json` - original OpenAPI 3 spec file exported from API Gateway
    * `<basePath>.json` - OpenAPI 3 spec file for SwaggerUI to consume. Necessary transformation/hacking has been applied for making sure the API spec looks good in Swagger UI.
* `swagger-ui/` - standard swagger-ui html/js/css/png 
* `index.html` - the home page / entry point

## Quick start

### In Node.js environment

You can have it installed globally like this:

```sh-session
$ npm install -g apig-swagger-ui
$ apig-swagger-ui ...
...
```

Or, you can just invoke the latest version with `npx`:

```sh-session
$ npx apig-swagger-ui ...
...
```

By passing `-h` or `--help` to the command line, you can see all supported arguments and options.

It can also be used in your own code, like this:

```javascript
import ApigSwaggerUi from 'apig-swagger-ui';

class Generator extends ApigSwaggerUi {
  argv: string[] = ['api-doc/prod', '-r', 'ap-southeast-2'];
}
await Generator.run();
```

### Install pre-built binary

*apig-swagger-ui* can be installed through Homebrew (brew install handy-common-utils/tap/apig-swagger-ui for Linux or MacOS),
snap (snap install apig-swagger-ui for Linux except WSL),
or manual download (https://github.com/james-hu/apig-swagger-ui/releases for Windows, Linux, and MacOS ).

## Manual

<!-- help start -->
```
USAGE
  $ apig-swagger-ui  [PATH] [-v] [-h] [-r <value>] [-i
    <value>] [-x <value>] [-s] [-p <value>] [-q] [-d] [-a <value>] [-m]

ARGUMENTS
  PATH  [default: api-doc] path for putting generated website files

FLAGS
  -a, --validator-url=<value>  custom validator URL, or "none" for disabling
                               validation
  -d, --debug                  output debug messages
  -h, --help                   Show CLI help.
  -i, --include=<value>...     [default: */*,*/] custom domains and base path
                               mappings to include
  -m, --enable-source-maps     include swagger-ui's source map files or not
  -p, --port=<value>           [default: 8001] port number of the local http
                               server for preview
  -q, --quiet                  no console output
  -r, --region=<value>...      AWS region
  -s, --server                 start a local http server and open a browser for
                               pre-viewing generated website
  -v, --version                Show CLI version.
  -x, --exclude=<value>...     custom domains and base path mappings to exclude

DESCRIPTION
  Command line tool for generating OpenAPI spec and Swagger UI from AWS API
  Gateway

  This command line tool can generate a static website that you can host for
  serving Swagger UI of your API Gateway APIs.

  It generates website files locally and can optionally launch a local server
  for you to preview.

  Before running this tool, you need to log into your AWS account (through
  command line like aws, saml2aws, okta-aws, etc.) first.

  Please note that only APIs that have been mapped to custom domains will be
  included in the website generated.

EXAMPLES
  $ apig-swagger-ui -r ap-southeast-2 -s

  $ apig-swagger-ui -r ap-southeast-2 -r us-east-1 -s -i '*uat1*/*' -x 'datahub.uat1.*/*'

  $ apig-swagger-ui -r ap-southeast-2 -s -i '*/key*' -i 'boi.stg.*/*' path/to/api-doc/directory
```

<!-- help end -->

## Contributing

Development:

- Run for test: `./bin/run ...`
- Release: `npm version patch && npm publish && git push --tags`

Please ignore `main.go` and `go.mod` files.
They exist only because we are using *goreleaser*.

To build binaries for arm64 processors, you need a Linux machine, with binfmt and ldid installed:
- https://hub.docker.com/r/tonistiigi/binfmt
- https://stackoverflow.com/a/27769297

To debug goreleaser:

```GITHUB_TOKEN=<the-token> goreleaser release --skip-validate --rm-dist --debug```