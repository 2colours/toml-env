# toml-env [![NPM version](https://img.shields.io/npm/v/@2colours/toml-env.svg?style=flat_square)](https://www.npmjs.com/package/@2colours/toml-env) [![LICENSE](https://img.shields.io/github/license/2colours/toml-env.svg)](LICENSE)

### Node.JS dotenv-alike module using "env files" written in TOML

`toml-env` is a largely [dotenv](https://github.com/motdotla/dotenv)-compatible module written in Typescript that uses [TOML](https://toml.io) to load configuration from a `.env.toml` file and exposes them via the [`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env) and `process.envTyped` fields.

* [🌱 Install](#-install)
* [🏗️ Usage (.env.toml)](#-usage)
* [🌴 Multiple Environments 🆕](#-manage-multiple-environments) (**dotenv legacy**)
* [🚀 Deploying (.env.vault) 🆕](#-deploying) (**dotenv legacy**)
* [📖 Docs](#-documentation)
* [👏 Prior art and thanks](#-prior-art-and-thanks)

## 🌱 Install

```sh
# using npm
npm install @2colours/toml-env --save
# using yarn
yarn add @2colours/toml-env
```

## 🏗️ Usage

Create a `.env.toml` file in the folder where you start the entry point of your project (typically the root of the repository). This file should be a valid TOML file so strings should adhere to [TOML's allowed string notations](https://toml.io/en/v1.0.0#string).

```toml
REMOTE_HOST='42.42.42.42'
API_TOKEN="bla42bla42bla42_"
```

There are plenty of ways to load `toml-env` with the default configuration:

```sh
# using Node's --require flag, assuming index.js as entry point
node -r @2colours/toml-env/config index.js
```

```javascript
// within the source code, as soon as possible
require('@2colours/toml-env').config();
console.log(process.env.REMOTE_HOST);
```

.. or using ES6

```javascript
// within the source code, as soon as possible
import '@2colours/toml-env/config';
```

After the loading of the package, the values from `.env.toml` are exposed under `process.env` and `process.envTyped`. The difference is that in `process.env` all values are stringified (TOML allows advanced types like dates, tables and arrays), while `process.envTyped` preserves the types using the native JS equivalents.

### Format and parsing

`toml-env` uses a fully-fledged [TOML](https://toml.io) parser to process the content of the configuration file. Everything can be used, within the limits of Javascript types. For more information, consult [the underlying TOML parser library](https://github.com/squirrelchat/smol-toml).

### Preload

You can use the `--require` (`-r`) [command line option](https://nodejs.org/api/cli.html#-r---require-module) to preload `toml-env`. By doing this, you do not need to require and load `toml-env` in your application code.

The configuration options below are supported as command line arguments in the format `toml_env_config_<option>=value`

```sh
$ node -r @2colours/toml-env/config your_script.js toml_env_config_path=/custom/path/to/.env.toml toml_env_config_debug=true
```

Additionally, you can use environment variables to set configuration options. Command line arguments will precede these.

```sh
$ TOML_ENV_CONFIG_<OPTION>=value node -r @2colours/toml-env/config your_script.js
```

```sh
$ TOML_ENV_CONFIG_ENCODING=latin1 TOML_ENV_CONFIG_DEBUG=true node -r @2colours/toml-env/config your_script.js toml_env_config_path=/custom/path/to/.env.toml
```

------------------------------

### Multiple Environments

*** Notice: currently, this functionality is largely relying on the original functionality of `dotenv`, therefore the following parts are verbatim taken from the README of `dotenv`. To migrate the files, the following steps are required: ***

1. Please make sure that your `.env.vault` file is valid according to TOML syntax (e.g. string quoting).
2. Instead of `DOTENV_NAMES`, use `TOML_ENV_NAMES` as the keys.
3. Rename the `.env.vault` file to `.env.toml.vault` or specify the path.

You need to manage your secrets across different environments and apply them as needed? Use a `.env.vault` file with a `DOTENV_KEY`.

### Deploying

You need to deploy your secrets in a cloud-agnostic manner? Use a `.env.vault` file. See [deploying `.env.vault` files](https://github.com/motdotla/dotenv/tree/master#-deploying).

## 🌴 Manage Multiple Environments

Use [dotenvx](https://github.com/dotenvx/dotenvx) or [dotenv-vault](https://github.com/dotenv-org/dotenv-vault).

### dotenvx

Run any environment locally. Create a `.env.ENVIRONMENT` file and use `--env-file` to load it. It's straightforward, yet flexible.

```bash
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run --env-file=.env.production -- node index.js
Hello production
> ^^
```

or with multiple .env files

```bash
$ echo "HELLO=local" > .env.local
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run --env-file=.env.local --env-file=.env -- node index.js
Hello local
```

[more environment examples](https://dotenvx.com/docs/quickstart/environments)

### dotenv-vault

Edit your production environment variables.

```bash
$ npx dotenv-vault open production
```

Regenerate your `.env.vault` file.

```bash
$ npx dotenv-vault build
```

*ℹ️  🔐 Vault Managed vs 💻 Locally Managed: The above example, for brevity's sake, used the 🔐 Vault Managed solution to manage your `.env.vault` file. You can instead use the 💻 Locally Managed solution. [Read more here](https://github.com/dotenv-org/dotenv-vault#how-do-i-use--locally-managed-dotenv-vault). Our vision is that other platforms and orchestration tools adopt the `.env.vault` standard as they did the `.env` standard. We don't expect to be the only ones providing tooling to manage and generate `.env.vault` files.*

<a href="https://github.com/dotenv-org/dotenv-vault#-manage-multiple-environments">Learn more at dotenv-vault: Manage Multiple Environments</a>

## 🚀 Deploying

Use [dotenvx](https://github.com/dotenvx/dotenvx) or [dotenv-vault](https://github.com/dotenv-org/dotenv-vault).

### dotenvx

Encrypt your secrets to a `.env.vault` file and load from it (recommended for production and ci).

```bash
$ echo "HELLO=World" > .env
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx encrypt
[dotenvx][info] encrypted to .env.vault (.env,.env.production)
[dotenvx][info] keys added to .env.keys (DOTENV_KEY_PRODUCTION,DOTENV_KEY_PRODUCTION)

$ DOTENV_KEY='<dotenv_key_production>' dotenvx run -- node index.js
[dotenvx][info] loading env (1) from encrypted .env.vault
Hello production
^ :-]
```

[learn more](https://github.com/dotenvx/dotenvx?tab=readme-ov-file#encryption)

### dotenv-vault

Encrypt your `.env.vault` file.

```bash
$ npx dotenv-vault build
```

Fetch your production `DOTENV_KEY`.

```bash
$ npx dotenv-vault keys production
```

Set `DOTENV_KEY` on your server.

```bash
# heroku example
heroku config:set DOTENV_KEY=dotenv://:key_1234…@dotenvx.com/vault/.env.vault?environment=production
```

That's it! On deploy, your `.env.vault` file will be decrypted and its secrets injected as environment variables – just in time.

*ℹ️ A note from [Mot](https://github.com/motdotla): Until recently, we did not have an opinion on how and where to store your secrets in production. We now strongly recommend generating a `.env.vault` file. It's the best way to prevent your secrets from being scattered across multiple servers and cloud providers – protecting you from breaches like the [CircleCI breach](https://techcrunch.com/2023/01/05/circleci-breach/). Also it unlocks interoperability WITHOUT native third-party integrations. Third-party integrations are [increasingly risky](https://coderpad.io/blog/development/heroku-github-breach/) to our industry. They may be the 'du jour' of today, but we imagine a better future.*

<a href="https://github.com/dotenv-org/dotenv-vault#-deploying">Learn more at dotenv-vault: Deploying</a>

----------------------------------------

## 📖 Documentation

`toml-env` exposes four functions:

* `config`
* `parse`
* `populate`
* `decrypt`

### Config

`config` will read your `.env.toml` file, parse the contents, assign it to `process.env` (all values stringified) and `process.envTyped` (all values as JS equivalents of TOML types) and return an Object with a `parsed` key containing the loaded content (either the stringified one or the typed one) or an `error` key if it failed.

```js
const result = tomlEnv.config();

if (result.error) {
  throw result.error;
}

console.log(result.parsed);
```

You can additionally, pass options to `config`.

#### Options

##### path

Default: `path.resolve(process.cwd(), '.env.toml')`

Specify a custom path if your file is located elsewhere.

```js
require('@2colours/toml-env').config({ path: '/custom/path/to/.env.toml' });
```

By default, `config` will look for a file called .env.toml in the current working directory.

Pass in multiple files as an array, and they will be parsed in order and combined into `process.env` and `process.envTyped` (or `option.processEnv` and `option.processEnvTyped` respectively, if set). By default, once a key has been set a value, instances of that same key in subsequent files are ignored. To override the value of a key with each subsequent file, set `options.override` to `true`. 

```js  
require('@2colours/toml-env').config({ path: ['.env.toml.local', '.env.toml'] });
```

##### encoding

Default: `utf8`

Specify the encoding of your file containing environment variables.

```js
require('@2colours/toml-env').config({ encoding: 'latin1' });
```

##### debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being set as you expect.

```js
require('@2colours/toml-env').config({ debug: process.env.DEBUG });
```

##### override

Default: `false`

Override any environment variables that have already been set on your machine with values from your .env file(s).

When providing multiple files in `options.path`, this option will also tell `toml-env` to override the value of a key upon encountering a duplicate definition.

```js
require('@2colours/toml-env').config({ override: true });
```

##### processEnv

Default: `process.env`

Specify an object to write your (stringified) secrets to. Defaults to `process.env` environment variables.

```js
const myObject = {};
require('@2colours/toml-env').config({ processEnv: myObject });

console.log(myObject); // values from .env.toml or .env.toml.vault live here now.
console.log(process.env); // this was not changed or written to
```

##### processEnvTyped

Default: `process.envTyped`

Specify an object to write your (typed) secrets to. Defaults to the monkey-patched `process.envTyped` property.

```js
const myObject = {};
require('@2colours/toml-env').config({ processEnvTyped: myObject });

console.log(myObject); // values from .env.toml or .env.toml.vault live here now.
console.log(process.envTyped); // this was not changed or written to
```

##### TOML_ENV_KEY

Default: `process.env.TOML_ENV_KEY`

Pass the `TOML_ENV_KEY` directly to config options. Defaults to looking for `process.env.TOML_ENV_KEY` environment variable. Note this only applies to decrypting `.env.toml.vault` files. If passed as null or undefined, or not passed at all, `toml-env` falls back to its traditional job of parsing a `.env.toml` file.

```js
require('@2colours/toml-env').config({ TOML_ENV_KEY: 'toml-env://:key_1234…@dotenvx.com/vault/.env.vault?environment=production' })
```

### Parse

The underlying TOML parser exposed as is. Unlike for `dotenv`, it only accepts strings. Please consult the [official repository](https://github.com/squirrelchat/smol-toml) for further information.

```js
const tomlEnv = require('@2colours/toml-env');
const rawData = `point = { x = 1, y = 2 }
names = ['Alfred', 'Dorothy', 'Kim']
`;
const config = tomlEnv.parse(rawData); // will return an object
// { point : { x : 1, y : 2}, names: ["Alfred", "Dorothy", "Kim"] }
```

### Populate

The engine which populates `process.env` and `process.envTyped` with the contents of your .env.toml file is available for use. It accepts a target, a source, and options. This is useful for power users who want to supply their own objects.

For example, customizing the source:

```js
const tomlEnv = require('@2colours/toml-env');
const parsed = { HELLO: 'world' };

tomlEnv.populate(process.env, parsed);

console.log(process.env.HELLO); // world
```

For example, customizing the source AND target:

```js
const tomlEnv = require('@2colours/toml-env');
const parsed = { HELLO: 'universe' };
const target = { HELLO: 'world' }; // empty object

tomlEnv.populate(target, parsed, { override: true, debug: true });

console.log(target); // { HELLO: 'universe' }
```

#### options

##### Debug

Default: `false`

Turn on logging to help debug why certain keys or values are not being populated as you expect.

##### override

Default: `false`

Override any environment variables that have already been set.

### Decrypt

The engine which decrypts the ciphertext contents of your .env.vault file is available for use. It accepts a ciphertext and a decryption key. It uses AES-256-GCM encryption.

For example, decrypting a simple ciphertext:

```js
const tomlEnv = require('@2colours/toml-env');
const ciphertext = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R';
const decryptionKey = 'ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00';

const decrypted = tomlEnv.decrypt(ciphertext, decryptionKey);

console.log(decrypted); // # development@v6\nALPHA="zeta"
```

## 👏 Prior art and thanks

The project is based on the idea, spec tests and source code of [dotenv](https://github.com/motdotla/dotenv), its licensing terms are included in [LICENSE](./LICENSE).

Special thanks to the creators of [smol-toml](https://github.com/squirrelchat/smol-toml), a modern, performant and reliable TOML 1.0 compatible parser written in Typescript.

[zaida04's tomlenv](https://github.com/zaida04/tomlenv) deserves to be mentioned as prior art. It has a different aim from `toml-env`:
- `tomlenv` aims to contain only environment variables like `dotenv` and it only uses TOML segments for defining various environments in the same file
- `toml-env` aims to extend over core `dotenv` functionality by allowing structured data in the file containing secrets, filling the gap between arbitrary configuration files and environment variables while trying to retain good compatibility with `dotenv` where appropriate
