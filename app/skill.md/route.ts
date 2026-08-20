import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const dynamic = 'force-static'

export async function GET() {
  const markdown = await readFile(join(process.cwd(), 'SKILL.md'), 'utf8')
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Disposition': 'inline; filename="skill.md"',
      Link: '<https://mindstate.avikmukherjee.com/skill.md>; rel="canonical"',
    },
  })
}
