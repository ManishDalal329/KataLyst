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
    return <div className="p-8 text-center text-[var(--text-secondary)] text-sm">Loading Cooperative Admin workspace...</div>;
  }

  return (
    <div className="space-y-6 py-4">

      {/* Top Banner: Cooperative Overview & Fund Balance */}
      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{coopData.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--border)] text-[var(--accent)] border border-[var(--border)] text-[10px] font-extrabold uppercase">
              {coopData.status}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Reg. No: <strong className="text-[var(--text-primary)]">{coopData.registration_no}</strong> • District: <strong className="text-[var(--text-primary)]">{coopData.district}, {coopData.state}</strong>
          </p>
        </div>

        {/* 15% Accumulated Coop Welfare Fund Balance Card */}
        <div className="px-5 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-right">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Cooperative Reserve Fund (15% Accumulation)</div>
          <div className="text-2xl font-black text-[var(--accent)]">₹{coopData.fund_balance.toFixed(2)}</div>
          <div className="text-[10px] text-[var(--text-secondary)]">Used for worker health, training & equipment</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${activeTab === 'members'
            ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Worker Members ({coopData.workers?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${activeTab === 'rates'
            ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Service Base Rates Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${activeTab === 'proposals'
            ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
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
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">Cooperative Worker Roster</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs shadow-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Verify Worker Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopData.workers?.map((w: any) => (
              <div key={w.id} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-[var(--text-primary)] text-base">{w.user?.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{w.user?.phone}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--border)] text-[var(--accent)] border border-[var(--border)] text-[10px] font-bold uppercase">
                    {w.verification_status}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)]">Skills: <span className="text-[var(--text-primary)]">{w.skills}</span></p>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                  <span>Rating: <strong className="text-amber-500">★ {w.rating_avg.toFixed(1)}</strong></span>
                  <span>Jobs Completed: {w.bookings?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Add New Worker Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <input
                type="text"
                placeholder="Phone Number (10 digits)"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <input
                type="text"
                placeholder="Skills (Comma-separated)"
                value={memberSkills}
                onChange={(e) => setMemberSkills(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="w-1/2 py-2.5 rounded-full bg-[var(--border)] text-[var(--text-secondary)] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] text-xs font-bold shadow-md"
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
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">Cooperative Category Rates Configuration</h2>
            <button
              onClick={() => setShowAddRate(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs shadow-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Define Custom Category Base Rate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopData.serviceCategories?.map((cat: any) => (
              <div key={cat.id} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2 shadow-sm">
                <h3 className="font-extrabold text-[var(--text-primary)] text-base">{cat.name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{cat.description}</p>
                <div className="text-xl font-black text-[var(--accent)] pt-2 border-t border-[var(--border)]">
                  ₹{cat.base_rate.toFixed(2)} <span className="text-xs font-normal text-[var(--text-secondary)]">base rate</span>
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
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">Democratic Governance Proposals</h2>
            <button
              onClick={() => setShowAddProposal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs shadow-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Member Proposal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coopData.proposals?.map((prop: any) => (
              <div key={prop.id} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-[var(--text-primary)] text-sm">{prop.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--border)] text-[var(--accent)] border border-[var(--border)] text-[10px] font-bold uppercase">
                    {prop.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{prop.description}</p>
                <div className="text-[11px] text-[var(--text-secondary)] border-t border-[var(--border)] pt-2">
                  Options: <strong className="text-[var(--text-primary)]">{prop.options}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Proposal Modal */}
      {showAddProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Create New Governance Proposal</h3>
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <input
                type="text"
                placeholder="Proposal Title (e.g. Rate revision for Monsoon)"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <textarea
                placeholder="Detailed proposal description..."
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--accent)]"
                rows={3}
                required
              />
              <input
                type="text"
                placeholder="Options (Comma-separated e.g. Yes, No, Abstain)"
                value={proposalOptions}
                onChange={(e) => setProposalOptions(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProposal(false)}
                  className="w-1/2 py-2.5 rounded-full bg-[var(--border)] text-[var(--text-secondary)] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] text-xs font-bold shadow-md"
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
