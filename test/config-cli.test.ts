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
    it('toml-env/config enables preloading', () => {
        expect(
            spawn(
                [
                    '--import',
                    './dist/config.js',
                    '-e',
                    'console.log(process.env.BASIC)',
                    'toml_env_config_encoding=utf8',
                    'toml_env_config_path=./test/.env.toml'
                ]
            )
        ).toBe('basic\n');
    });
    
    it('toml-env/config supports configuration via environment variables', () => {
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
                        TOML_ENV_CONFIG_PATH: './test/.env.toml'
                    }
                }
            )
        ).toBe('basic\n');
    });
    
    it('toml-env/config takes CLI configuration over environment variables', () => {
        expect(
            spawn(
                [
                    '--import',
                    './dist/config.js',
                    '-e',
                    'console.log(process.env.BASIC)',
                    'toml_env_config_path=./test/.env.toml'
                ],
                {
                    env: {
                        TOML_ENV_CONFIG_PATH: '/tmp/dne/path/.env.should.break'
                    }
                }
            )
        ).toBe('basic\n');
    });
  
});