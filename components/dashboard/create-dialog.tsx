'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { send } from '@/components/dashboard/api'
import type { Project } from '@/components/dashboard/types'

export type CreateKind = 'memory' | 'project' | 'handoff'

type CreateDialogProps = {
  kind: CreateKind
  projects: Project[]
  done: () => Promise<void>
}

export function CreateDialog({ kind, projects, done }: CreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    setError('')
    try {
      if (kind === 'project') {
        await send('/api/v1/projects', 'POST', { name: title, description: content })
      } else if (kind === 'handoff') {
        await send('/api/v1/handoffs', 'POST', { title, summary: content, projectId: projectId || null, sessionId: null, nextSteps: [] })
      } else {
        await send('/api/v1/memories', 'POST', { title, content, type: 'context', projectId: projectId || null, sessionId: null, tags: [], source: 'manual' })
      }
      await done()
      setOpen(false)
      setTitle('')
      setContent('')
      setProjectId('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        New {kind}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create {kind}</DialogTitle>
          <DialogDescription>This record is stored in your private workspace.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>{kind === 'project' ? 'Name' : 'Title'}</FieldLabel>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{kind === 'handoff' ? 'Summary' : 'Description'}</FieldLabel>
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} />
          </Field>
          {kind !== 'project' ? (
            <Field>
              <FieldLabel>Project</FieldLabel>
              <Select
                value={projectId || 'none'}
                onValueChange={(value) => setProjectId(!value || value === 'none' ? '' : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        </FieldGroup>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !title.trim() || !content.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
