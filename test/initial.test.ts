import { describe, expect, it, vi } from 'vitest';

const dotEnvTomlContent = `TEXT="some text here"
INTEGER=12345`;

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
        expect(process.env.INTEGER).toBe(String(12345));
    });
});