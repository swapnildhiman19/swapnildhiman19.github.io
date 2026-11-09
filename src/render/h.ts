// A tiny HTML templating helper. Every interpolated value is escaped unless it is already `Raw`
// (the result of another `h` template or an explicit `raw()`), so content can never inject markup.

export class Raw {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export const raw = (s: string): Raw => new Raw(s);

export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export type Value = string | number | Raw | null | undefined | false | Value[];

const out = (v: Value): string =>
  v == null || v === false ? '' : Array.isArray(v) ? v.map(out).join('') : v instanceof Raw ? v.value : esc(v);

export function h(strings: TemplateStringsArray, ...values: Value[]): Raw {
  let s = strings[0];
  values.forEach((v, i) => {
    s += out(v) + strings[i + 1];
  });
  return new Raw(s);
}
