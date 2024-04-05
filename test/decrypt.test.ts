import { describe, expect, it } from 'vitest';
import dotenv from '../src';

describe('decrypt function', () => {
    it('can decrypt', () => {
        const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
        const keyStr = 'ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00'
        
        const result = dotenv.decrypt(encrypted, keyStr);
        
        expect(result).toBe('# development@v6\nALPHA="zeta"');
    });
});
