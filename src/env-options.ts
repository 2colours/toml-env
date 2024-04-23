import { Encoding } from 'crypto';
import { TomlEnvOptions } from './custom-types.js';

const options: TomlEnvOptions = {};

if (process.env.TOML_ENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.TOML_ENV_CONFIG_ENCODING as Encoding;
}

if (process.env.TOML_ENV_CONFIG_PATH != null) {
  options.path = process.env.TOML_ENV_CONFIG_PATH;
}

if (process.env.TOML_ENV_CONFIG_DEBUG != null) {
  options.debug = !!process.env.TOML_ENV_CONFIG_DEBUG;
}

if (process.env.TOML_ENV_CONFIG_OVERRIDE != null) {
  options.override = !!process.env.TOML_ENV_CONFIG_OVERRIDE;
}

if (process.env.TOML_ENV_CONFIG_TOML_ENV_KEY != null) {
  options.TOML_ENV_KEY = process.env.TOML_ENV_CONFIG_TOML_ENV_KEY;
}

export default options;
