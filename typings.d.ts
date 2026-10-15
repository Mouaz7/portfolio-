declare module "*.css" {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare namespace React {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }
}

declare module "shiki/core" {
  export function createHighlighterCore(options: unknown): Promise<unknown>;
}

declare module "shiki/engine/oniguruma" {
  export function createOnigurumaEngine(wasm: unknown): unknown;
}

declare module "shiki/wasm" {
  const wasm: unknown;
  export default wasm;
}

declare module "@shikijs/langs/*" {
  const language: unknown;
  export default language;
}

declare module "@shikijs/themes/*" {
  const theme: unknown;
  export default theme;
}
