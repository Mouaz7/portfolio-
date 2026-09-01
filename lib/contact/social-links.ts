export type ContactSocialLink = {
  id: number;
  title: string;
  href: string;
  svgPath: string;
  viewBox?: string;
};

export function isSocialIconUrl(value: string): boolean {
  return /^(?:https?:\/\/|data:image\/svg\+xml,)/i.test(value);
}

export function isSvgPath(value: string): boolean {
  return /^[MmZzLlHhVvCcSsQqTtAa][MmZzLlHhVvCcSsQqTtAa\d\s,.\-+eE]+$/.test(value);
}
