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


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage

<!-- usage -->
```sh-session
$ npm install -g apig-swagger-ui
$ apig-swagger-ui COMMAND
running command...
$ apig-swagger-ui (-v|--version|version)
apig-swagger-ui/1.0.1 darwin-x64 node-v12.18.2
$ apig-swagger-ui --help [COMMAND]
USAGE
  $ apig-swagger-ui COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->

<!-- commandsstop -->
