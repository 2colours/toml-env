import fs from 'fs';
import { MockInstance, afterEach, beforeEach, describe, vi, it, expect } from 'vitest';

import dotenv from '../src';

const mockParseResponse = { test: 'foo' };
let readFileSyncStub: MockInstance;
let parseStub: MockInstance;

describe('populate function', () => {
    beforeEach(() => {
        readFileSyncStub = vi.spyOn(fs, 'readFileSync').mockReturnValue('test="foo"');
        parseStub = vi.spyOn(dotenv, 'parse').mockReturnValue(mockParseResponse);
    });

    afterEach(() => {
        readFileSyncStub.mockClear();
        parseStub.mockClear();
    });

    it('takes processEnv and check if all keys applied to processEnv', () => {
        const parsed = { test: '1', home: '2' };
        const processEnv = {};
      
        dotenv.populate(processEnv, parsed);
      
        expect(processEnv).toStrictEqual(parsed);
    });
      
    it('does not write over keys already in processEnv', () => {
        const existing = 'bar';
        const parsed = { test: 'test' };
        process.env.test = existing;
      
        // 'test' returned as value in `beforeEach`. should keep this 'bar'
        dotenv.populate(process.env, parsed);
      
        expect(process.env.test).toBe(existing);
    });
      
    it('does write over keys already in processEnv if override turned on', () => {
        const existing = 'bar';
        const parsed = { test: 'test' };
        process.env.test = existing;
      
        // 'test' returned as value in `beforeEach`. should change this 'bar' to 'test'
        dotenv.populate(process.env, parsed, { override: true });
      
        expect(process.env.test).toBe(parsed.test);
    });
      
    it('logs any errors populating when in debug mode but override turned off', () => {
        const logStub = vi.spyOn(console, 'log');
      
        const parsed = { test: 'false' };
        process.env.test = 'true';
      
        dotenv.populate(process.env, parsed, { debug: true });
      
        expect(process.env.test).not.toBe(parsed.test);
        expect(logStub).toBeCalled();
      
        logStub.mockClear();
    });
      
    it('logs populating when debug mode and override turned on', () => {
        const logStub = vi.spyOn(console, 'log');
        
        const parsed = { test: 'false' };
        process.env.test = 'true'
        
        dotenv.populate(process.env, parsed, { debug: true, override: true });
        
        expect(process.env.test).toBe(parsed.test);
        expect(logStub).toBeCalled();
        
        logStub.mockClear();
    });
      
    it('returns any errors thrown on passing not json type', () => {
        try {
            dotenv.populate(process.env, '' as any); //this type is deliberately wrong here
        } catch (e) {
            expect(e.message).toBe('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate');
        }
    })      
});