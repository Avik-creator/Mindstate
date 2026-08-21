// The rightmost forwarded entry is the one the nearest trusted proxy appended; entries to its left are client-supplied.
export function clientAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for')
  const chain = forwarded?.split(',').map((value) => value.trim()).filter(Boolean) ?? []
  return chain.at(-1) ?? request.headers.get('x-real-ip')?.trim() ?? null
}
