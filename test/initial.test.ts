import { describe, expect, it, vi } from 'vitest';

const dotEnvTomlContent = `TEXT="some text here"
INTEGER=12345
ARRAY=[1, 2, 3, "FOOBAR"]
[TABLE]
KEY="VALUE"`;

vi.mock('fs', async () => {
    const pathModule = await import('path');
    return {
        readFileSync(path: any) {
            switch (path) {
                case pathModule.resolve(process.cwd(), '.env'):
                    return dotEnvTomlContent;
            }
        }
    };
});

describe('basic', () => {
    it('reads TOML values correctly when importing the config', async () => {
        await import('../src/config.js');
        expect(process.env.TEXT).toBe('some text here');
        expect(process.envTyped.TEXT).toBe('some text here');
        expect(process.env.INTEGER).toBe(String(12345));
        expect(process.envTyped.INTEGER).toBe(12345);
        expect(process.env.ARRAY).toBe(JSON.stringify([1, 2, 3, 'FOOBAR']));
        expect(process.envTyped.ARRAY[1]).toBe(2);
        expect(process.envTyped.ARRAY[3]).toBe('FOOBARq');
        expect(process.env.TABLE).toBe(JSON.stringify({KEY: 'VALUE'}));
        expect(process.envTyped.TABLE['KEY']).toBe('VALUE');
    });
});