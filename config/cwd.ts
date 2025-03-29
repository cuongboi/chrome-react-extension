import { $ } from 'bun';
import { resolve } from 'node:path';

$.cwd(resolve(__dirname, '../'));

declare module 'bun' {
  interface Env {
    BUILD_ENV: 'development' | 'production';
    CHROME_EXTENSION_ID: string;
  }
}
