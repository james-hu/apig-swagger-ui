import { expect, test } from '@oclif/test';

import cmd = require('../src')

describe('apig-swagger-ui', () => {
  test
  .stdout()
  .do(() => cmd.run(['--help']))
  .exit(0) // I'm not sure why this is required as it's not for non-help successful command invocations
  .it('shows help', ctx => {
    expect(ctx.stdout).to.contain('apig-swagger-ui');
    expect(ctx.stdout).to.contain('USAGE');
    expect(ctx.stdout).to.contain('ARGUMENTS');
    expect(ctx.stdout).to.contain('OPTIONS');
    expect(ctx.stdout).to.contain('DESCRIPTION');
    expect(ctx.stdout).to.contain('EXAMPLES');
  });
});
