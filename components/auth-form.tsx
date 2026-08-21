'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Braces } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(formData: FormData) {
    setPending(true)
    setError('')
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')
    const name = String(formData.get('name') || 'Personal workspace')
    const result = mode === 'sign-up'
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })
    setPending(false)
    if (result.error) return setError('We could not complete that request. Check your details and try again.')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.8fr_1.2fr]">
      <section className="flex flex-col justify-between border-r-2 border-foreground bg-card p-8 lg:p-12">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold"><span className="flex size-8 items-center justify-center  bg-primary text-primary-foreground"><Braces className="size-4" /></span>Mindstate</Link>
        <div className="hidden max-w-md lg:block"><p className="font-mono text-xs uppercase tracking-widest text-brand">Private by default</p><h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight">A durable thread between you and every agent.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Your memory, sessions, and handoffs remain scoped to your account and database.</p></div>
        <p className="text-xs text-muted-foreground">Next.js · Better Auth · Postgres</p>
      </section>
      <section className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-brand">{mode === 'sign-up' ? 'Create workspace' : 'Welcome back'}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{mode === 'sign-up' ? 'Start remembering.' : 'Continue your thread.'}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{mode === 'sign-up' ? 'Create your private owner account.' : 'Sign in to your private workspace.'}</p>
          <form action={submit} className="mt-8 flex flex-col gap-5">
            {mode === 'sign-up' && <label className="flex flex-col gap-2 text-sm font-medium">Name<Input name="name" required autoComplete="name" placeholder="Your name" /></label>}
            <label className="flex flex-col gap-2 text-sm font-medium">Email<Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Password<Input name="password" type="password" minLength={8} required autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} /></label>
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            <Button type="submit" size="lg" disabled={pending}>{pending ? 'Please wait…' : mode === 'sign-up' ? 'Create workspace' : 'Sign in'}<ArrowRight data-icon="inline-end" /></Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">{mode === 'sign-up' ? 'Already have an account?' : 'New to Mindstate?'} <Link className="text-foreground underline underline-offset-4" href={mode === 'sign-up' ? '/sign-in' : '/sign-up'}>{mode === 'sign-up' ? 'Sign in' : 'Create an account'}</Link></p>
        </div>
      </section>
    </main>
  )
}
