A CLI to extract pnpm package from workspace with local dependencies

### Features

- Hard copying the codebase without symlinks.
- Support npm install format.
- Exclude packages.

### Usage

Most users (me) use npx to run Genevy on the command line like this:

```bash
# pnpm
cd <workspace root>
pnpm dlx pnpm-better-pack @app/foo ./out

# npm
cd <workspace root>
npx pnpm-better-pack @app/foo ./out
```

### Options

The command line utility has several options.

```
Usage: pnpm-better-pack [options] <package name> <target directory>

Extract a package from workspace with local dependencies

Arguments:
  package name          The name of the package to extract from workspace
  target directory      Target path where the package will be extracted

Options:
  -V, --version         output the version number
  --prod, -P            Packages in `devDependencies` won't be installed (default: false)
  --dev, -D             Only `devDependencies` are installed (default: false)
  --out-local <folder>  A place where workspace dependencies be located (default: "packages")
  --no-optional         `optionalDependencies` are not installed
  --exclude <items>     Comma separated package name list (default: "")
  -h, --help            display help for command
```
