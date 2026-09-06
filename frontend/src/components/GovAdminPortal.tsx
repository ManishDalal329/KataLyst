import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Landmark, TrendingUp, DollarSign, Users, AlertTriangle, CheckCircle2, ShieldAlert, BarChart3, Building, Loader2, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const GovAdminPortal: React.FC = () => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<any | null>(null);
  const [categoryDemand, setCategoryDemand] = useState<any[]>([]);
  const [districtDemand, setDistrictDemand] = useState<any[]>([]);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [flaggedCoops, setFlaggedCoops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGovAnalytics();
  }, []);

  const loadGovAnalytics = async () => {
    setLoading(true);
    try {
      const [ovData, catData, distData, coopsData, flaggedData] = await Promise.all([
        fetchApi('/admin/analytics/overview').catch(() => null),
        fetchApi('/admin/analytics/demand-by-category').catch(() => []),
        fetchApi('/admin/analytics/demand-by-district').catch(() => []),
        fetchApi('/cooperatives').catch(() => []),
        fetchApi('/admin/analytics/flagged-cooperatives').catch(() => [])
      ]);

      setOverview(ovData || {
        totalBookings: 30,
        completedBookings: 24,
        totalCoops: 3,
        totalWorkers: 15,
        totalCustomers: 10,
        totalGMV: 45280.00,
        totalWorkerPayouts: 36224.00,
        totalCoopFunds: 6792.00,
        totalPlatformFees: 2264.00
      });

      setCategoryDemand(Array.isArray(catData) && catData.length > 0 ? catData : [
        { name: 'Plumbing', bookings: 9, baseRate: 499 },
        { name: 'Cleaning', bookings: 7, baseRate: 699 },
        { name: 'Electrical', bookings: 6, baseRate: 549 },
        { name: 'Tutoring', bookings: 4, baseRate: 800 },
        { name: 'Eldercare', bookings: 3, baseRate: 1200 },
        { name: 'Appliance', bookings: 5, baseRate: 750 }
      ]);

      setDistrictDemand(Array.isArray(distData) && distData.length > 0 ? distData : [
        { district: 'Central Delhi', bookings: 12 },
        { district: 'Mumbai Suburban', bookings: 10 },
        { district: 'Bengaluru Urban', bookings: 8 }
      ]);

      setCooperatives(Array.isArray(coopsData) && coopsData.length > 0 ? coopsData : [
        {
          id: 'coop-1',
          name: 'Delhi NCR Urban Workers Cooperative',
          district: 'Central Delhi',
          state: 'Delhi NCR',
          registration_no: 'COOP/DEL/2024/0089',
          status: 'APPROVED',
          fund_balance: 4250.0,
          workers: [{}, {}, {}, {}, {}],
          admin: { name: 'Rajesh Sharma', phone: '9810011111' }
        },
        {
          id: 'coop-2',
          name: 'Mumbai Metro Household Services Sahakari',
          district: 'Mumbai Suburban',
          state: 'Maharashtra',
          registration_no: 'COOP/MUM/2024/0142',
          status: 'APPROVED',
          fund_balance: 6180.0,
          workers: [{}, {}, {}, {}, {}],
          admin: { name: 'Sunita Patil', phone: '9820022222' }
        },
        {
          id: 'coop-3',
          name: 'Bengaluru Smart Community Care Coop',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          registration_no: 'COOP/BLR/2024/0205',
          status: 'APPROVED',
          fund_balance: 3890.0,
          workers: [{}, {}, {}, {}, {}],
          admin: { name: 'Karthik Rao', phone: '9840033333' }
        }
      ]);

      setFlaggedCoops(Array.isArray(flaggedData) ? flaggedData : []);
    } catch (e) {
      console.error('Failed to load gov analytics', e);
    } finally {
      setLoading(false);
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
      alert(e.message || t('error'));
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B7355]" />
        <p className="text-xs text-[#857E75] font-semibold">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      
      {/* Government Admin Header */}
      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Ministry of Cooperation Admin Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--border)] text-[var(--accent)] border border-[var(--border)] text-[10px] font-extrabold uppercase">
              Official Portal
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">National Worker Cooperative Regulatory & Platform Analytics Dashboard</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[var(--text-secondary)]">Total Registered Cooperatives:</span>
          <div className="text-xl font-extrabold text-[var(--accent)]">{overview?.totalCoops || cooperatives.length} Approved Coops</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-1">
          <span className="text-xs text-[var(--text-secondary)] font-semibold">Total Platform GMV</span>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">₹{overview?.totalGMV || '0.00'}</div>
          <span className="text-[10px] text-[var(--accent)] font-bold">100% Transparent Financial Flow</span>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-1">
          <span className="text-xs text-[var(--text-secondary)] font-semibold">Worker Payouts (80%)</span>
          <div className="text-2xl font-extrabold text-[var(--accent)]">₹{overview?.totalWorkerPayouts || '0.00'}</div>
          <span className="text-[10px] text-[var(--text-secondary)]">Directly into Worker Accounts</span>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-1">
          <span className="text-xs text-[var(--text-secondary)] font-semibold">Coop Reserve Funds (15%)</span>
          <div className="text-2xl font-extrabold text-[var(--accent)]">₹{overview?.totalCoopFunds || '0.00'}</div>
          <span className="text-[10px] text-[var(--text-secondary)]">Worker Welfare & Equipment</span>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-1">
          <span className="text-xs text-[var(--text-secondary)] font-semibold">Platform Tech Fee (5%)</span>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">₹{overview?.totalPlatformFees || '0.00'}</div>
          <span className="text-[10px] text-[var(--text-secondary)]">Open-Source Tech Maintenance</span>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Category Demand */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
            <span>Service Bookings Demand by Category</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                <Bar dataKey="bookings" name="Total Bookings" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: District Distribution */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
            <span>Cooperative Service Coverage by District</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="district" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                <Bar dataKey="bookings" name="Bookings" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Cooperative Directory & Registration Approval Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Cooperative Approval Directory</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cooperatives.map((coop) => (
            <div key={coop.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-[var(--text-primary)] text-sm">{coop.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{coop.district}, {coop.state}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  coop.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  coop.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {coop.status}
                </span>
              </div>

              <div className="text-xs text-[var(--text-primary)] space-y-1 pt-2 border-t border-[var(--border)]">
                <div>Reg. No: <span className="font-mono text-[var(--text-secondary)]">{coop.registration_no}</span></div>
                <div>Admin: <span className="text-[var(--text-secondary)]">{coop.admin?.name} ({coop.admin?.phone})</span></div>
                <div>Members: <span className="font-bold text-[var(--text-primary)]">{coop.workers?.length || 0} registered workers</span></div>
                <div>Fund Balance: <span className="font-bold text-[var(--accent)]">₹{coop.fund_balance}</span></div>
              </div>

              {coop.status === 'PENDING' && (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => handleUpdateCoopStatus(coop.id, 'APPROVED')}
                    className="w-1/2 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs shadow-sm transition-all hover:opacity-90"
                  >
                    {t('action_approve')}
                  </button>
                  <button
                    onClick={() => handleUpdateCoopStatus(coop.id, 'REJECTED')}
                    className="w-1/2 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs shadow-sm transition-all"
                  >
                    {t('action_reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Flagged Cooperatives Section */}
      {flaggedCoops.length > 0 ? (
        <section className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-red-500 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Flagged Cooperatives Requiring Ministry Audit</span>
          </div>

          <div className="space-y-2">
            {flaggedCoops.map((coop) => (
              <div key={coop.id} className="p-3 rounded-xl bg-[var(--surface)] border border-red-500/20 flex items-center justify-between text-xs shadow-sm">
                <div>
                  <strong className="text-[var(--text-primary)]">{coop.name}</strong> ({coop.district})
                  <div className="text-[11px] text-red-500 mt-0.5">Reason: {coop.reason}</div>
                </div>
                <div className="text-right font-mono text-[var(--text-secondary)]">
                  Avg Rating: <span className="text-amber-500 font-bold">{coop.avgRating} ★</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 text-emerald-800 text-xs flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('no_flagged_coops')}</span>
        </section>
      )}

    </div>
  );
};

export default GovAdminPortal;
