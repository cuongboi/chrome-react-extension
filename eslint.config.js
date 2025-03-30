import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.{js,ts,tsx}', 'config/*.ts'],
  extends: [eslint.configs.recommended, tseslint.configs.recommended],
  ignores: ['node_modules/*', '*/dist/*', '**/*.spec.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
});
