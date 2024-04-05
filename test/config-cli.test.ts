import { expect, describe, it } from 'vitest';
import cp from 'child_process';
import path from 'path';

function spawn(args: string[], options = {}) {
    const { stdout, stderr } = cp.spawnSync(
        process.argv[0], // node binary
        args,
        Object.assign(
        {},
        {
            cwd: path.resolve(__dirname, '..'),
            timeout: 5000,
            encoding: 'utf8' as const
        },
        options
        )
    );
    
    return stdout;
}

describe('cli-options module', () => {
    it('dotenv/config enables preloading', () => {
        expect(
            spawn(
                [
                    '--import',
                    './dist/config.js',
                    '-e',
                    'console.log(process.env.BASIC)',
                    'dotenv_config_encoding=utf8',
                    'dotenv_config_path=./test/.env'
                ]
            )
        ).toBe(`${JSON.stringify('basic')}\n`);
    });
    
    it('dotenv/config supports configuration via environment variables', () => {
        expect(
            spawn(
                [
                    '--import',
                    './dist/config.js',
                    '-e',
                    'console.log(process.env.BASIC)'
                ],
                {
                    env: {
                        DOTENV_CONFIG_PATH: './test/.env'
                    }
                }
            )
        ).toBe(`${JSON.stringify('basic')}\n`);
    });
    
    it('dotenv/config takes CLI configuration over environment variables', () => {
        expect(
            spawn(
                [
                    '--import',
                    './dist/config.js',
                    '-e',
                    'console.log(process.env.BASIC)',
                    'dotenv_config_path=./test/.env'
                ],
                {
                    env: {
                        DOTENV_CONFIG_PATH: '/tmp/dne/path/.env.should.break'
                    }
                }
            )
        ).toBe(`${JSON.stringify('basic')}\n`);
    });
  
});