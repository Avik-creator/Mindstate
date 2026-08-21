'use client'

import { useState } from 'react'
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
import { MEMORY_TYPES, type Memory, type Project } from '@/components/dashboard/types'

export function EditMemoryDialog({ memory, projects, refresh }: { memory: Memory; projects: Project[]; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(memory.title)
  const [content, setContent] = useState(memory.content)
  const [type, setType] = useState(memory.type)
  const [projectId, setProjectId] = useState(memory.projectId ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Reopening after a cancel should show what is stored, not the abandoned edit.
  function change(next: boolean) {
    setOpen(next)
    if (next) {
      setTitle(memory.title)
      setContent(memory.content)
      setType(memory.type)
      setProjectId(memory.projectId ?? '')
      setError('')
    }
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      await send(`/api/v1/memories/${memory.id}`, 'PATCH', { title, content, type, projectId: projectId || null })
      await refresh()
      setOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit memory</DialogTitle>
          <DialogDescription>Agents recall the updated text from the next request onward.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Content</FieldLabel>
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={(value) => setType(value as Memory['type'])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MEMORY_TYPES.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Project</FieldLabel>
            <Select value={projectId || 'none'} onValueChange={(value) => setProjectId(!value || value === 'none' ? '' : value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="No project" /></SelectTrigger>
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
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        </FieldGroup>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !title.trim() || !content.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
