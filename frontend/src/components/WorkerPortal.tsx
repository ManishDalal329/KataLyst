import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Vote, DollarSign, CheckCircle2, Clock, MapPin, Power, TrendingUp, ShieldCheck, BarChart3, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const WorkerPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'governance'>('jobs');
  
  // Worker Profile & Availability
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  
  // Jobs & Bookings
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [voteChoice, setVoteChoice] = useState<string>('');
  const [votingMsg, setVotingMsg] = useState('');

  useEffect(() => {
    loadWorkerData();
  }, [user]);

  const loadWorkerData = async () => {
    try {
      const bookingsData = await fetchApi('/bookings/mine');
      setMyBookings(bookingsData);

      if (user?.workerProfile) {
        setWorkerProfile(user.workerProfile);
        setIsAvailable(user.workerProfile.availability_status);
        if (user.workerProfile.cooperative_id) {
          loadProposals(user.workerProfile.cooperative_id);
        }
      } else {
        // Fallback fetch coops to get worker profile
        const coops = await fetchApi('/cooperatives');
        if (coops.length > 0 && coops[0].proposals) {
          setProposals(coops[0].proposals || []);
        }
      }
    } catch (e) {
      console.error('Failed to load worker data', e);
    }
  };

  const loadProposals = async (coopId: string) => {
    try {
      const data = await fetchApi(`/cooperatives/${coopId}/proposals`);
      setProposals(data);
    } catch (e) {
      console.error('Failed to load proposals', e);
    }
  };

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    if (workerProfile?.id) {
      try {
        await fetchApi(`/workers/${workerProfile.id}/availability`, {
          method: 'PATCH',
          body: JSON.stringify({ availability_status: nextState })
        });
      } catch (e) {
        console.error('Availability toggle failed', e);
      }
    }
  };

  const updateJobStatus = async (bookingId: string, status: string) => {
    try {
      await fetchApi(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadWorkerData();
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    }
  };

  const handleVoteSubmit = async (proposalId: string) => {
    if (!voteChoice) return;
    setVotingMsg('');
    try {
      await fetchApi(`/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ choice: voteChoice })
      });
      setVotingMsg('Vote cast successfully (1 Member 1 Vote)!');
      setTimeout(() => {
        setVotingMsg('');
        setSelectedProposal(null);
        if (workerProfile?.cooperative_id) {
          loadProposals(workerProfile.cooperative_id);
        }
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Voting failed');
    }
  };

  // Earnings aggregation
  const completedJobs = myBookings.filter(b => b.status === 'COMPLETED');
  const totalEarned = completedJobs.reduce((sum, b) => sum + (b.payout?.worker_share || (b.amount * 0.80)), 0);
  const totalCoopFundContributed = completedJobs.reduce((sum, b) => sum + (b.payout?.cooperative_share || (b.amount * 0.15)), 0);

  const earningsChartData = completedJobs.slice(-6).map((b, idx) => ({
    name: `Job #${idx + 1}`,
    Worker80Pct: Number((b.payout?.worker_share || b.amount * 0.80).toFixed(2)),
    CoopFund15Pct: Number((b.payout?.cooperative_share || b.amount * 0.15).toFixed(2))
  }));

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner: Worker Status & Availability Toggle */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-coop-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">{user?.name || 'Worker Member Dashboard'}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-coop-500/10 text-coop-400 border border-coop-500/30 text-[10px] font-extrabold uppercase">
              VERIFIED MEMBER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Affiliation: <strong className="text-coop-400">{workerProfile?.cooperative?.name || 'Delhi NCR Urban Workers Cooperative'}</strong>
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300">Duty Status:</span>
          <button
            onClick={toggleAvailability}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-md ${
              isAvailable
                ? 'bg-coop-500 text-slate-950 shadow-coop-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isAvailable ? 'AVAILABLE FOR JOBS' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Worker Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'jobs'
              ? 'bg-coop-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Job Requests ({myBookings.filter(b => b.status !== 'COMPLETED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'earnings'
              ? 'bg-coop-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Earnings & 80% Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'governance'
              ? 'bg-coop-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Coop Governance Polls ({proposals.length})</span>
        </button>
      </div>

      {/* Tab 1: Job Feed & Lifecycle Management */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-white">Incoming & Active Job Bookings</h2>

          {myBookings.length === 0 ? (
            <div className="p-8 text-center glass-panel text-slate-400 text-xs rounded-2xl">
              No active job requests. Ensure duty status is set to AVAILABLE to receive matches.
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((job) => {
                const workerShare = job.payout?.worker_share || (job.amount * 0.80);
                return (
                  <div key={job.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                      <div>
                        <span className="font-extrabold text-white text-base">{job.category?.name || 'Service Booking'}</span>
                        <div className="text-xs text-slate-400 mt-0.5">Customer: <strong className="text-slate-200">{job.customer?.name}</strong> ({job.customer?.phone})</div>
                        <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.address}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Your 80% Share:</div>
                        <div className="text-lg font-extrabold text-coop-400">₹{workerShare.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">Gross Total: ₹{job.amount}</div>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        job.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        job.status === 'ACCEPTED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-coop-500/20 text-coop-400 border border-coop-500/30'
                      }`}>
                        Status: {job.status}
                      </span>

                      <div className="flex items-center space-x-2">
                        {job.status === 'REQUESTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'ACCEPTED')}
                            className="px-4 py-1.5 rounded-xl bg-coop-500 hover:bg-coop-400 text-slate-950 text-xs font-extrabold shadow-md"
                          >
                            Accept Job
                          </button>
                        )}

                        {job.status === 'ACCEPTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md"
                          >
                            Start Job
                          </button>
                        )}

                        {job.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg"
                          >
                            Mark Completed (Trigger 80/15/5 Payout)
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Earnings & 80% Payout Ledger */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold">Total Direct Earnings (80%)</div>
              <div className="text-2xl font-extrabold text-coop-400 mt-1">₹{totalEarned.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Released straight to worker bank account</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold">Coop Welfare Contribution (15%)</div>
              <div className="text-2xl font-extrabold text-teal-400 mt-1">₹{totalCoopFundContributed.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Accumulated for member health & grants</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs text-slate-400 font-semibold">Completed Jobs</div>
              <div className="text-2xl font-extrabold text-white mt-1">{completedJobs.length}</div>
              <div className="text-[10px] text-slate-500 mt-1">100% transparent fee calculation</div>
            </div>
          </div>

          {/* Recharts Stacked Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-extrabold text-white">Payout Distribution per Job (80% Worker vs 15% Coop Fund)</h3>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <Bar dataKey="Worker80Pct" name="Worker Share (80%)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CoopFund15Pct" name="Coop Fund (15%)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cooperative Governance (1 Member 1 Vote) */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-coop-500/30 bg-coop-950/20 flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-coop-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-white">Democratic Worker Governance (1 Member = 1 Vote)</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Unlike corporate apps where management dictates prices, every worker member gets equal voting power on rate changes, fund spending, and member approvals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Proposals List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-white">Active Cooperative Proposals</h3>

              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    selectedProposal?.id === prop.id
                      ? 'border-coop-500 bg-coop-950/40 shadow-lg shadow-coop-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-extrabold text-white text-sm">{prop.title}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      prop.status === 'OPEN' ? 'bg-coop-500/20 text-coop-400 border border-coop-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {prop.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{prop.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                    <span>Total Votes Cast: {prop.totalVotes || prop.votes?.length || 0}</span>
                    <span className="text-coop-400 font-bold">Click to Vote / View Results</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Voting & Results Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              {selectedProposal ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold text-coop-400 uppercase tracking-widest">Cooperative Proposal Poll</span>
                    <h3 className="text-lg font-extrabold text-white mt-1">{selectedProposal.title}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedProposal.description}</p>
                  </div>

                  {votingMsg && (
                    <div className="p-3 rounded-xl bg-coop-500/10 border border-coop-500/40 text-coop-400 text-xs font-bold text-center">
                      {votingMsg}
                    </div>
                  )}

                  {/* Cast Vote Form if Open */}
                  {selectedProposal.status === 'OPEN' && (
                    <div className="space-y-3 pt-2 border-t border-slate-900">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Cast Your Member Vote</label>
                      
                      <div className="space-y-2">
                        {(selectedProposal.optionsList || selectedProposal.options.split(',')).map((opt: string, idx: number) => {
                          const optionText = opt.trim();
                          return (
                            <label
                              key={idx}
                              className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                voteChoice === optionText
                                  ? 'border-coop-500 bg-coop-950/60 text-white font-bold'
                                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              <input
                                type="radio"
                                name="voteOption"
                                value={optionText}
                                checked={voteChoice === optionText}
                                onChange={(e) => setVoteChoice(e.target.value)}
                                className="accent-coop-500"
                              />
                              <span className="text-xs">{optionText}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleVoteSubmit(selectedProposal.id)}
                        disabled={!voteChoice}
                        className="w-full py-2.5 rounded-xl bg-coop-500 hover:bg-coop-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-coop-500/20 disabled:opacity-50 transition-all"
                      >
                        Submit Democratic Vote
                      </button>
                    </div>
                  )}

                  {/* Live Results Bar Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-slate-900">
                    <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Live Vote Distribution</h4>

                    {selectedProposal.optionsBreakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300 font-semibold">
                          <span>{item.option}</span>
                          <span className="text-coop-400 font-mono">{item.percentage}% ({item.votes} votes)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-coop-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Select an active proposal on the left to cast your vote or inspect live member poll results.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WorkerPortal;
