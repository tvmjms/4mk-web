import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import NeedsList from "@/components/NeedsList";

export default function DashboardPage() {
  const supabase = useSupabaseClient();
  const { isLoading: authLoading, isAuthenticated, user } = useAuthGuard();
  const [stats, setStats] = useState({
    totalNeeds: 0,
    activeNeeds: 0,
    fulfilledNeeds: 0,
    pendingNeeds: 0
  });

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchStats(user.id);
    }
  }, [user, isAuthenticated]);

  const fetchStats = async (userId: string) => {
    try {
      const { data: needsData, error } = await supabase
        .from("needs")
        .select("*")
        .eq("owner_id", userId);

      if (!error) {
        const totalNeeds = needsData?.length || 0;
        const activeNeeds = needsData?.filter((need: any) => need.status === 'new' || need.status === 'active' || need.status === 'Help Offered' || need.status === 'help_offered').length || 0;
        const fulfilledNeeds = needsData?.filter((need: any) => need.status === 'fulfilled').length || 0;
        const pendingNeeds = needsData?.filter((need: any) => need.status === 'pending' || need.status === 'Help Accepted' || need.status === 'help_accepted').length || 0;
        
        setStats({ totalNeeds, activeNeeds, fulfilledNeeds, pendingNeeds });
      }
    } catch (error) {
      console.error("Error:", error);
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
          <div className="card-container w-full" style={{ padding: '1.6rem' }}>
            <div className="card-rim" />
            <div className="card-gold-frame" />
            
            {/* Title positioned absolutely like home page */}
            <div className="card-logo-main">My Needs</div>
            
            <div className="max-w-2xl mx-auto relative z-10" style={{ paddingTop: '2rem' }}>
              {user && <NeedsList pageSize={10} columns={2} ownerId={user.id} />}
            </div>
          </div>
        </div>

        {/* Right Card: My Offers */}
        <div className="flex justify-center items-start">
          <div className="card-container w-full" style={{ padding: '1.6rem' }}>
            <div className="card-rim" />
            <div className="card-gold-frame" />
            
            {/* Title positioned absolutely like home page */}
            <div className="card-logo-main">My Offers</div>
            
            <div className="max-w-2xl mx-auto relative z-10" style={{ paddingTop: '2rem' }}>
              {user && <NeedsList pageSize={10} columns={2} helperId={user.id} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
