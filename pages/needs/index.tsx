// pages/needs/index.tsx
import NeedsList from '@/components/NeedsList'

export default function AllNeedsPage() {
  return (
    <main className="min-h-screen px-4">
      <div className="mx-auto max-w-6xl py-8">
        <h1 className="text-2xl font-bold text-white mb-4">All Open Needs</h1>
        <div className="card-container list-card w-full">
          <div className="card-rim" />
          <div className="card-gold-frame" />
          <div className="card-logo-shadow">All Needs</div>
          <div className="card-logo-main">All Needs</div>
          
          <div className="w-full relative z-10 flex flex-col pt-10 pb-3">
            <NeedsList pageSize={30} columns={2} />
          </div>
        </div>
      </div>
    </main>
  )
}
