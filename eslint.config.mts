import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([tseslint.configs.recommended, nextVitals]);
