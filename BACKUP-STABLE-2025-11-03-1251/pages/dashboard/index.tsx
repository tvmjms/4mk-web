import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Need } from "@/types/database";

export default function DashboardPage() {
  const supabase = useSupabaseClient();
  const { isLoading: authLoading, isAuthenticated, user } = useAuthGuard();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNeeds: 0,
    activeNeeds: 0,
    fulfilledNeeds: 0,
    pendingNeeds: 0
  });

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchUserData(user.id);
    }
  }, [user, isAuthenticated]);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      const { data: needsData, error } = await supabase
        .from("needs")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (!error) {
        setNeeds(needsData || []);
        const totalNeeds = needsData?.length || 0;
        const activeNeeds = needsData?.filter((need: any) => need.status === 'new' || need.status === 'active').length || 0;
        const fulfilledNeeds = needsData?.filter((need: any) => need.status === 'fulfilled').length || 0;
        const pendingNeeds = needsData?.filter((need: any) => need.status === 'pending').length || 0;
        
        setStats({ totalNeeds, activeNeeds, fulfilledNeeds, pendingNeeds });
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading while auth is initializing
  if (authLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600 text-sm">Loading dashboard...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4">
      {/* Header */}
      <div className="mb-4 mt-6">
        {/* Title */}
        <h1 className="text-lg font-bold text-slate-800 mb-0">Dashboard</h1>
        
        {/* Welcome and Create Button Line */}
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs text-gray-600">Welcome back, {user?.email}</p>
          <Link href="/needs/create" className="py-1 px-3 rounded-md text-center font-semibold text-xs btn-turquoise">
            Create Need
          </Link>
          
          {/* Counter Boxes - Same Line, Right Side */}
          <div className="flex gap-2 ml-auto">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow border border-white/20 min-w-[80px]">
              <h3 className="text-xs font-medium text-slate-600 mb-1">Total</h3>
              <p className="text-sm font-bold text-blue-600">{stats.totalNeeds}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow border border-white/20 min-w-[80px]">
              <h3 className="text-xs font-medium text-slate-600 mb-1">Active</h3>
              <p className="text-sm font-bold text-green-600">{stats.activeNeeds}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow border border-white/20 min-w-[80px]">
              <h3 className="text-xs font-medium text-slate-600 mb-1">Fulfilled</h3>
              <p className="text-sm font-bold text-purple-600">{stats.fulfilledNeeds}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow border border-white/20 min-w-[80px]">
              <h3 className="text-xs font-medium text-slate-600 mb-1">Pending</h3>
              <p className="text-sm font-bold text-orange-600">{stats.pendingNeeds}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Card Layout */}
      <div className="mx-auto max-w-6xl py-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Card: My Needs */}
        <div className="flex justify-center items-start">
          <div className="card-container w-full max-w-2xl h-[400px]">
            <div className="card-rim" />
            <div className="card-gold-frame" />
            <div className="card-logo-shadow">My Needs</div>
            <div className="card-logo-main">My Needs</div>

            <div className="max-w-2xl mx-auto relative z-10 h-full flex flex-col pt-6 px-3">
              {/* My Needs List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-white/90 text-xs text-center py-8">Loading your needs...</div>
                ) : needs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/80 text-xs mb-2">You haven&apos;t created any needs yet.</p>
                    <Link href="/needs/create" className="text-white hover:text-white/80 font-medium text-xs">
                      Create your first need →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {needs.map((need) => (
                      <div key={need.id} className="bg-white/90 backdrop-blur-sm border border-white/20 rounded p-2 hover:bg-white transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <Link href={`/needs/${need.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex-1 pr-2">
                            {need.title}
                          </Link>
                          <div className="text-[10px] text-gray-500">
                            {new Date(need.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1">
                             <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${getStatusColor(need.status || 'new')}`}>
                              {need.status || 'new'}
                            </span>
                            {need.category && (
                              <span className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-medium capitalize">
                                {need.category}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Link href={`/needs/${need.id}`} className="px-1 py-0.5 rounded text-[8px] font-semibold btn-blue">
                              View
                            </Link>
                            <Link href={`/needs/${need.id}/edit`} className="px-1 py-0.5 rounded text-[8px] font-semibold btn-orange">
                              Edit
                            </Link>
                          </div>
                        </div>
                        
                        {(need.city || need.state) && (
                          <p className="text-gray-500 text-[9px]">
                            📍 {[need.city, need.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: My Offers */}
        <div className="flex justify-center items-start">
          <div className="card-container w-full max-w-2xl h-[400px]">
            <div className="card-rim" />
            <div className="card-gold-frame" />
            <div className="card-logo-shadow">My Offers</div>
            <div className="card-logo-main">My Offers</div>

            <div className="max-w-2xl mx-auto relative z-10 h-full flex flex-col pt-6 px-3">
              {/* Browse Needs Button */}
              <div className="mb-3 text-center">
                <Link href="/" className="py-1 px-3 rounded-md text-center font-semibold text-xs btn-turquoise">
                  Browse Needs to Help
                </Link>
              </div>

              {/* My Offers List - Placeholder for now */}
              <div className="flex-1 overflow-y-auto">
                <div className="text-center py-8">
                  <p className="text-white/80 text-xs mb-2">Offers tracking coming soon!</p>
                  <p className="text-white/60 text-[10px]">
                    For now, browse needs on the home page to offer help to your community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
