import path from 'node:path';
import fs from 'node:fs';

import { fetchFromDir } from '@pnpm/directory-fetcher';
import { createExportableManifest } from '@pnpm/exportable-manifest';
import { findPackages } from '@pnpm/fs.find-packages';
import { createIndexedPkgImporter } from '@pnpm/fs.indexed-pkg-importer';

/**
 * @param {string} packageName
 * @param {string} targetDirectory
 * @param {{ P: boolean; D: boolean; optional: boolean; outLocal: string; exclude: string[] }} options
 */
export async function main(packageName, targetDirectory, options) {
	const APP_ROOT = process.cwd();

	console.info('Exploring the current directory... 👀\n');

	const APP_WORKSPACE_PACKAGES = new Map(
		await findPackages(APP_ROOT).then((r) =>
			r.map((v) => [String(v.manifest.name), v]),
		),
	);

	if (!APP_WORKSPACE_PACKAGES.has(packageName)) {
		console.warn(
			`Error exporting "${packageName}" package. Package not found.`,
		);

		if (APP_WORKSPACE_PACKAGES.size) {
			console.warn(
				'Available packages in this directory:\n -',
				Array.from(APP_WORKSPACE_PACKAGES.keys()).join('\n - '),
			);
		} else {
			console.warn('No packages for export are found in this directory.');
		}

		return process.exit(1);
	}

	const excludeSet = new Set(options.exclude);
	const startAt = Date.now();
	const copyPackage = createPkgCopy();

	console.info(`🏷️  ${packageName}`);

	await copyPackage(packageName, targetDirectory, false, 0);

	console.info(`\nDone in ${((Date.now() - startAt) / 1000).toFixed(1)} seconds.`);

	function createPkgCopy() {
		const copied = new Set();
		const importPkg = createIndexedPkgImporter('copy');

		/**
		 * @param {string} pkgName
		 * @param {string} to
		 * @param {boolean} [isDeep]
		 * @param {number} [spaces]
		 */
		const copyPackage = async (pkgName, to, isDeep, spaces = 0) => {
			/**
			 * @param  {...any} args
			 */
			const print = (...args) => {
				let prefix = '    ';

				for (let idx = 2; idx < spaces; idx += 2) {
					prefix += ' ├ '
				}

				prefix += ' ├─';

				console.info(prefix, ...args)
			};

			if (copied.has(pkgName)) return true;
			if (excludeSet.has(pkgName)) {
				copied.add(pkgName);
				print(`${pkgName} (excluded)`);
				return false;
			}

			copied.add(pkgName);

			const meta = APP_WORKSPACE_PACKAGES.get(pkgName);

			if (!meta) return false;

			const { filesIndex } = await fetchFromDir(meta.dir, {
				includeOnlyPackageFiles: true,
			});

			const pkgPath = isDeep
				? path.join(to, options.outLocal, path.basename(meta.dir))
				: to;

			importPkg(pkgPath, {
				filesMap: filesIndex,
				force: true,
				resolvedFrom: 'local-dir',
			});

			const publishManifest = await createExportableManifest(
				pkgPath,
				meta.manifest,
				{ modulesDir: path.join(meta.dir, 'node_modules') },
			);

			if (!isDeep) {
				publishManifest.workspaces = [path.join(options.outLocal, '*')];
			} else {
				print(`${meta.manifest.name} ${meta.manifest.version}`);
			}

			fs.writeFileSync(
				path.resolve(pkgPath, 'package.json'),
				JSON.stringify(publishManifest, null, 2),
			);

			const { dependencies, devDependencies, optionalDependencies } =
				meta.manifest;

			if ((options.P || !options.D) && dependencies) {
				for (const deepDependency of Object.keys(dependencies)) {
					await copyPackage(deepDependency, to, true, spaces + 2);
				}
			}

			if ((options.D || !options.P) && devDependencies) {
				for (const deepDependency of Object.keys(devDependencies)) {
					await copyPackage(deepDependency, to, true, spaces + 2);
				}
			}

			if (!options.optional && optionalDependencies) {
				for (const deepDependency of Object.keys(optionalDependencies)) {
					await copyPackage(deepDependency, to, true, spaces + 2);
				}
			}

			return true;
		};

		return copyPackage;
	}
}
