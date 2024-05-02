import mainModule from './index.js';
import envOptions from './env-options.js';
import cliOptions from './cli-options.js';
import './custom-types.js'; // To expose the types when importing via this file
mainModule.config({ ...envOptions, ...cliOptions(process.argv) });
