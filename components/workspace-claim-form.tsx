'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function WorkspaceClaimForm({ token, name, email, agentName }: { token: string; name: string; email: string; agentName: string | null }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(formData: FormData) {
    setPending(true)
    setError('')
    const password = String(formData.get('password') || '')
    const confirmation = String(formData.get('confirmation') || '')
    if (password !== confirmation) {
      setPending(false)
      setError('Passwords do not match.')
      return
    }

    const response = await fetch('/api/v1/workspace-claims/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
    })
    if (!response.ok) {
      setPending(false)
      setError('This claim could not be completed. The link may have expired or the email may already be registered.')
      return
    }

    const signIn = await authClient.signIn.email({ email, password })
    setPending(false)
    if (signIn.error) {
      router.push('/sign-in')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl sm:p-10" aria-labelledby="claim-title">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><LockKeyhole aria-hidden="true" /></div>
        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-primary">Human approval required</p>
        <h1 id="claim-title" className="mt-3 text-balance text-3xl font-semibold tracking-tight">Claim your Mindstate workspace.</h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">{agentName ? `${agentName} prepared this workspace for you.` : 'An agent prepared this workspace for you.'} Only you can choose the password and create the owner account.</p>

        <dl className="mt-8 flex flex-col gap-3 rounded-xl border bg-background p-4 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Owner</dt><dd className="truncate font-medium">{name}</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Email</dt><dd className="truncate font-mono text-xs">{email}</dd></div>
        </dl>

        <form action={submit} className="mt-8">
          <FieldGroup>
            <Field><FieldLabel htmlFor="claim-password">Create password</FieldLabel><Input id="claim-password" name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" /></Field>
            <Field><FieldLabel htmlFor="claim-confirmation">Confirm password</FieldLabel><Input id="claim-confirmation" name="confirmation" type="password" minLength={8} maxLength={128} required autoComplete="new-password" /></Field>
            <Field orientation="horizontal"><Checkbox id="claim-consent" name="consent" required /><FieldLabel htmlFor="claim-consent" className="font-normal leading-6 text-muted-foreground">I understand this creates my private owner account. The initiating agent will not receive access unless I enroll it later.</FieldLabel></Field>
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            <Button type="submit" size="lg" disabled={pending}>{pending ? 'Creating workspace…' : 'Claim workspace'}<ArrowRight data-icon="inline-end" /></Button>
          </FieldGroup>
        </form>
      </section>
    </main>
  )
}
