'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { send } from '@/components/dashboard/api'
import { Empty, NoMatches } from '@/components/dashboard/states'
import type { Project } from '@/components/dashboard/types'

function DeleteButton({ project, refresh }: { project: Project; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    setDeleting(true)
    setError('')
    try {
      await send(`/api/v1/projects/${project.id}`, 'DELETE')
      await refresh()
      setOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This project can only be deleted when it has no linked memories, sessions, or handoffs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={remove}>
              {deleting ? 'Deleting…' : 'Delete project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function ProjectList({ items, query, refresh }: { items: Project[]; query?: string; refresh: () => Promise<void> }) {
  if (!items.length) return query ? <NoMatches label="projects" query={query} /> : <Empty label="projects" />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((project) => (
        <article key={project.id} className="rounded-lg border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold">{project.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <DeleteButton project={project} refresh={refresh} />
          </div>
          <div className="mt-5 flex gap-4 font-mono text-xs text-muted-foreground">
            <span>{project.memoryCount} memories</span>
            <span>{project.sessionCount} sessions</span>
            <span>{project.handoffCount} handoffs</span>
          </div>
        </article>
      ))}
    </div>
  )
}
