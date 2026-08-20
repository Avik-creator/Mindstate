import 'server-only'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import type { Actor } from '@/lib/domain/memory'

export async function requireActor(): Promise<Actor> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return { userId: session.user.id }
}

export async function getOptionalSession() {
  return auth.api.getSession({ headers: await headers() })
}
