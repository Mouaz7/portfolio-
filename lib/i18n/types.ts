import en from "./dictionaries/en";

type DeepString<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? DeepString<T[K]>
      : T[K];
};

export type Dictionary = DeepString<typeof en>;

export type TranslationValues = Record<string, string | number>;

export function formatMessage(message: string, values?: TranslationValues): string {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : placeholder,
  );
}
