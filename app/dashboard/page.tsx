import { redirect } from 'next/navigation'
import { MemoryDashboard } from '@/components/memory-dashboard'
import { getOptionalSession } from '@/lib/dal/actor'

export default async function DashboardPage() {
  const session = await getOptionalSession()
  if (!session?.user) redirect('/sign-in')
  return <MemoryDashboard user={{ name: session.user.name, email: session.user.email }} />
}
