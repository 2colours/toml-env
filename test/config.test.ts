import fs from 'fs';
import os from 'os';
import path from 'path';

import dotenv, { stringifyTomlValues } from '../src';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
        const testPath = 'test/.env';
        const env = dotenv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('basic'));
    });

    it('takes array for path option', () => {
        const testPath = ['test/.env'];
        const env = dotenv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('basic'));
    });

    it('takes two or more files in the array for path option', () => {
        const testPath = ['test/.env.local', 'test/.env'];
        const env = dotenv.config({ path: testPath });

        expect(env.parsed!.BASIC).toBe(JSON.stringify('local_basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('local_basic'));
    });

    it('sets values from both .env.local and .env. first file key wins.', () => {
        delete process.env.SINGLE_QUOTES;

        const testPath = ['test/.env.local', 'test/.env'];
        const env = dotenv.config({ path: testPath });

        // in both files - first file wins (.env.local)
        expect(env.parsed!.BASIC).toBe(JSON.stringify('local_basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('local_basic'));

        // in .env.local only
        expect(env.parsed!.LOCAL).toBe(JSON.stringify('local'));
        expect(process.env.LOCAL).toBe(JSON.stringify('local'));

        // in .env only
        expect(env.parsed!.SINGLE_QUOTES).toBe(JSON.stringify('single_quotes'));
        expect(process.env.SINGLE_QUOTES).toBe(JSON.stringify('single_quotes'));
    });

    it('sets values from both .env.local and .env. but none is used as value existed in process.env.', () => {
        const testPath = ['test/.env.local', 'test/.env'];
        process.env.BASIC = 'existing';

        const env = dotenv.config({ path: testPath });

        // does not override process.env
        expect(env.parsed!.BASIC).toBe(JSON.stringify('local_basic'));
        expect(process.env.BASIC).toBe('existing');
    });

    it('takes URL for path option', () => {
        const envPath = path.resolve(__dirname, '.env');
        const fileUrl = new URL(`file://${envPath}`);

        const env = dotenv.config({ path: fileUrl });

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('basic'));

    });

    it('takes option for path along with home directory char ~', () => {
        mocks.fs.readFileSync.mockImplementationOnce(() => 'test="foo"');
        mocks.os.homedir.mockImplementationOnce(() => mockedHomedir);
        const mockedHomedir = '/Users/dummy';
        const testPath = '~/.env';
        dotenv.config({ path: testPath });

        expect(mocks.fs.readFileSync).toBeCalledWith(path.join(mockedHomedir, '.env'), expect.anything());
        expect(mocks.os.homedir).toBeCalled();
    });

    it('takes option for encoding', () => {
        mocks.fs.readFileSync.mockImplementationOnce(() => 'BASIC="basic"');

        const testEncoding = 'latin1';
        dotenv.config({ encoding: testEncoding });
        expect(mocks.fs.readFileSync).toBeCalledWith(expect.anything(), { encoding: testEncoding });
    });

    it('takes option for debug', () => {
        const logStub = vi.spyOn(console, 'log');

        dotenv.config({ debug: true });
        expect(logStub).toBeCalled();

        logStub.mockClear();
    });

    it('reads path with encoding, parsing output to process.env', () => {
        mocks.fs.readFileSync.mockImplementationOnce(() => 'BASIC="basic"');
        const parseStub = vi.spyOn(dotenv, 'parse').mockReturnValue({ BASIC: 'basic' });

        const res = dotenv.config({ path: 'test/.env' });

        //expect(res.parsed).toStrictEqual(stringifyTomlValues({ BASIC: 'basic' }));
        //expect(parseStub).toBeCalled();
        expect(mocks.fs.readFileSync).toBeCalledTimes(1);

    });

    it('does not write over keys already in process.env', () => {
        const testPath = 'test/.env'
        const existing = 'bar'
        process.env.BASIC = existing
        const env = dotenv.config({ path: testPath })

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe(existing);

    });

    it('does write over keys already in process.env if override turned on', () => {
        const testPath = 'test/.env'
        const existing = 'bar'
        process.env.BASIC = existing
        const env = dotenv.config({ path: testPath, override: true })

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('basic'));

    });

    it('does not write over keys already in process.env if the key has a falsy value', () => {
        const testPath = 'test/.env'
        const existing = ''
        process.env.BASIC = existing
        const env = dotenv.config({ path: testPath })

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe('');

    });

    it('does write over keys already in process.env if the key has a falsy value but override is set to true', () => {
        const testPath = 'test/.env'
        const existing = ''
        process.env.BASIC = existing
        const env = dotenv.config({ path: testPath, override: true })

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        expect(process.env.BASIC).toBe(JSON.stringify('basic'));
    });

    it('can write to a different object rather than process.env', () => {
        const testPath = 'test/.env'
        process.env.BASIC = 'other' // reset process.env

        const myObject: NodeJS.ProcessEnv = {};
        const env = dotenv.config({ path: testPath, processEnv: myObject })

        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));
        console.log('logging', process.env.BASIC)
        expect(process.env.BASIC).toBe('other');
        expect(myObject.BASIC).toBe(JSON.stringify('basic'));

    });

    it('returns parsed object', () => {
        const testPath = 'test/.env';
        const env = dotenv.config({ path: testPath });

        expect(env.error).toBeUndefined();
        expect(env.parsed!.BASIC).toBe(JSON.stringify('basic'));

    });

    it('returns any errors thrown from reading file or parsing', () => {
        mocks.fs.readFileSync.mockImplementation(() => { throw new Error() });

        const env = dotenv.config();

        expect(env.error).toBeInstanceOf(Error);

        mocks.fs.readFileSync.mockClear();
    });

    it('logs any errors thrown from reading file or parsing when in debug mode', () => {

        const logStub = vi.spyOn(console, 'log');
        mocks.fs.readFileSync.mockImplementation(() => { throw new Error() });

        const env = dotenv.config({ debug: true });

        expect(logStub).toBeCalled();
        expect(env.error).toBeInstanceOf(Error);

        logStub.mockClear();
    });

    it('logs any errors parsing when in debug and override mode', () => {

        const logStub = vi.spyOn(console, 'log');

        dotenv.config({ debug: true, override: true });

        expect(logStub).toBeCalled();

    });

});
