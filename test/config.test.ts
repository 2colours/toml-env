import fs from 'fs';
import os from 'os';
import path from 'path';

import tomlEnv from '../src';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const envTomlPath = 'test/.env.toml';
const envTomlLocalPath = 'test/.env.toml.local';

const mocks = vi.hoisted(() => {
  return {
    fs: {
      readFileSync: vi.fn().mockImplementation((...args: Parameters<typeof fs["readFileSync"]>) => fs.readFileSync(...args)),
    },
    os: {
      homedir: vi.fn().mockImplementation(() => os.homedir()),
    },
  }
});

vi.mock('fs', async (importOriginal) => {
  const module = await importOriginal<typeof import('fs')>();
  return { ...module, readFileSync: mocks.fs.readFileSync };
});

vi.mock('os', async (importOriginal) => {
  const module = await importOriginal<typeof import('os')>();
  return { ...module, homedir: mocks.os.homedir };
});

describe('general config options', () => {
    beforeEach(() => {
        delete process.env.BASIC; // reset
        mocks.fs.readFileSync.mockClear();
        mocks.os.homedir.mockClear();
    });

    it('takes string for path option', () => {
        const testPath = envTomlPath;
        const env = tomlEnv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe('basic');
    });

    it('takes array for path option', () => {
        const testPath = [envTomlPath];
        const env = tomlEnv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe('basic');
    });

    it('takes two or more files in the array for path option', () => {
        const testPath = [envTomlLocalPath, envTomlPath];
        const env = tomlEnv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe('local_basic');
        expect(process.env.BASIC).toBe('local_basic');
    });

    it('sets values from both .env.local and .env. first file key wins.', () => {
        delete process.env.SINGLE_QUOTES;

        const testPath = [envTomlLocalPath, envTomlPath];
        const env = tomlEnv.config({ path: testPath });

        // in both files - first file wins (.env.local)
        expect(env.parsed!.BASIC).toBe('local_basic');
        expect(process.env.BASIC).toBe('local_basic');

        // in .env.local only
        expect(env.parsed!.LOCAL).toBe('local');
        expect(process.env.LOCAL).toBe('local');

        // in .env only
        expect(env.parsed!.SINGLE_QUOTES).toBe('single_quotes');
        expect(process.env.SINGLE_QUOTES).toBe('single_quotes');
    });

    it('sets values from both .env.local and .env. but none is used as value existed in process.env.', () => {
        const testPath = [envTomlLocalPath, envTomlPath];
        process.env.BASIC = 'existing';

        const env = tomlEnv.config({ path: testPath });

        // does not override process.env
        expect(env.parsed!.BASIC).toBe('local_basic');
        expect(process.env.BASIC).toBe('existing');
    });

    it('takes URL for path option', () => {
        const envPath = path.resolve(__dirname, '.env.toml');
        const fileUrl = new URL(`file://${envPath}`);

        const env = tomlEnv.config({ path: fileUrl });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe('basic');

    });

    it('takes option for path along with home directory char ~', () => {
        mocks.fs.readFileSync.mockImplementationOnce(() => 'test="foo"');
        mocks.os.homedir.mockImplementationOnce(() => mockedHomedir);
        const mockedHomedir = '/Users/dummy';
        const testPath = '~/.env.toml';
        tomlEnv.config({ path: testPath });

        expect(mocks.fs.readFileSync).toBeCalledWith(path.join(mockedHomedir, '.env.toml'), expect.anything());
        expect(mocks.os.homedir).toBeCalled();
    });

    it('takes option for encoding', () => {
        mocks.fs.readFileSync.mockImplementationOnce(() => 'BASIC="basic"');

        const testEncoding = 'latin1';
        tomlEnv.config({ encoding: testEncoding });
        expect(mocks.fs.readFileSync).toBeCalledWith(expect.anything(), { encoding: testEncoding });
    });

    it('takes option for debug', () => {
        const logStub = vi.spyOn(console, 'log');

        tomlEnv.config({ debug: true });
        expect(logStub).toBeCalled();

        logStub.mockClear();
    });

    it('reads path with encoding, parsing output to process.env', () => {
        mocks.fs.readFileSync.mockImplementationOnce(() => 'BASIC="basic"');
        const parseStub = vi.spyOn(tomlEnv, 'parse').mockReturnValue({ BASIC: 'basic' });

        const res = tomlEnv.config({ path: envTomlPath });

        //expect(res.parsed).toStrictEqual(stringifyTomlValues({ BASIC: 'basic' }));
        //expect(parseStub).toBeCalled();
        expect(mocks.fs.readFileSync).toBeCalledTimes(1);

    });

    it('does not write over keys already in process.env', () => {
        const testPath = envTomlPath;
        const existing = 'bar';
        process.env.BASIC = existing;
        const env = tomlEnv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe(existing);

    });

    it('does write over keys already in process.env if override turned on', () => {
        const testPath = envTomlPath;
        const existing = 'bar';
        process.env.BASIC = existing;
        const env = tomlEnv.config({ path: testPath, override: true });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe('basic');

    });

    it('does not write over keys already in process.env if the key has a falsy value', () => {
        const testPath = envTomlPath;
        const existing = '';
        process.env.BASIC = existing;
        const env = tomlEnv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe('');

    });

    it('does write over keys already in process.env if the key has a falsy value but override is set to true', () => {
        const testPath = envTomlPath;
        const existing = '';
        process.env.BASIC = existing;
        const env = tomlEnv.config({ path: testPath, override: true });

        expect(env.parsed!.BASIC).toBe('basic');
        expect(process.env.BASIC).toBe('basic');
    });

    it('can write to a different object rather than process.env', () => {
        const testPath = envTomlPath;
        process.env.BASIC = 'other'; // reset process.env

        const myObject: NodeJS.ProcessEnv = {};
        const env = tomlEnv.config({ path: testPath, processEnv: myObject });

        expect(env.parsed!.BASIC).toBe('basic');
        console.log('logging', process.env.BASIC);
        expect(process.env.BASIC).toBe('other');
        expect(myObject.BASIC).toBe('basic');

    });

    it('returns parsed object', () => {
        const testPath = envTomlPath;
        const env = tomlEnv.config({ path: testPath });

        expect(env.error).toBeUndefined();
        expect(env.parsed!.BASIC).toBe('basic');

    });

    it('returns any errors thrown from reading file or parsing', () => {
        mocks.fs.readFileSync.mockImplementation(() => { throw new Error() });

        const env = tomlEnv.config();

        expect(env.error).toBeInstanceOf(Error);

        mocks.fs.readFileSync.mockClear();
    });

    it('logs any errors thrown from reading file or parsing when in debug mode', () => {

        const logStub = vi.spyOn(console, 'log');
        mocks.fs.readFileSync.mockImplementation(() => { throw new Error() });

        const env = tomlEnv.config({ debug: true });

        expect(logStub).toBeCalled();
        expect(env.error).toBeInstanceOf(Error);

        logStub.mockClear();
    });

    it('logs any errors parsing when in debug and override mode', () => {

        const logStub = vi.spyOn(console, 'log');

        tomlEnv.config({ debug: true, override: true });

        expect(logStub).toBeCalled();

    });

});
