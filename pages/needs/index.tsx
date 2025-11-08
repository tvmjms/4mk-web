// pages/needs/index.tsx
import NeedsList from '@/components/NeedsList'

export default function AllNeedsPage() {
  return (
    <main className="min-h-screen px-4" style={{ background: '#a7f3d0' }}>
      <div className="mx-auto max-w-5xl py-8">
        <div className="card-container w-full" style={{ minHeight: '480px', padding: '1.6rem' }}>
          <div className="card-rim" />
          <div className="card-gold-frame" />
          
          {/* Title positioned absolutely like home page */}
          <div className="card-logo-main">All Needs</div>
          
          <div className="max-w-4xl mx-auto relative z-10" style={{ paddingTop: '2rem' }}>
            <NeedsList pageSize={30} columns={3} />
          </div>
        </div>
      </div>
    </main>
  )
}