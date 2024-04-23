import { expect, describe, it } from 'vitest';
import options from '../src/cli-options.js';

describe('cli-options module', () => {
    it('matches encoding option', () => {
        expect(options(['node', '-e', "'console.log(testing)'", 'toml_env_config_encoding=utf8'])).toStrictEqual({
            encoding: 'utf8'
        });
    });
  
    it('matches path option', () => {
        expect(options(['node', '-e', "'console.log(testing)'", 'toml_env_config_path=/custom/path/to/your/env/vars'])).toStrictEqual({
            path: '/custom/path/to/your/env/vars'
        });
    });
    
    it('matches debug option', () => {
        expect(options(['node', '-e', "'console.log(testing)'", 'toml_env_config_debug=true'])).toStrictEqual({
            debug: 'true'
        });
    });
    
    it('matches override option', () => {
        expect(options(['node', '-e', "'console.log(testing)'", 'toml_env_config_override=true'])).toStrictEqual({
            override: 'true'
        });
    });
    
    it('ignores empty values', () => {
        expect(options(['node', '-e', "'console.log(testing)'", 'toml_env_config_path='])).toStrictEqual({});
    });
    
    it('ignores unsupported options', () => {
        expect(options(['node', '-e', "'console.log(testing)'", 'toml_env_config_foo=bar'])).toStrictEqual({});
    });
});
