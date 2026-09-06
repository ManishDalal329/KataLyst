import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Layers, UserPlus, DollarSign, Vote, ShieldCheck, Plus, CheckCircle2, Building2, X, Star, AlertCircle, Loader2 } from 'lucide-react';

export const CoopAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [coopData, setCoopData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'rates' | 'proposals'>('members');

  // New Member Form Modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberSkills, setMemberSkills] = useState('Plumbing, Leak Repair');

  // New Rate Form
  const [showAddRate, setShowAddRate] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [baseRate, setBaseRate] = useState('650');

  // New Proposal Form
  const [showAddProposal, setShowAddProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalOptions, setProposalOptions] = useState('Yes, No, Abstain');

  useEffect(() => {
    loadCoopData();
  }, [user]);

  const loadCoopData = async () => {
    setLoading(true);
    try {
      const coops = await fetchApi('/cooperatives');
      if (Array.isArray(coops) && coops.length > 0) {
        setCoopData(coops[0]);
      }
    } catch (e) {
      console.error('Failed to load coop admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coopData) return;
    try {
      await fetchApi(`/cooperatives/${coopData.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          name: memberName,
          phone: memberPhone,
          skills: memberSkills
        })
      });
      setShowAddMember(false);
      setMemberName('');
      setMemberPhone('');
      loadCoopData();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coopData) return;
    try {
      await fetchApi(`/cooperatives/${coopData.id}/rates`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: categoryName,
          description: categoryDesc,
          base_rate: parseFloat(baseRate)
        })
      });
      setShowAddRate(false);
      setCategoryName('');
      loadCoopData();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coopData) return;
    try {
      await fetchApi(`/cooperatives/${coopData.id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          title: proposalTitle,
          description: proposalDesc,
          options: proposalOptions.split(',').map(o => o.trim())
        })
      });
      setShowAddProposal(false);
      setProposalTitle('');
      setProposalDesc('');
      loadCoopData();
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

  const currentCoop = coopData || {
    name: 'Delhi NCR Urban Workers Cooperative',
    registration_no: 'COOP/DEL/2024/0089',
    district: 'Central Delhi',
    state: 'Delhi NCR',
    fund_balance: 4250.0,
    status: 'APPROVED',
    workers: [],
    serviceCategories: [],
    proposals: []
  };

  return (
    <div className="space-y-6 py-4">

      {/* Top Banner: Cooperative Overview & Fund Balance */}
      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{currentCoop.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase">
              {currentCoop.status}
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">
            {t('coop_registration')}: <strong className="font-mono text-[#2B2824]">{currentCoop.registration_no}</strong> • {currentCoop.district}, {currentCoop.state}
          </p>
        </div>

        {/* Cooperative Welfare Fund Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm flex items-center space-x-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#F4F0EA] text-[#6B4F3B] flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <div className="text-[10px] text-[#6E675F] font-bold uppercase">{t('fund_balance_card')}</div>
            <div className="text-xl font-black text-[#6B4F3B]">₹{currentCoop.fund_balance?.toFixed(2) || '4,250.00'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('tab_members')} ({currentCoop.workers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'rates'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{t('tab_rates')} ({currentCoop.serviceCategories?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>{t('tab_proposals')} ({currentCoop.proposals?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Member Workers List & Verification */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#2B2824]">{t('tab_members')}</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('add_member_btn')}</span>
            </button>
          </div>

          {currentCoop.workers?.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl">
              {t('no_members_yet')}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E8E2D9] bg-white overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#6E675F] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">{t('member_name')}</th>
                    <th className="p-4">{t('member_phone')}</th>
                    <th className="p-4">{t('member_skills')}</th>
                    <th className="p-4">{t('member_rating')}</th>
                    <th className="p-4">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9] text-[#2B2824]">
                  {currentCoop.workers?.map((w: any) => (
                    <tr key={w.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="p-4 font-bold flex items-center space-x-2">
                        <span>{w.user?.name || 'Worker'}</span>
                      </td>
                      <td className="p-4 text-[#6E675F] font-mono">{w.user?.phone || '—'}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {w.skills?.split(',').map((s: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-[#F4F0EA] text-[#6B4F3B] text-[10px] font-semibold">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-bold">{w.rating_avg?.toFixed(1) || '5.0'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {w.verification_status || 'VERIFIED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Service Rate Card */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#2B2824]">{t('tab_rates')}</h2>
            <button
              onClick={() => setShowAddRate(true)}
              className="px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('add_rate_btn')}</span>
            </button>
          </div>

          {currentCoop.serviceCategories?.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl">
              {t('no_rates_yet')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCoop.serviceCategories?.map((cat: any) => (
                <div key={cat.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-[#2B2824] text-sm">{cat.name}</h3>
                    <span className="text-lg font-black text-[#6B4F3B]">₹{cat.base_rate}</span>
                  </div>
                  <p className="text-xs text-[#6E675F]">{cat.description || 'Standard cooperative rate schedule'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Governance Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#2B2824]">{t('tab_proposals')}</h2>
            <button
              onClick={() => setShowAddProposal(true)}
              className="px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('create_proposal_btn')}</span>
            </button>
          </div>

          {currentCoop.proposals?.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl">
              {t('no_coop_proposals')}
            </div>
          ) : (
            <div className="space-y-3">
              {currentCoop.proposals?.map((prop: any) => (
                <div key={prop.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-[#2B2824] text-sm">{prop.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      prop.status === 'OPEN' ? 'bg-[#F4F0EA] text-[#6B4F3B] border border-[#8B7355]/30' : 'bg-[#E8E2D9] text-[#6E675F]'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E675F]">{prop.description}</p>
                  <div className="text-[11px] text-[#857E75] pt-1">
                    {t('prop_options_label')}: {prop.options}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <button onClick={() => setShowAddMember(false)} className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#2B2824]">{t('add_member_btn')}</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('member_name')}</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('member_phone')}</label>
                <input
                  type="text"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  placeholder="9876543210"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('member_skills')}</label>
                <input
                  type="text"
                  value={memberSkills}
                  onChange={(e) => setMemberSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all mt-2"
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Rate Modal */}
      {showAddRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <button onClick={() => setShowAddRate(false)} className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#2B2824]">{t('add_rate_btn')}</h3>
            <form onSubmit={handleAddRate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('rate_category_name')}</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  placeholder="e.g. Electrical Appliance Service"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('rate_description')}</label>
                <input
                  type="text"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('rate_base_price')}</label>
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all mt-2"
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showAddProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <button onClick={() => setShowAddProposal(false)} className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#2B2824]">{t('create_proposal_btn')}</h3>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('prop_title_label')}</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('prop_desc_label')}</label>
                <textarea
                  value={proposalDesc}
                  onChange={(e) => setProposalDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E675F] mb-1">{t('prop_options_label')}</label>
                <input
                  type="text"
                  value={proposalOptions}
                  onChange={(e) => setProposalOptions(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all mt-2"
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoopAdminPortal;
