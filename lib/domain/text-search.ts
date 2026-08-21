// Builds a Postgres tsquery from free text. The final term gets a prefix match so incremental typing still hits.
export function toTsQuery(input: string): string | null {
  const tokens = input.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  if (!tokens.length) return null
  return tokens.map((token, index) => (index === tokens.length - 1 ? `${token}:*` : token)).join(' & ')
}
