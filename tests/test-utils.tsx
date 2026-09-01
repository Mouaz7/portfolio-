import type { ReactElement } from "react";
import {
  render as testingLibraryRender,
  type RenderOptions,
} from "@testing-library/react";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import en from "@/lib/i18n/dictionaries/en";

export * from "@testing-library/react";

export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return testingLibraryRender(
    <I18nProvider locale="en" dictionary={en}>{ui}</I18nProvider>,
    options,
  );
}
