#!/usr/bin/env node
import { Command } from 'commander';
import { main } from '../scripts/pack.mjs';

const program = new Command();

program
	.name('pnpm-better-pack')
	.description('Better deploy a package from a workspace')
	.version('1.0.0');

program
	.description('Extract a package from workspace with local dependencies')
	.argument('<package name>', 'The name of the package to extract from workspace')
	.argument('<target directory>', 'Target path where the package will be extracted')
	.option('--prod, -P', 'Packages in `devDependencies` won\'t be installed', false)
	.option('--dev, -D', 'Only `devDependencies` are installed', false)
	.option('--out-local <folder>', 'A place where workspace dependencies be located', 'packages')
	.option('--no-optional', '`optionalDependencies` are not installed', false)
	.option('--exclude <items>', 'Comma separated package name list', commaSeparatedList, '')
	.action(main);

program.parse();

function commaSeparatedList(value) {
  return (value || '').split(',').map(v => v.trim()).filter(Boolean);
}
