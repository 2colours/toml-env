import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import packageJson from '../package.json' assert { type: 'json' };
import { TomlPrimitive, parse } from 'smol-toml';
import { ConfigVaultOptions, DotenvKeyOptions, PopulateOptions, TomlEnvError, TomlEnvOptions, VaultPathOptions } from './custom-types.js';
import { URL } from 'url';

const version = packageJson.version;

export { parse };

export function _parseVault(options: TomlEnvOptions) {
  const vaultPath = _vaultPath(options);

  // Parse .env.vault
  const result = configDotenv({ path: vaultPath });
  if (!result.parsed) {
    throw new TomlEnvError(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`, 'MISSING_DATA');
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',');
  const length = keys.length;

  let decrypted;
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim();

      // Get instructions for decrypt
      const attrs = _instructions(result, key);

      // Decrypt
      decrypted = decrypt(attrs.ciphertext, attrs.key);

      break;
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error;
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return parse(decrypted);
}

function _log(message: string) {
  console.log(`[dotenv@${version}][INFO] ${message}`);
}

function _warn(message: string) {
  console.log(`[dotenv@${version}][WARN] ${message}`);
}

function _debug(message: string) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}

function _dotenvKey(options: DotenvKeyOptions) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options?.DOTENV_KEY?.length > 0) {
    return options.DOTENV_KEY;
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY?.length > 0) {
    return process.env.DOTENV_KEY;
  }

  // fallback to empty string
  return '';
}

function _instructions(result: { parsed: Record<string, TomlPrimitive>; error?: any; }, dotenvKey: WithImplicitCoercion<string>) {
  // Parse DOTENV_KEY. Format is a URI
  let uri: URL;
  try {
    uri = new URL(dotenvKey);
  } catch (error) {
    if (error.code == 'ERR_INVALID_URL') {
      throw new TomlEnvError('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development', 'INVALID_DOTENV_KEY');
    }

    throw error;
  }

  // Get decrypt key
  const key = uri.password;
  if (!key) {
    throw new TomlEnvError('INVALID_DOTENV_KEY: Missing key part', 'INVALID_DOTENV_KEY');
  }

  // Get environment
  const environment = uri.searchParams.get('environment');
  if (!environment) {
    throw new TomlEnvError('INVALID_DOTENV_KEY: Missing environment part', 'INVALID_DOTENV_KEY');
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
  const ciphertext = JSON.stringify(result.parsed[environmentKey]); // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    throw new TomlEnvError(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`, 'NOT_FOUND_DOTENV_ENVIRONMENT');
  }

  return { ciphertext, key };
}

function _vaultPath(options: VaultPathOptions) {
  let possibleVaultPath = null;

  if (options?.path?.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`;
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`;
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault');
  }

  return fs.existsSync(possibleVaultPath) ? possibleVaultPath : null;
}

function _resolveHome(envPath: string) {
  return envPath[0] == '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}

export function _configVault(options: ConfigVaultOptions) {
  _log('Loading env from encrypted .env.vault');

  const parsed = _parseVault(options);

  let processEnv = process.env;
  if (options?.processEnv != null) {
    processEnv = options.processEnv;
  }

  populate(processEnv, parsed, options);

  return { parsed };
}

export function configDotenv(options: TomlEnvOptions) {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  let encoding: BufferEncoding = 'utf8';
  const debug = Boolean(options?.debug);

  if (options?.encoding) {
    encoding = options.encoding;
  } else {
    if (debug) {
      _debug('No encoding is specified. UTF-8 is used by default');
    }
  }

  const optionPaths = options?.path ? [options.path].flat().map(_resolveHome) : [dotenvPath];

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError: unknown;
  const parsedAll = {};
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = parse(fs.readFileSync(path, { encoding }));

      populate(parsedAll, parsed, options);
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path} ${e.message}`);
      }
      lastError = e;
    }
  }

  let processEnv = process.env;
  if (options?.processEnv != null) {
    processEnv = options.processEnv;
  }

  populate(processEnv, parsedAll, options);

  if (lastError) {
    return { parsed: parsedAll, error: lastError };
  } else {
    return { parsed: parsedAll };
  }
}

// Populates process.env from .env file
export function config(options: TomlEnvOptions) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length == 0) {
    return configDotenv(options);
  }

  const vaultPath = _vaultPath(options);

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);

    return configDotenv(options);
  }

  return _configVault(options);
}

export function decrypt(encrypted: WithImplicitCoercion<string>, keyStr: string) {
  const key = Buffer.from(keyStr.slice(-64), 'hex');
  let ciphertext = Buffer.from(encrypted, 'base64');

  const nonce = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(-16);
  ciphertext = ciphertext.subarray(12, -16);

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    aesgcm.setAuthTag(authTag);
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
  } catch (error) {
    const isRange = error instanceof RangeError;
    const invalidKeyLength = error.message == 'Invalid key length';
    const decryptionFailed = error.message == 'Unsupported state or unable to authenticate data';

    if (isRange || invalidKeyLength) {
      throw new TomlEnvError('INVALID_DOTENV_KEY: It must be 64 characters long (or more)', 'INVALID_DOTENV_KEY');
    } else if (decryptionFailed) {
      throw new TomlEnvError('DECRYPTION_FAILED: Please check your DOTENV_KEY', 'DECRYPTION_FAILED');
    } else {
      throw error;
    }
  }
}

// Populate process.env with parsed values
export function populate(processEnv: NodeJS.ProcessEnv, parsed: Record<string, TomlPrimitive>, options: PopulateOptions = {}) {
  const { debug, override } = options;

  if (typeof parsed != 'object') {
    throw new TomlEnvError('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate', 'OBJECT_REQUIRED');
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override) {
        processEnv[key] = JSON.stringify(parsed[key]);
        if (debug) {
          _debug(`"${key}" is already defined and WAS overwritten`);
        }
      } else {
        if (debug) {
          _debug(`"${key}" is already defined and was NOT overwritten`);
        }
      }
    } else {
      processEnv[key] = JSON.stringify(parsed[key]);
    }
  }
}

export default {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
};
