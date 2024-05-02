import { Encoding } from 'crypto';
import { PathLike } from 'fs';
import { TomlPrimitive } from 'smol-toml';

export type ParsedToml = Record<string, TomlPrimitive>;

export class TomlEnvError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
    }
}

export interface PopulateOptions {
    debug?: boolean;
    override?: boolean;
}

export interface ConfigVaultOptions extends PopulateOptions {
    processEnv?: NodeJS.ProcessEnv;
    processEnvTyped?: ParsedToml;
}

export interface VaultPathOptions {
    path?: PathLike | PathLike[];
}

export interface TomlEnvKeyOptions {
    TOML_ENV_KEY?: string;
}

export interface TomlEnvOptions extends VaultPathOptions, ConfigVaultOptions, TomlEnvKeyOptions {
    encoding?: Encoding;
    typedOutput?: boolean;
}

declare global {
    namespace NodeJS {
        interface Process {
            envTyped: ParsedToml
        }
    }
}

process.envTyped = {};