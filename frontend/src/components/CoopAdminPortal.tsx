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
    return <div className="p-8 text-center text-slate-400 text-sm">Loading Cooperative Admin workspace...</div>;
  }

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner: Cooperative Overview & Fund Balance */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-teal-400" />
            <h1 className="text-2xl font-extrabold text-white">{coopData.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-extrabold uppercase">
              {coopData.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reg. No: <strong className="text-slate-200">{coopData.registration_no}</strong> • District: <strong className="text-slate-200">{coopData.district}, {coopData.state}</strong>
          </p>
        </div>

        {/* 15% Accumulated Coop Welfare Fund Balance Card */}
        <div className="glass-panel px-5 py-3 rounded-2xl border border-teal-500/30 bg-teal-950/20 text-right">
          <div className="text-xs font-semibold text-slate-400">Cooperative Reserve Fund (15% Accumulation)</div>
          <div className="text-2xl font-extrabold text-teal-400">₹{coopData.fund_balance.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500">Used for worker health, training & equipment</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'members'
              ? 'bg-teal-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Worker Members ({coopData.workers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'rates'
              ? 'bg-teal-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Service Base Rates Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'proposals'
              ? 'bg-teal-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
            <h2 className="text-base font-extrabold text-white">Cooperative Worker Roster</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Verify Worker Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopData.workers?.map((w: any) => (
              <div key={w.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{w.user?.name}</h3>
                    <p className="text-xs text-slate-400">{w.user?.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                    {w.verification_status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">Skills: <span className="text-slate-400">{w.skills}</span></p>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-900">
                  <span>Rating: <strong className="text-amber-400">★ {w.rating_avg.toFixed(1)}</strong></span>
                  <span>Jobs Completed: {w.bookings?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Worker Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                required
              />
              <input
                type="text"
                placeholder="Phone Number (10 digits)"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                required
              />
              <input
                type="text"
                placeholder="Skills (Comma-separated)"
                value={memberSkills}
                onChange={(e) => setMemberSkills(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold"
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
            <h2 className="text-base font-extrabold text-white">Cooperative Category Rates Configuration</h2>
            <button
              onClick={() => setShowAddRate(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Define Custom Category Base Rate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopData.serviceCategories?.map((cat: any) => (
              <div key={cat.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-extrabold text-white text-sm">{cat.name}</h3>
                <p className="text-xs text-slate-400">{cat.description}</p>
                <div className="text-lg font-extrabold text-teal-400 pt-2 border-t border-slate-900">
                  ₹{cat.base_rate.toFixed(2)} <span className="text-xs font-normal text-slate-500">base rate</span>
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
            <h2 className="text-base font-extrabold text-white">Democratic Governance Proposals</h2>
            <button
              onClick={() => setShowAddProposal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Member Proposal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coopData.proposals?.map((prop: any) => (
              <div key={prop.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-white text-sm">{prop.title}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase">
                    {prop.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{prop.description}</p>
                <div className="text-[11px] text-slate-500 border-t border-slate-900 pt-2">
                  Options: <strong className="text-slate-300">{prop.options}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Proposal Modal */}
      {showAddProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Governance Proposal</h3>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <input
                type="text"
                placeholder="Proposal Title (e.g. Rate revision for Monsoon)"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                required
              />
              <textarea
                placeholder="Detailed proposal description..."
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                rows={3}
                required
              />
              <input
                type="text"
                placeholder="Options (Comma-separated e.g. Yes, No, Abstain)"
                value={proposalOptions}
                onChange={(e) => setProposalOptions(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProposal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold"
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
