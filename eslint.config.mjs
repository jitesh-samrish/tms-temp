"use strict";
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
        'unused-imports': unusedImports,
    },
    languageOptions: {
        globals: Object.assign({}, globals.node),
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' type without warnings
        '@typescript-eslint/no-unused-vars': 'off', // Disable base rule
        'unused-imports/no-unused-imports': 'error', // Auto-remove unused imports
        'unused-imports/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            },
        ],
    },
}, {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'libs/**', 'logs/**'],
});
