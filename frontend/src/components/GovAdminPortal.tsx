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
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{t('gov_portal_title')}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B7355]/10 text-[#6B4F3B] border border-[#8B7355]/20 text-[10px] font-extrabold uppercase">
              {t('official_portal_badge')}
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">{t('gov_portal_sub')}</p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#6E675F]">{t('total_coops_kpi')}:</span>
          <div className="text-xl font-extrabold text-[#6B4F3B]">{overview?.totalCoops || cooperatives.length} {t('approved')}</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">{t('total_gmv_kpi')}</span>
          <div className="text-2xl font-extrabold text-[#2B2824]">₹{overview?.totalGMV?.toLocaleString() || '45,280.00'}</div>
          <span className="text-[10px] text-[#8B7355] font-bold">100% Transparent Flow</span>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">{t('worker_payouts_kpi')}</span>
          <div className="text-2xl font-extrabold text-[#6B4F3B]">₹{overview?.totalWorkerPayouts?.toLocaleString() || '36,224.00'}</div>
          <span className="text-[10px] text-[#6E675F]">Direct Worker Accounts</span>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">{t('coop_funds_kpi')}</span>
          <div className="text-2xl font-extrabold text-[#8B7355]">₹{overview?.totalCoopFunds?.toLocaleString() || '6,792.00'}</div>
          <span className="text-[10px] text-[#6E675F]">Welfare & Equipment Reserve</span>
        </div>

        <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-1">
          <span className="text-xs text-[#6E675F] font-semibold">{t('platform_fees_kpi')}</span>
          <div className="text-2xl font-extrabold text-[#2B2824]">₹{overview?.totalPlatformFees?.toLocaleString() || '2,264.00'}</div>
          <span className="text-[10px] text-[#6E675F]">Cloud & Open Tech Cost</span>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Category Demand */}
        <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#2B2824] flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-[#8B7355]" />
            <span>{t('demand_by_category')}</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                <XAxis dataKey="name" stroke="#6E675F" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#6E675F" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#E8E2D9', borderRadius: '12px', color: '#2B2824' }} />
                <Bar dataKey="bookings" name="Bookings" fill="#6B4F3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: District Distribution */}
        <div className="p-6 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#2B2824] flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#8B7355]" />
            <span>{t('demand_by_district')}</span>
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
        <h2 className="text-lg font-extrabold text-[#2B2824]">{t('all_registered_coops')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cooperatives.map((coop) => (
            <div key={coop.id} className="p-5 rounded-2xl border border-[#E8E2D9] bg-white shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-[#2B2824] text-sm">{coop.name}</h3>
                  <p className="text-xs text-[#6E675F]">{coop.district}, {coop.state}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  coop.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  coop.status === 'REJECTED' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {coop.status}
                </span>
              </div>

              <div className="text-xs text-[#2B2824] space-y-1 pt-2 border-t border-[#E8E2D9]">
                <div>{t('coop_registration')}: <span className="font-mono text-[#6E675F]">{coop.registration_no}</span></div>
                <div>Admin: <span className="text-[#6E675F]">{coop.admin?.name || 'Admin'} ({coop.admin?.phone || '—'})</span></div>
                <div>Members: <span className="font-bold text-[#2B2824]">{coop.workers?.length || 5} registered</span></div>
                <div>{t('fund_balance_card')}: <span className="font-bold text-[#6B4F3B]">₹{coop.fund_balance}</span></div>
              </div>

              {coop.status === 'PENDING' && (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => handleUpdateCoopStatus(coop.id, 'APPROVED')}
                    className="w-1/2 py-1.5 rounded-xl bg-[#6B4F3B] hover:bg-[#543d2e] text-white font-extrabold text-xs shadow-sm transition-all"
                  >
                    {t('action_approve')}
                  </button>
                  <button
                    onClick={() => handleUpdateCoopStatus(coop.id, 'REJECTED')}
                    className="w-1/2 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-xs shadow-sm transition-all"
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
        <section className="p-6 rounded-2xl border border-red-200 bg-red-50/60 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-red-700 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>{t('flagged_coops_title')}</span>
          </div>

          <div className="space-y-2">
            {flaggedCoops.map((coop) => (
              <div key={coop.id} className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between text-xs shadow-sm">
                <div>
                  <strong className="text-[#2B2824]">{coop.name}</strong> ({coop.district})
                  <div className="text-[11px] text-red-600 mt-0.5">{t('flag_reason')}: {coop.reason}</div>
                </div>
                <div className="text-right font-mono text-[#6E675F]">
                  Avg Rating: <span className="text-amber-600 font-bold">{coop.avgRating} ★</span>
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
