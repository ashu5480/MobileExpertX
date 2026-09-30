/**
 * Registers the test ESM loader (see loader.mjs) so `--import` can wire it up.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./loader.mjs', pathToFileURL(`${import.meta.dirname}/`));
