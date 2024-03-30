import { describe, expect, it, vi } from 'vitest';

const dotEnvTomlContent = `TEXT="some text here"
INTEGER=12345`;

vi.mock('fs', () => ({
    readFileSync(path: any) {
        switch (path) {
            case `${process.cwd()}/.env`:
                return dotEnvTomlContent;
        }
    }
}));

describe('basic', () => {
    it('reads TOML values correctly when importing the config', async () => {
        await import('../src/config.js');
        expect(process.env.TEXT).toBe(JSON.stringify('some text here'));
        expect(process.env.INTEGER).toBe(JSON.stringify(12345));
    });
});