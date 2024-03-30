import mainModule from './index.js';
import envOptions from './env-options.js';
import cliOptions from './cli-options.js';
mainModule.config({ ...envOptions, ...cliOptions(process.argv) });
