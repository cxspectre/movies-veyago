// args.ts — a tiny, strict command-line parser (no dependency): --key value, --flag, repeatable keys.

export type ParsedArgs = {readonly values: ReadonlyMap<string, readonly string[]>; readonly flags: ReadonlySet<string>};

export function parseArgs(argv: readonly string[], flagNames: readonly string[]): ParsedArgs {
  const values = new Map<string, string[]>();
  const flags = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument '${arg}'`);
    const key = arg.slice(2);
    if (flagNames.includes(key)) {
      flags.add(key);
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || (value.startsWith('--') && !/^--?\d/.test(value))) throw new Error(`--${key} needs a value`);
    values.set(key, [...(values.get(key) ?? []), value]);
    i++;
  }
  return {values, flags};
}

export const one = (args: ParsedArgs, key: string): string | undefined => args.values.get(key)?.at(-1);

export function num(args: ParsedArgs, key: string): number | undefined {
  const raw = one(args, key);
  if (raw === undefined) return undefined;
  const v = Number(raw);
  if (!Number.isFinite(v)) throw new Error(`--${key} must be a number (got '${raw}')`);
  return v;
}
