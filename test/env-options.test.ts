import { vi, expect, describe, it, beforeAll, afterAll } from 'vitest';
import { TomlEnvOptions } from '../src/custom-types.js';
// preserve existing env
const e = process.env.DOTENV_CONFIG_ENCODING;
const p = process.env.DOTENV_CONFIG_PATH;
const d = process.env.DOTENV_CONFIG_DEBUG;
const o = process.env.DOTENV_CONFIG_OVERRIDE;
const dk = process.env.DOTENV_CONFIG_DOTENV_KEY;

// get fresh object for each test
async function options() {
    vi.resetModules();
    return (await import('../src/env-options.js')).default;
}

async function testOption(envVar: string, tmpVal: string, expected: TomlEnvOptions) {
    delete process.env[envVar];
    process.env[envVar] = tmpVal;

    expect(await options()).toStrictEqual(expected);

    delete process.env[envVar];
}

describe('env-options module', () => {
    beforeAll(() => {
        // returns empty object when no options set in process.env
        delete process.env.DOTENV_CONFIG_ENCODING;
        delete process.env.DOTENV_CONFIG_PATH;
        delete process.env.DOTENV_CONFIG_DEBUG;
        delete process.env.DOTENV_CONFIG_OVERRIDE;
        delete process.env.DOTENV_CONFIG_DOTENV_KEY;
    });

    afterAll(() => {
        // restore existing env
        process.env.DOTENV_CONFIG_ENCODING = e;
        process.env.DOTENV_CONFIG_PATH = p;
        process.env.DOTENV_CONFIG_DEBUG = d;
        process.env.DOTENV_CONFIG_OVERRIDE = o;
        process.env.DOTENV_CONFIG_DOTENV_KEY = dk;
    });

    it('sets nothing', async () => {
        expect(await options()).toStrictEqual({});
    });

    it('sets encoding option', async () => {
        await testOption('DOTENV_CONFIG_ENCODING', 'latin1', { encoding: 'latin1' });
    });

    it('sets path option', async () => {
        await testOption('DOTENV_CONFIG_PATH', '~/.env.test', { path: '~/.env.test' });
    });

    it('sets debug option', async () => {
        await testOption('DOTENV_CONFIG_DEBUG', 'true', { debug: true });
    });

    it('sets override option', async () => {
        await testOption('DOTENV_CONFIG_OVERRIDE', 'true', { override: true });
    });

    it('sets DOTENV_KEY option', async () => {
        await testOption('DOTENV_CONFIG_DOTENV_KEY', 'dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development', { DOTENV_KEY: 'dotenv://:key_ddcaa26504cd70a@dotenvx.com/vault/.env.vault?environment=development' });
    });
});