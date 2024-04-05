import fs from 'fs';
import crypto from 'crypto';
import { afterEach, beforeEach, vi, it, MockInstance, MockedFunction, expect } from 'vitest';

import dotenv, { stringifyTomlValues } from '../src';
import { describe } from 'node:test';

const testPath = 'test/.env';

const dotenvKey = 'dotenv://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault?environment=development';

let envStub;
let logStub : MockInstance;

describe('vault config testing', () => {
    beforeEach(() => {
        vi.stubEnv('DOTENV_KEY', dotenvKey);
    });
      
    afterEach(() => {
        vi.unstubAllEnvs();
      
        if (logStub) {
            logStub.mockClear();
        }
    });
      
    it('logs when no path is set', () => {
        logStub = vi.spyOn(console, 'log');
        
        dotenv.config();
        expect(logStub).toBeCalled();
    });
      
    it('logs', () => {      
        logStub = vi.spyOn(console, 'log');
      
        dotenv.config({ path: testPath });
        expect(logStub).toBeCalled();
    });
      
    it('logs when testPath calls to .env.vault directly (interpret what the user meant)', () => {
        logStub = vi.spyOn(console, 'log');
      
        dotenv.config({ path: `${testPath}.vault` });
        expect(logStub).toBeCalled();
    });
      
    it('warns if DOTENV_KEY exists but .env.vault does not exist', () => {
        logStub = vi.spyOn(console, 'log');
      
        const existsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(false) // make .env.vault not exist
        dotenv.config({ path: testPath });
        expect(logStub).toBeCalled();
        existsSync.mockClear();
    });
      
    it('warns if DOTENV_KEY exists but .env.vault does not exist (set as array)', () => {
        logStub = vi.spyOn(console, 'log');
      
        const existsSync = vi.spyOn(fs, 'existsSync').mockReturnValue(false) // make .env.vault not exist
        dotenv.config({ path: [testPath] });
        expect(logStub).toBeCalled();
        existsSync.mockClear();
    });
      
    it('returns parsed object', () => {
        const env = dotenv.config({ path: testPath });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });
      
    it('returns parsed object (set path as array)', () => {
        const env = dotenv.config({ path: [testPath] });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });
      
    it('returns parsed object (set path as multi-array)', () => {
        const env = dotenv.config({ path: ['test/.env.local', 'test/.env'] });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });

    it('returns parsed object (set path as array with .vault extension)', () => {      
        const env = dotenv.config({ path: [`${testPath}.vault`] });
        expect(env.parsed).toStrictEqual(stringifyTomlValues({ ALPHA: 'zeta' }));
    });
      
    it('throws not found if .env.vault is empty', () => {
        const readFileSync = vi.spyOn(fs, 'readFileSync').mockReturnValue(''); // empty file
      
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment DOTENV_VAULT_DEVELOPMENT in your .env.vault file.');
            expect(e.code).toBe('NOT_FOUND_DOTENV_ENVIRONMENT');
        }
      
        readFileSync.mockClear();
    });
      
    it('throws missing data when somehow parsed badly', () => {
        const configDotenvStub = vi.spyOn(dotenv, 'configDotenv').mockReturnValue({ parsed: undefined });
        
        try {
            dotenv.config({ path: testPath })
        } catch (e) {
            expect(e.message).toBe('MISSING_DATA: Cannot parse tests/.env.vault for an unknown reason');
            expect(e.code).toBe('MISSING_DATA');
        }
        
        configDotenvStub.mockClear();
    });

    it('throws error when invalid formed DOTENV_KEY', () => {
        vi.stubEnv('DOTENV_KEY', 'invalid-format-non-uri-format');
      
        try {
            dotenv.config({ path: testPath })
        } catch (e) {
            expect(e.message).toBe('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development');
            expect(e.code).toBe('INVALID_DOTENV_KEY');
        }
    });
      
    it('throws error when invalid formed DOTENV_KEY that otherwise is not caught', () => {
        const urlStub = vi.spyOn(global, 'URL').mockImplementation(() => {
            throw new Error('uncaught error');
        });
      
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('uncaught error');
        }
      
        urlStub.mockClear();
    });
      
    it('throws error when DOTENV_KEY missing password', () => {
        vi.stubEnv('DOTENV_KEY', 'dotenv://username@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('INVALID_DOTENV_KEY: Missing key part');
            expect(e.code).toBe('INVALID_DOTENV_KEY');
        }
    });
      
    it('throws error when DOTENV_KEY missing environment', () => {
        vi.stubEnv('DOTENV_KEY', 'dotenv://:key_ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00@dotenvx.com/vault/.env.vault');
        
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('INVALID_DOTENV_KEY: Missing environment part');
            expect(e.code).toBe('INVALID_DOTENV_KEY');
        }
    });

    it('when DOTENV_KEY is empty string falls back to .env file', () => {
        vi.stubEnv('DOTENV_KEY', '');
      
        const result = dotenv.config({ path: testPath });
        expect(result.parsed!.BASIC).toBe(JSON.stringify('basic'));

    });
      
    it('does not write over keys already in process.env by default', () => {
        const existing = 'bar';
        process.env.ALPHA = existing;
      
        const result = dotenv.config({ path: testPath });
      
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe('bar');
    });
      
    it('does write over keys already in process.env if override turned on', () => {
        const existing = 'bar';
        process.env.ALPHA = existing;
      
        const result = dotenv.config({ path: testPath, override: true });
      
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe(JSON.stringify('zeta'));
    });
      
    it('when DOTENV_KEY is passed as an option it successfully decrypts and injects', () => {
        vi.stubEnv('DOTENV_KEY', '');
      
        const result = dotenv.config({ path: testPath, DOTENV_KEY: dotenvKey });
      
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe(JSON.stringify('zeta'));
    });

    it('can write to a different object rather than process.env', () => {
        process.env.ALPHA = 'other'; // reset process.env
      
        logStub = vi.spyOn(console, 'log');
      
        const myObject = {};
      
        const result = dotenv.config({ path: testPath, processEnv: myObject });
        expect(result.parsed!.ALPHA).toBe(JSON.stringify('zeta'));
        expect(process.env.ALPHA).toBe('other');
        expect((myObject as any).ALPHA).toBe(JSON.stringify('zeta'));
    });
      
    it('logs when debug and override are turned on', () => {
        logStub = vi.spyOn(console, 'log');
      
        dotenv.config({ path: testPath, override: true, debug: true });
      
        expect(logStub).toBeCalled();
    });
      
    it('logs when debug is on and override is false', () => {
        logStub = vi.spyOn(console, 'log');
      
        dotenv.config({ path: testPath, override: false, debug: true });
      
        expect(logStub).toBeCalled();
    });

    it('raises an INVALID_DOTENV_KEY if key RangeError', () => {
        vi.stubEnv('DOTENV_KEY', 'dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('INVALID_DOTENV_KEY: It must be 64 characters long (or more)');
            expect(e.code).toBe('INVALID_DOTENV_KEY');
        }
    });
      
    it('raises an DECRYPTION_FAILED if key fails to decrypt payload', () => {
        vi.stubEnv('DOTENV_KEY', 'dotenv://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('DECRYPTION_FAILED: Please check your DOTENV_KEY');
            expect(e.code).toBe('DECRYPTION_FAILED');
        }
    });
      
    it('raises an DECRYPTION_FAILED if both (comma separated) keys fail to decrypt', () => {
        vi.stubEnv('DOTENV_KEY', 'dotenv://:key_2c4d267b8c3865f921311612e69273666cc76c008acb577d3e22bc3046fba386@dotenvx.com/vault/.env.vault?environment=development,dotenv://:key_c04959b64473e43dd60c56a536ef8481388528b16759736d89515c25eec69247@dotenvx.com/vault/.env.vault?environment=development');
      
        try {
          dotenv.config({ path: testPath })
        } catch (e) {
            expect(e.message).toBe('DECRYPTION_FAILED: Please check your DOTENV_KEY');
            expect(e.code).toBe('DECRYPTION_FAILED');
        }
    });
      
    it('raises error if some other uncaught decryption error', () => {
        const decipherStub = vi.spyOn(crypto, 'createDecipheriv').mockImplementation(() => {
            throw new Error('uncaught error');
        });
      
        try {
            dotenv.config({ path: testPath });
        } catch (e) {
            expect(e.message).toBe('uncaught error');
        }

        decipherStub.mockClear();
    });
      
});