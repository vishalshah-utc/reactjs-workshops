import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // `server/` is a synced copy of the ShopCrew API — plain JavaScript, not
    // participant code, and governed by its own rules in the api/ repo root.
    // Linting it here would report problems nobody in this session can fix.
    ignores: ['dist', 'server'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // The rules that catch real React bugs. `rules-of-hooks` is the one you
      // must never disable — it catches conditional hook calls, which corrupt
      // React's internal state in ways that are very hard to debug.
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // MUST come after the block above — in flat config, later wins.
    //
    // Vendored shadcn/ui primitives. Participants did not write these and
    // should not be shown warnings about them. The react-refresh rule objects
    // to exporting `buttonVariants` next to `Button`, which is exactly how
    // shadcn ships and is correct.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
