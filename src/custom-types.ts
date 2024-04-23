import { Encoding } from 'crypto';
import { PathLike } from 'fs';

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
}

export interface VaultPathOptions {
    path?: PathLike | PathLike[];
}

export interface TomlEnvKeyOptions {
    TOML_ENV_KEY?: string;
}

export interface TomlEnvOptions extends VaultPathOptions, ConfigVaultOptions, TomlEnvKeyOptions {
    encoding?: Encoding;
}