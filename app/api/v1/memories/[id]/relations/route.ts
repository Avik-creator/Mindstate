import { NextResponse } from 'next/server'
import { z } from 'zod'
import { relate, relationInputSchema, RelationError } from '@/lib/application/memory-relation-service'
import { validationError } from '@/lib/application/contracts'
import { apiGuard } from '@/lib/dal/api-guard'

const REASONS: Record<string, { status: number; message: string }> = {
  SELF_RELATION: { status: 400, message: 'A memory cannot supersede or contradict itself.' },
  MEMORY_NOT_FOUND: { status: 404, message: 'One of those memories does not exist in this workspace.' },
  RECIPROCAL_SUPERSESSION: { status: 409, message: 'That memory already supersedes this one. Record a contradiction instead.' },
  ALREADY_RELATED: { status: 409, message: 'That relationship is already recorded.' },
}

// Posted to the asserting memory: this one supersedes, or contradicts, the target.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, response } = await apiGuard(request, 'memory:write')
  if (!actor) return response

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid memory ID' } }, { status: 400 })
  const parsed = relationInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 })

  try {
    return NextResponse.json({ data: await relate(actor, id, parsed.data) }, { status: 201 })
  } catch (error) {
    const reason = error instanceof RelationError ? REASONS[error.message] : undefined
    if (!reason) throw error
    return NextResponse.json({ error: { code: (error as RelationError).message, message: reason.message } }, { status: reason.status })
  }
}
