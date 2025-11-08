// pages/needs/index.tsx
import NeedsList from '@/components/NeedsList'

export default function AllNeedsPage() {
  return (
    <main className="min-h-screen px-4">
      <div className="mx-auto max-w-5xl py-8">
        <h1 className="text-2xl font-bold text-white mb-4">All Open Needs</h1>
        <NeedsList pageSize={10} />
      </div>
    </main>
  )
}