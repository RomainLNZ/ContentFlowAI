export type ParseResult<T> =
  { success: true; data: T } | { success: false; issues: readonly string[]; raw: string };

export interface OutputParser<T> {
  readonly name: string;
  parse(raw: string): ParseResult<T>;
}
