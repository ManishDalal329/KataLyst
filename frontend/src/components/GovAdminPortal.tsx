import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Landmark, TrendingUp, DollarSign, Users, AlertTriangle, CheckCircle2, ShieldAlert, BarChart3, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export const GovAdminPortal: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [categoryDemand, setCategoryDemand] = useState<any[]>([]);
  const [districtDemand, setDistrictDemand] = useState<any[]>([]);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [flaggedCoops, setFlaggedCoops] = useState<any[]>([]);

  useEffect(() => {
    loadGovAnalytics();
  }, []);

  const loadGovAnalytics = async () => {
    try {
      const [ovData, catData, distData, coopsData, flaggedData] = await Promise.all([
        fetchApi('/admin/analytics/overview'),
        fetchApi('/admin/analytics/demand-by-category'),
        fetchApi('/admin/analytics/demand-by-district'),
        fetchApi('/cooperatives'),
        fetchApi('/admin/analytics/flagged-cooperatives')
      ]);

      setOverview(ovData);
      setCategoryDemand(catData);
      setDistrictDemand(distData);
      setCooperatives(coopsData);
      setFlaggedCoops(flaggedData);
    } catch (e) {
      console.error('Failed to load gov analytics', e);
    }
  };

  const handleUpdateCoopStatus = async (coopId: string, status: string) => {
    try {
      await fetchApi(`/cooperatives/${coopId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadGovAnalytics();
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Government Admin Header */}
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-2xl font-extrabold text-[#2B2824]">Ministry of Cooperation Admin Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B7355]/10 text-[#6B4F3B] border border-[#8B7355]/20 text-[10px] font-extrabold uppercase">
              Official Portal
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">National Worker Cooperative Regulatory & Platform Analytics Dashboard</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#6E675F]">Total Registered Cooperatives:</span>
          <div className="text-xl font-extrabold text-[#6B4F3B]">{overview?.totalCoops || cooperatives.length} Approved Coops</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">Total Platform GMV</span>
          <div className="text-2xl font-extrabold text-[#2B2824]">₹{overview?.totalGMV || '0.00'}</div>
          <span className="text-[10px] text-[#8B7355] font-bold">100% Transparent Financial Flow</span>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">Worker Payouts (80%)</span>
          <div className="text-2xl font-extrabold text-[#6B4F3B]">₹{overview?.totalWorkerPayouts || '0.00'}</div>
          <span className="text-[10px] text-[#6E675F]">Directly into Worker Accounts</span>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">Coop Reserve Funds (15%)</span>
          <div className="text-2xl font-extrabold text-[#8B7355]">₹{overview?.totalCoopFunds || '0.00'}</div>
          <span className="text-[10px] text-[#6E675F]">Worker Welfare & Equipment</span>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">Platform Tech Fee (5%)</span>
          <div className="text-2xl font-extrabold text-[#2B2824]">₹{overview?.totalPlatformFees || '0.00'}</div>
          <span className="text-[10px] text-[#6E675F]">Open-Source Tech Maintenance</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Category Demand */}
        <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#2B2824] flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-[#8B7355]" />
            <span>Service Bookings Demand by Category</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                <XAxis dataKey="name" stroke="#6E675F" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#6E675F" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#E8E2D9', borderRadius: '12px', color: '#2B2824' }} />
                <Bar dataKey="bookings" name="Total Bookings" fill="#6B4F3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: District Distribution */}
        <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#2B2824] flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#8B7355]" />
            <span>Cooperative Service Coverage by District</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                <XAxis dataKey="district" stroke="#6E675F" fontSize={11} />
                <YAxis stroke="#6E675F" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#E8E2D9', borderRadius: '12px', color: '#2B2824' }} />
                <Bar dataKey="bookings" name="Bookings" fill="#8B7355" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Cooperative Directory & Registration Approval Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#2B2824]">Cooperative Approval Directory</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cooperatives.map((coop) => (
            <div key={coop.id} className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-[#2B2824] text-sm">{coop.name}</h3>
                  <p className="text-xs text-[#6E675F]">{coop.district}, {coop.state}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  coop.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                  coop.status === 'REJECTED' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                  'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                }`}>
                  {coop.status}
                </span>
              </div>

              <div className="text-xs text-[#2B2824] space-y-1 pt-2 border-t border-[#E8E2D9]">
                <div>Reg. No: <span className="font-mono text-[#6E675F]">{coop.registration_no}</span></div>
                <div>Admin: <span className="text-[#6E675F]">{coop.admin?.name} ({coop.admin?.phone})</span></div>
                <div>Members: <span className="font-bold text-[#2B2824]">{coop.workers?.length || 0} registered workers</span></div>
                <div>Fund Balance: <span className="font-bold text-[#6B4F3B]">₹{coop.fund_balance}</span></div>
              </div>

              {coop.status === 'PENDING' && (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => handleUpdateCoopStatus(coop.id, 'APPROVED')}
                    className="w-1/2 py-1.5 rounded-xl bg-[#6B4F3B] hover:bg-[#543d2e] text-white font-extrabold text-xs shadow-sm transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateCoopStatus(coop.id, 'REJECTED')}
                    className="w-1/2 py-1.5 rounded-xl bg-red-500/10 text-red-700 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs shadow-sm transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Flagged Cooperatives Section */}
      {flaggedCoops.length > 0 && (
        <section className="p-6 rounded-2xl border border-red-200 bg-red-50/60 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-red-700 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Flagged Cooperatives Requiring Ministry Audit</span>
          </div>

          <div className="space-y-2">
            {flaggedCoops.map((coop) => (
              <div key={coop.id} className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between text-xs shadow-sm">
                <div>
                  <strong className="text-[#2B2824]">{coop.name}</strong> ({coop.district})
                  <div className="text-[11px] text-red-600 mt-0.5">Reason: {coop.reason}</div>
                </div>
                <div className="text-right font-mono text-[#6E675F]">
                  Avg Rating: <span className="text-amber-600 font-bold">{coop.avgRating} ★</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default GovAdminPortal;
