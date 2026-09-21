/**
 * Two ambient declarations, because neither package ships TypeScript types.
 *
 * `@babel/core` is not a direct dependency: it arrives with
 * eslint-plugin-react-hooks 7, whose lint rules are the React Compiler's own
 * analysis. We use it in vite.config.ts to run `babel-plugin-react-compiler`
 * over src/. In a project of your own, install `oxc-transform-react` instead
 * and write `react({ compiler: true })` — see Demo 18, Lab 6.
 *
 * Declared as narrowly as we actually use them: a shim, not a port.
 */
declare module '@babel/core' {
  export interface BabelFileResult {
    code?: string | null;
    map?: unknown;
  }
  export interface TransformOptions {
    filename?: string;
    babelrc?: boolean;
    configFile?: boolean;
    sourceMaps?: boolean;
    parserOpts?: { plugins?: string[] };
    plugins?: unknown[];
  }
  export function transformAsync(code: string, options?: TransformOptions): Promise<BabelFileResult | null>;
}

declare module 'babel-plugin-react-compiler' {
  const plugin: unknown;
  export default plugin;
}
