import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Layers, UserPlus, DollarSign, Vote, ShieldCheck, Plus, CheckCircle2, Building2 } from 'lucide-react';

export const CoopAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [coopData, setCoopData] = useState<any | null>(null);
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
    try {
      const coops = await fetchApi('/cooperatives');
      if (coops.length > 0) {
        setCoopData(coops[0]);
      }
    } catch (e) {
      console.error('Failed to load coop admin data', e);
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
      alert(e.message || 'Failed to add member');
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
      alert(e.message || 'Failed to set category rate');
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
      alert(e.message || 'Failed to create proposal');
    }
  };

  if (!coopData) {
    return <div className="p-8 text-center text-[#6E675F] text-sm">Loading Cooperative Admin workspace...</div>;
  }

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner: Cooperative Overview & Fund Balance */}
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{coopData.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#6B4F3B] border border-[#E8E2D9] text-[10px] font-extrabold uppercase">
              {coopData.status}
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">
            Reg. No: <strong className="text-[#2B2824]">{coopData.registration_no}</strong> • District: <strong className="text-[#2B2824]">{coopData.district}, {coopData.state}</strong>
          </p>
        </div>

        {/* 15% Accumulated Coop Welfare Fund Balance Card */}
        <div className="px-5 py-3 rounded-2xl border border-[#E8E2D9] bg-[#F4F0EA] text-right">
          <div className="text-xs font-semibold text-[#6E675F]">Cooperative Reserve Fund (15% Accumulation)</div>
          <div className="text-2xl font-black text-[#6B4F3B]">₹{coopData.fund_balance.toFixed(2)}</div>
          <div className="text-[10px] text-[#857E75]">Used for worker health, training & equipment</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'members'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Worker Members ({coopData.workers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'rates'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Service Base Rates Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'proposals'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Democratic Proposals ({coopData.proposals?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Member Management */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#2B2824]">Cooperative Worker Roster</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Verify Worker Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopData.workers?.map((w: any) => (
              <div key={w.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-2 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#2B2824] text-base">{w.user?.name}</h3>
                    <p className="text-xs text-[#6E675F]">{w.user?.phone}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#6B4F3B] border border-[#8B7355]/30 text-[10px] font-bold uppercase">
                    {w.verification_status}
                  </span>
                </div>

                <p className="text-xs text-[#524B43]">Skills: <span className="text-[#6E675F]">{w.skills}</span></p>
                <div className="flex items-center justify-between text-xs text-[#857E75] pt-2 border-t border-[#E8E2D9]">
                  <span>Rating: <strong className="text-amber-600">★ {w.rating_avg.toFixed(1)}</strong></span>
                  <span>Jobs Completed: {w.bookings?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#2B2824]">Add New Worker Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824]"
                required
              />
              <input
                type="text"
                placeholder="Phone Number (10 digits)"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824]"
                required
              />
              <input
                type="text"
                placeholder="Skills (Comma-separated)"
                value={memberSkills}
                onChange={(e) => setMemberSkills(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824]"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="w-1/2 py-2.5 rounded-full bg-[#F4F0EA] text-[#6E675F] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-full bg-[#6B4F3B] text-white text-xs font-bold shadow-md"
                >
                  Register Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Service Rates Matrix */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#2B2824]">Cooperative Category Rates Configuration</h2>
            <button
              onClick={() => setShowAddRate(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Define Custom Category Base Rate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopData.serviceCategories?.map((cat: any) => (
              <div key={cat.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-2 shadow-sm">
                <h3 className="font-extrabold text-[#2B2824] text-base">{cat.name}</h3>
                <p className="text-xs text-[#6E675F]">{cat.description}</p>
                <div className="text-xl font-black text-[#6B4F3B] pt-2 border-t border-[#E8E2D9]">
                  ₹{cat.base_rate.toFixed(2)} <span className="text-xs font-normal text-[#857E75]">base rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Create Proposal */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#2B2824]">Democratic Governance Proposals</h2>
            <button
              onClick={() => setShowAddProposal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Member Proposal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coopData.proposals?.map((prop: any) => (
              <div key={prop.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-[#2B2824] text-sm">{prop.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#6B4F3B] text-[10px] font-bold uppercase">
                    {prop.status}
                  </span>
                </div>
                <p className="text-xs text-[#6E675F]">{prop.description}</p>
                <div className="text-[11px] text-[#857E75] border-t border-[#E8E2D9] pt-2">
                  Options: <strong className="text-[#2B2824]">{prop.options}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Proposal Modal */}
      {showAddProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#2B2824]">Create New Governance Proposal</h3>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <input
                type="text"
                placeholder="Proposal Title (e.g. Rate revision for Monsoon)"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824]"
                required
              />
              <textarea
                placeholder="Detailed proposal description..."
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824]"
                rows={3}
                required
              />
              <input
                type="text"
                placeholder="Options (Comma-separated e.g. Yes, No, Abstain)"
                value={proposalOptions}
                onChange={(e) => setProposalOptions(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#2B2824]"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProposal(false)}
                  className="w-1/2 py-2.5 rounded-full bg-[#F4F0EA] text-[#6E675F] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-full bg-[#6B4F3B] text-white text-xs font-bold shadow-md"
                >
                  Publish Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoopAdminPortal;
