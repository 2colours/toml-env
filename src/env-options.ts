import { Encoding } from "crypto";
import { TomlEnvOptions } from "./custom-types.js";

const options: TomlEnvOptions = {};

if (process.env.DOTENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING as Encoding;
}

if (process.env.DOTENV_CONFIG_PATH != null) {
  options.path = process.env.DOTENV_CONFIG_PATH;
}

if (process.env.DOTENV_CONFIG_DEBUG != null) {
  options.debug = !!process.env.DOTENV_CONFIG_DEBUG;
}

if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
  options.override = !!process.env.DOTENV_CONFIG_OVERRIDE;
}

if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
  options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
}

export default options;