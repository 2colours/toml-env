import { Encoding } from "crypto";

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
    path?: string;
}

export interface DotenvKeyOptions {
    DOTENV_KEY?: string;
}

export interface TomlEnvOptions extends VaultPathOptions, ConfigVaultOptions, DotenvKeyOptions {
    encoding?: Encoding;
}