import fs from 'fs';
import crypto from 'crypto';
import { afterEach, beforeEach, vi, it, MockInstance, MockedFunction, expect } from 'vitest';

import tomlEnv, { stringifyTomlValues } from '../src';
import { describe } from 'node:test';

const testPath = 'test/.env.toml';

const tomlEnvKey = 'toml-env://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault?environment=development';

let envStub;
let logStub : MockInstance;

describe('vault config testing', () => {
    beforeEach(() => {
        vi.stubEnv('TOML_ENV_KEY', tomlEnvKey);
    });
      
    afterEach(() => {
        vi.unstubAllEnvs();
      
        if (logStub) {
            logStub.mockClear();
        }
    });
      
    it('logs when no path is set', () => {
        logStub = vi.spyOn(console, 'log');
        
        tomlEnv.config();
        expect(logStub).toBeCalled();
    });
      
    it('logs', () => {      
        logStub = vi.spyOn(console, 'log');
      
        tomlEnv.config({ path: testPath });
        expect(logStub).toBeCalled();
    });
      
    it('logs when testPath calls to .env.vault directly (interpret what the user meant)', () => {
        logStub = vi.spyOn(console, 'log');
      
        tomlEnv.config({ path: `${testPath}.vault` });
        expect(logStub).toBeCalled();
    });
      
    it('warns if TOML_ENV_KEY exists but .env.vault does not exist', () => {
        logStub = vi.spyOn(console, 'log');
      
        const existsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(false) // make .env.vault not exist
        tomlEnv.config({ path: testPath });
        expect(logStub).toBeCalled();
        existsSync.mockClear();
    });
      
    it('warns if TOML_ENV_KEY exists but .env.vault does not exist (set as array)', () => {
        logStub = vi.spyOn(console, 'log');
      
        const existsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(false) // make .env.vault not exist
        tomlEnv.config({ path: [testPath] });
        expect(logStub).toBeCalled();
        existsSync.mockClear();
    });
      
    it('returns parsed object', () => {
        const env = tomlEnv.config({ path: testPath });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });
      
    it('returns parsed object (set path as array)', () => {
        const env = tomlEnv.config({ path: [testPath] });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });
      
    it('returns parsed object (set path as multi-array)', () => {
        const env = tomlEnv.config({ path: ['test/.env.toml.local', 'test/.env.toml'] });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });

    it('returns parsed object (set path as array with .vault extension)', () => {      
        const env = tomlEnv.config({ path: [`${testPath}.vault`] });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });
      
    it('throws not found if .env.vault is empty', () => {
        const readFileSync = vi.spyOn(fs, 'readFileSync').mockReturnValue(''); // empty file
      
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('NOT_FOUND_TOML_ENV_ENVIRONMENT: Cannot locate environment TOML_ENV_VAULT_DEVELOPMENT in your .env.toml.vault file.');
            expect(e.code).toBe('NOT_FOUND_TOML_ENV_ENVIRONMENT');
        }
      
        readFileSync.mockClear();
    });
      
    it('throws missing data when somehow parsed badly', () => {
        const configTomlEnvStub = vi.spyOn(tomlEnv, 'configTomlEnv').mockReturnValue({ parsed: undefined });
        
        try {
            tomlEnv.config({ path: testPath })
        } catch (e) {
            expect(e.message).toBe('MISSING_DATA: Cannot parse tests/.env.vault for an unknown reason');
            expect(e.code).toBe('MISSING_DATA');
        }
        
        configTomlEnvStub.mockClear();
    });

    it('throws error when invalid formed TOML_ENV_KEY', () => {
        vi.stubEnv('TOML_ENV_KEY', 'invalid-format-non-uri-format');
      
        try {
            tomlEnv.config({ path: testPath })
        } catch (e) {
            expect(e.message).toBe('INVALID_TOML_ENV_KEY: Wrong format. Must be in valid uri format like toml-env://:key_1234@dotenvx.com/vault/.env.toml.vault?environment=development');
            expect(e.code).toBe('INVALID_TOML_ENV_KEY');
        }
    });
      
    it('throws error when invalid formed TOML_ENV_KEY that otherwise is not caught', () => {
        const urlStub = vi.spyOn(global, 'URL').mockImplementation(() => {
            throw new Error('uncaught error');
        });
      
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('uncaught error');
        }
      
        urlStub.mockClear();
    });
      
    it('throws error when TOML_ENV_KEY missing password', () => {
        vi.stubEnv('TOML_ENV_KEY', 'toml-env://username@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('INVALID_TOML_ENV_KEY: Missing key part');
            expect(e.code).toBe('INVALID_TOML_ENV_KEY');
        }
    });
      
    it('throws error when TOML_ENV_KEY missing environment', () => {
        vi.stubEnv('TOML_ENV_KEY', 'toml-env://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault');
        
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('INVALID_TOML_ENV_KEY: Missing environment part');
            expect(e.code).toBe('INVALID_TOML_ENV_KEY');
        }
    });

    it('when TOML_ENV_KEY is empty string falls back to .env file', () => {
        vi.stubEnv('TOML_ENV_KEY', '');
      
        const result = tomlEnv.config({ path: testPath });
        expect(result.parsed!.BASIC).toBe(JSON.stringify('basic'));

    });
      
    it('does not write over keys already in process.env by default', () => {
        const existing = 'bar';
        process.env.ALPHA = existing;
      
        const result = tomlEnv.config({ path: testPath });
      
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe('bar');
    });
      
    it('does write over keys already in process.env if override turned on', () => {
        const existing = 'bar';
        process.env.ALPHA = existing;
      
        const result = tomlEnv.config({ path: testPath, override: true });
      
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe(JSON.stringify('zeta'));
    });
      
    it('when TOML_ENV_KEY is passed as an option it successfully decrypts and injects', () => {
        vi.stubEnv('TOML_ENV_KEY', '');
      
        const result = tomlEnv.config({ path: testPath, TOML_ENV_KEY: tomlEnvKey });
      
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe(JSON.stringify('zeta'));
    });

    it('can write to a different object rather than process.env', () => {
        process.env.ALPHA = 'other'; // reset process.env
      
        logStub = vi.spyOn(console, 'log');
      
        const myObject = {};
      
        const result = tomlEnv.config({ path: testPath, processEnv: myObject });
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe('other');
        expect((myObject as any).ALPHA).toBe(JSON.stringify('zeta'));
    });
      
    it('logs when debug and override are turned on', () => {
        logStub = vi.spyOn(console, 'log');
      
        tomlEnv.config({ path: testPath, override: true, debug: true });
      
        expect(logStub).toBeCalled();
    });
      
    it('logs when debug is on and override is false', () => {
        logStub = vi.spyOn(console, 'log');
      
        tomlEnv.config({ path: testPath, override: false, debug: true });
      
        expect(logStub).toBeCalled();
    });

    it('raises an INVALID_TOML_ENV_KEY if key RangeError', () => {
        vi.stubEnv('TOML_ENV_KEY', 'toml-env://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('INVALID_TOML_ENV_KEY: It must be 64 characters long (or more)');
            expect(e.code).toBe('INVALID_TOML_ENV_KEY');
        }
    });
      
    it('raises an DECRYPTION_FAILED if key fails to decrypt payload', () => {
        vi.stubEnv('TOML_ENV_KEY', 'toml-env://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('DECRYPTION_FAILED: Please check your TOML_ENV_KEY');
            expect(e.code).toBe('DECRYPTION_FAILED');
        }
    });
      
    it('raises an DECRYPTION_FAILED if both (comma separated) keys fail to decrypt', () => {
        vi.stubEnv('TOML_ENV_KEY', 'toml-env://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development,toml-env://:key_c04959b64473e43dd60c56a536ef8481388528b16759736d89515c25eec69247@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
          tomlEnv.config({ path: testPath })
        } catch (e) {
            expect(e.message).toBe('DECRYPTION_FAILED: Please check your TOML_ENV_KEY');
            expect(e.code).toBe('DECRYPTION_FAILED');
        }
    });
      
    it('raises error if some other uncaught decryption error', () => {
        const decipherStub = vi.spyOn(crypto, 'createDecipheriv').mockImplementation(() => {
            throw new Error('uncaught error');
        });
      
        try {
            tomlEnv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('uncaught error');
        }

        decipherStub.mockClear();
    });
      
});