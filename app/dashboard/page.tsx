import { redirect } from 'next/navigation'
import { MemoryDashboard } from '@/components/memory-dashboard'
import { isView, type View } from '@/components/dashboard/types'
import { getOptionalSession } from '@/lib/dal/actor'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const session = await getOptionalSession()
  if (!session?.user) redirect('/sign-in')

  const { view } = await searchParams
  const requested = view ? `${view[0]?.toUpperCase() ?? ''}${view.slice(1)}` : undefined
  const initialView: View = isView(requested) ? requested : 'Overview'

  return (
    <MemoryDashboard
      user={{ name: session.user.name, email: session.user.email }}
      initialView={initialView}
    />
  )
}
