import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Vote, DollarSign, CheckCircle2, Clock, MapPin, Power,
  TrendingUp, ShieldCheck, BarChart3, AlertCircle, Loader2,
  Sparkles, Radio, Ban, X, ArrowRight, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const WorkerPortal: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'governance'>('jobs');

  // Worker Profile & Availability
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Requests Feed (Requirement 4) & Bookings
  const [workerRequests, setWorkerRequests] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [voteChoice, setVoteChoice] = useState<string>('');
  const [votingMsg, setVotingMsg] = useState('');

  // Worker Cancellation / Decline State (Requirement 3)
  const [cancellingRequest, setCancellingRequest] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('Not available now');
  const [declineCustomNotes, setDeclineCustomNotes] = useState<string>('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState<boolean>(false);

  // Worker Payout Adjustment / Completion Form State (Requirement 1)
  const [completingRequest, setCompletingRequest] = useState<any | null>(null);
  const [revisedTotalInput, setRevisedTotalInput] = useState<string>('');
  const [revisedReasonInput, setRevisedReasonInput] = useState<string>('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState<boolean>(false);

  useEffect(() => {
    loadWorkerData();
  }, [user]);

  // WebSocket real-time listener for incoming requests and status changes
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      loadWorkerRequests();
    };

    socket.on('new_service_request', handleUpdate);
    socket.on('request_confirmed', handleUpdate);
    socket.on('request_status_changed', handleUpdate);
    socket.on('global_request_update', handleUpdate);

    return () => {
      socket.off('new_service_request', handleUpdate);
      socket.off('request_confirmed', handleUpdate);
      socket.off('request_status_changed', handleUpdate);
      socket.off('global_request_update', handleUpdate);
    };
  }, []);

  const loadWorkerData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWorkerRequests(),
        loadWorkerBookings()
      ]);

      if (user?.workerProfile) {
        setWorkerProfile(user.workerProfile);
        setIsAvailable(user.workerProfile.availability_status);
        if (user.workerProfile.cooperative_id) {
          loadProposals(user.workerProfile.cooperative_id);
        }
      } else {
        const coops = await fetchApi('/cooperatives');
        if (coops.length > 0) {
          if (coops[0].proposals) {
            setProposals(coops[0].proposals || []);
          }
          if (coops[0].id) {
            loadProposals(coops[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load worker data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkerRequests = async () => {
    try {
      const data = await fetchApi('/requests/worker-feed');
      if (Array.isArray(data)) {
        setWorkerRequests(data);
      }
    } catch (e) {
      console.error('Failed to load worker feed requests', e);
    }
  };

  const loadWorkerBookings = async () => {
    try {
      const bookingsData = await fetchApi('/bookings/mine');
      if (Array.isArray(bookingsData)) {
        setMyBookings(bookingsData);
      }
    } catch (e) {
      console.error('Failed to load worker bookings', e);
    }
  };

  const loadProposals = async (coopId: string) => {
    try {
      const data = await fetchApi(`/cooperatives/${coopId}/proposals`);
      if (Array.isArray(data)) {
        setProposals(data);
        if (data.length > 0 && !selectedProposal) {
          setSelectedProposal(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load proposals', e);
    }
  };

  // 4. Availability Toggle (Manual Only - Not Session/App-Open Based)
  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    if (workerProfile) {
      const updatedWp = { ...workerProfile, availability_status: nextState };
      setWorkerProfile(updatedWp);
      if (updateProfile) {
        updateProfile({ workerProfile: updatedWp });
      }
    }
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
    loadWorkerRequests();
  };

  // Worker Action: Accept Request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await fetchApi(`/requests/${requestId}/accept`, {
        method: 'POST'
      });
      loadWorkerRequests();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  // Worker Action: Decline Request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      await fetchApi(`/requests/${requestId}/decline`, {
        method: 'POST'
      });
      loadWorkerRequests();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  // Worker Action: Start Work
  const handleStartWork = async (requestId: string) => {
    try {
      await fetchApi(`/requests/${requestId}/start`, {
        method: 'POST'
      });
      loadWorkerRequests();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  // Worker Action: Open Completion & Price Adjustment Form (Requirement 1)
  const openCompletionModal = (reqItem: any) => {
    setCompletingRequest(reqItem);
    setRevisedTotalInput(reqItem.amount.toString());
    setRevisedReasonInput('');
  };

  const handleCompleteWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRequest) return;

    const numRevised = Number(revisedTotalInput);
    if (isNaN(numRevised) || numRevised <= 0) {
      alert('Revised customer total must be a positive number.');
      return;
    }

    const isPriceChanged = Math.abs(numRevised - completingRequest.amount) > 0.01;
    if (isPriceChanged && !revisedReasonInput.trim()) {
      alert('Reason for price change is required when modifying the quoted amount.');
      return;
    }

    setIsSubmittingCompletion(true);
    try {
      await fetchApi(`/requests/${completingRequest.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          proposedTotal: numRevised,
          proposedReason: isPriceChanged ? revisedReasonInput.trim() : ''
        })
      });
      setCompletingRequest(null);
      setRevisedTotalInput('');
      setRevisedReasonInput('');
      await loadWorkerRequests();
      await loadWorkerBookings();
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // 5. Worker Cancellation / Decline (Requirement 3)
  const handleWorkerCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingRequest) return;

    setIsSubmittingCancellation(true);
    try {
      await fetchApi(`/requests/${cancellingRequest.id}/worker-cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason: declineReason,
          notes: declineReason === 'Other' ? declineCustomNotes.trim() : ''
        })
      });
      setCancellingRequest(null);
      setDeclineReason('Not available now');
      setDeclineCustomNotes('');
      loadWorkerRequests();
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsSubmittingCancellation(false);
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
      setVotingMsg(t('vote_recorded_success'));
      setTimeout(() => {
        setVotingMsg('');
        if (workerProfile?.cooperative_id) {
          loadProposals(workerProfile.cooperative_id);
        }
      }, 1500);
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  // Earnings aggregation
  const completedBookings = myBookings.filter(b => b.status === 'COMPLETED');
  const totalEarned = completedBookings.reduce((sum, b) => sum + (b.payout?.worker_share || (b.amount * 0.80)), 0);
  const totalCoopFundContributed = completedBookings.reduce((sum, b) => sum + (b.payout?.cooperative_share || (b.amount * 0.15)), 0);

  const earningsChartData = (completedBookings.length > 0 ? completedBookings.slice(-6) : [
    { amount: 499, payout: { worker_share: 399.20, cooperative_share: 74.85 } },
    { amount: 699, payout: { worker_share: 559.20, cooperative_share: 104.85 } },
    { amount: 549, payout: { worker_share: 439.20, cooperative_share: 82.35 } }
  ]).map((b, idx) => ({
    name: `Job #${idx + 1}`,
    Worker80Pct: Number((b.payout?.worker_share || b.amount * 0.80).toFixed(2)),
    CoopFund15Pct: Number((b.payout?.cooperative_share || b.amount * 0.15).toFixed(2))
  }));

  const pendingRequestsCount = workerRequests.filter(r => r.workerSpecificStatus === 'Pending').length;

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner: Worker Status & Availability Toggle */}
      <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{user?.name || t('worker_portal_title')}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#6B4F3B] border border-[#E8E2D9] text-[10px] font-extrabold uppercase">
              {t('verified')}
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">
            {workerProfile?.cooperative?.name || 'Delhi NCR Urban Workers Cooperative'} • Skills: {workerProfile?.skills || 'Plumbing, Repair'}
          </p>
        </div>

        {/* 4. Manual Availability Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D9]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold text-[#2B2824]">Status:</span>
            <button
              onClick={toggleAvailability}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-extrabold text-xs transition-all shadow-sm ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  : 'bg-[#E8E2D9] hover:bg-[#D5CCBF] text-[#6E675F]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isAvailable ? t('avail_toggle_online') : t('avail_toggle_offline')}</span>
            </button>
          </div>
          <span className="text-[10px] text-[#857E75]">
            Manual toggle drives live online customer count
          </span>
        </div>
      </div>

      {/* Worker Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'jobs'
              ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {t('tab_requests_pool')} ({workerRequests.length})
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-[#2B2824] rounded-full text-[10px] font-black">
                {pendingRequestsCount} new
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('tab_earnings')}</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'governance'
              ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>{t('tab_governance')} ({proposals.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B7355]" />
          <p className="text-xs text-[#857E75] font-semibold">{t('loading')}</p>
        </div>
      ) : null}

      {/* Tab 1: Requests Feed & Lifecycle Management */}
      {!loading && activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#2B2824]">
                Field Service Requests
              </h2>
              <p className="text-xs text-[#6E675F]">
                Open indefinitely until confirmed or cancelled. Faster acceptances reward first responders.
              </p>
            </div>
            <button
              onClick={loadWorkerRequests}
              className="text-xs font-extrabold text-[#6B4F3B] hover:underline"
            >
              Refresh Feed
            </button>
          </div>

          {!isAvailable ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl space-y-2">
              <Power className="w-8 h-8 text-amber-600 mx-auto opacity-70" />
              <div className="font-bold text-sm text-[#2B2824]">You are currently Offline</div>
              <p className="max-w-md mx-auto">
                Switch your Duty Status toggle to &quot;Available Now&quot; at the top to receive new matching service requests.
              </p>
            </div>
          ) : workerRequests.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl space-y-2">
              <AlertCircle className="w-8 h-8 text-[#8B7355] mx-auto opacity-50" />
              <div className="font-bold text-sm text-[#2B2824]">No Service Requests Available</div>
              <p className="max-w-md mx-auto">
                No active customer requests in your specialized service fields right now. Keep your status set to &quot;Available Now&quot; to receive new broadcast alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workerRequests.map((reqItem) => {
                const status = reqItem.workerSpecificStatus;
                const payout = reqItem.payoutBreakdown;

                return (
                  <div
                    key={reqItem.id}
                    className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-3 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-[#2B2824] text-base">
                            {reqItem.category?.name} • <span className="text-[#6B4F3B]">{reqItem.problem_type}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-[#E8E2D9] text-[#6E675F]">
                            {reqItem.work_level} Level
                          </span>
                        </div>

                        <div className="text-xs text-[#6E675F] mt-1 flex flex-wrap items-center gap-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-[#8B7355]" />
                            <span>
                              {new Date(reqItem.scheduled_time).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-[#8B7355]" />
                            <span>{reqItem.address}</span>
                          </div>
                        </div>

                        {reqItem.instructions && (
                          <p className="text-[11px] text-[#857E75] mt-1 italic">
                            &quot;{reqItem.instructions}&quot;
                          </p>
                        )}
                      </div>

                      {/* Transparent 80% Payout Badge */}
                      <div className="text-right bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D9]">
                        <div className="text-[10px] font-bold text-[#6E675F] uppercase">
                          {t('worker_share_label')}
                        </div>
                        <div className="text-lg font-black text-[#6B4F3B]">
                          ₹{payout?.workerShare?.toFixed(2) || (reqItem.amount * 0.8).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#857E75]">
                          Customer Total: ₹{reqItem.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Status Badges */}
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          status === 'Pending' ? 'bg-stone-100 text-stone-700 border border-stone-200' :
                          status === 'Accepted' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          status === 'In Progress' ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' :
                          status === 'Pending Price Approval' ? 'bg-purple-100 text-purple-900 border border-purple-300 animate-pulse' :
                          status === 'Completed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          status === 'Cancelled' ? 'bg-red-50 text-red-800 border border-red-200' :
                          'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}>
                          {status === 'Pending' ? 'Pending (Open to Accept)' :
                           status === 'Accepted' ? 'Accepted (Awaiting Customer Confirmation)' :
                           status === 'Confirmed' ? 'Confirmed (Customer Selected You!)' :
                           status === 'Pending Price Approval' ? 'Waiting for customer to approve revised amount' :
                           status === 'Closed' ? 'Closed (Customer picked another member)' :
                           status}
                        </span>

                        {status === 'Closed' && (
                          <span className="text-[11px] text-[#857E75]">
                            {t('request_closed_notice')}
                          </span>
                        )}

                        {status === 'Cancelled' && reqItem.cancellationReason && (
                          <span className="text-[11px] text-red-600">
                            Reason: &quot;{reqItem.cancellationReason}&quot;
                          </span>
                        )}
                      </div>

                      {/* Action Buttons based on status */}
                      <div className="flex items-center space-x-2">
                        {/* 1. Pending: Worker can Accept or Decline */}
                        {status === 'Pending' && (
                          reqItem.isQueueFull ? (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                              This request is currently fully staffed. You&apos;ll be notified if a spot opens from a cancellation.
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(reqItem.id)}
                                className="px-4 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white text-xs font-extrabold shadow-sm transition-all"
                              >
                                {t('action_accept')}
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(reqItem.id)}
                                className="px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200"
                              >
                                Decline
                              </button>
                            </>
                          )
                        )}

                        {/* 2. Accepted: Can cancel acceptance before confirmed */}
                        {status === 'Accepted' && (
                          <button
                            onClick={() => setCancellingRequest(reqItem)}
                            className="px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-700 text-[#6E675F] text-xs font-bold transition-all border border-[#E8E2D9]"
                          >
                            Withdraw Acceptance
                          </button>
                        )}

                        {/* 3. Confirmed: Start Work or Cancel */}
                        {status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => setCancellingRequest(reqItem)}
                              className="px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-700 text-[#6E675F] text-xs font-bold transition-all border border-[#E8E2D9]"
                            >
                              Cancel Booking
                            </button>
                            <button
                              onClick={() => handleStartWork(reqItem.id)}
                              className="px-4 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm transition-all"
                            >
                              {t('action_start')}
                            </button>
                          </>
                        )}

                        {/* 4. In Progress: Complete Work (opens adjustment form) */}
                        {status === 'In Progress' && (
                          <button
                            onClick={() => openCompletionModal(reqItem)}
                            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark as Completed</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pending Price Approval Details Box for Worker (Requirement 3) */}
                    {status === 'Pending Price Approval' && (
                      <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs space-y-1">
                        <div className="font-extrabold flex items-center space-x-1.5 text-purple-900">
                          <Clock className="w-4 h-4 text-purple-700 animate-spin" />
                          <span>Waiting for customer to approve revised amount</span>
                        </div>
                        <div className="text-[11px] text-purple-800">
                          Proposed Total: <strong>₹{reqItem.proposed_total?.toFixed(2)}</strong> (Worker Payout: ₹{((reqItem.proposed_total || 0) * 0.8).toFixed(2)})
                        </div>
                        <div className="text-[11px] text-purple-800 italic">
                          Reason: &quot;{reqItem.proposed_reason}&quot;
                        </div>
                      </div>
                    )}

                    {/* Customer Rejection Callout Box for Worker (Requirement 5) */}
                    {status === 'In Progress' && reqItem.price_rejection_note && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                        <div className="font-extrabold text-amber-900 flex items-center space-x-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Customer Rejected Previous Price Proposal</span>
                        </div>
                        <div className="text-[11px] text-amber-800">
                          Note: &quot;{reqItem.price_rejection_note}&quot;
                        </div>
                        <div className="text-[11px] text-amber-800">
                          You can now mark the job completed at the original quoted amount (₹{reqItem.amount.toFixed(2)}) or submit a new revised proposal after discussing with the customer.
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Earnings & 80% Payout Ledger */}
      {!loading && activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">{t('worker_share_kpi')}</div>
              <div className="text-2xl font-black text-[#6B4F3B] mt-1">
                ₹{totalEarned > 0 ? totalEarned.toFixed(2) : '3,840.00'}
              </div>
              <div className="text-[10px] text-[#857E75] mt-1">{t('payout_status_released')}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">{t('coop_fund_share')}</div>
              <div className="text-2xl font-black text-[#8B7355] mt-1">
                ₹{totalCoopFundContributed > 0 ? totalCoopFundContributed.toFixed(2) : '720.00'}
              </div>
              <div className="text-[10px] text-[#857E75] mt-1">{t('welfare_fund_desc')}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">{t('completed_jobs_kpi')}</div>
              <div className="text-2xl font-black text-[#2B2824] mt-1">{completedBookings.length || 8}</div>
              <div className="text-[10px] text-[#857E75] mt-1">100% transparent fee calculation</div>
            </div>
          </div>

          {/* Recharts Stacked Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] space-y-3 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#2B2824]">{t('payout_architecture_title')}</h3>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                  <XAxis dataKey="name" stroke="#6E675F" fontSize={11} />
                  <YAxis stroke="#6E675F" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#E8E2D9', borderRadius: '12px', color: '#2B2824' }} />
                  <Bar dataKey="Worker80Pct" name={t('worker_gets_share')} fill="#6B4F3B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CoopFund15Pct" name={t('coop_fund_share')} fill="#8B7355" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cooperative Governance (1 Member 1 Vote) */}
      {!loading && activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-[#2B2824]">{t('governance_title')}</h3>
              <p className="text-xs text-[#524B43] mt-0.5">
                {t('governance_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Proposals List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#2B2824]">{t('open_proposals_title')}</h3>

              {proposals.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl">
                  {t('no_proposals')}
                </div>
              ) : (
                proposals.map((prop) => (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedProposal(prop)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                      selectedProposal?.id === prop.id
                        ? 'border-[#6B4F3B] bg-[#F4F0EA] shadow-md'
                        : 'border-[#E8E2D9] bg-white hover:border-[#8B7355]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-extrabold text-[#2B2824] text-sm">{prop.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        prop.status === 'OPEN' ? 'bg-[#F4F0EA] text-[#6B4F3B] border border-[#8B7355]/30' : 'bg-[#E8E2D9] text-[#6E675F]'
                      }`}>
                        {prop.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#6E675F] line-clamp-2">{prop.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#857E75] pt-2 border-t border-[#E8E2D9]">
                      <span>{t('cast_vote')}</span>
                      <span className="text-[#6B4F3B] font-bold">{t('live_results')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Voting & Results Panel */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-sm">
              {selectedProposal ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">{t('governance_title')}</span>
                    <h3 className="text-lg font-extrabold text-[#2B2824] mt-1">{selectedProposal.title}</h3>
                    <p className="text-xs text-[#524B43] mt-2 leading-relaxed">{selectedProposal.description}</p>
                  </div>

                  {votingMsg && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center">
                      {votingMsg}
                    </div>
                  )}

                  {/* Cast Vote Form if Open */}
                  {selectedProposal.status === 'OPEN' && (
                    <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
                      <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                        {t('cast_vote')}
                      </label>
                      
                      <div className="space-y-2">
                        {(selectedProposal.optionsList || selectedProposal.options.split(',')).map((opt: string, idx: number) => {
                          const optionText = opt.trim();
                          return (
                            <label
                              key={idx}
                              className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                voteChoice === optionText
                                  ? 'border-[var(--accent)] bg-[var(--bg)] text-[var(--text-primary)] font-bold'
                                  : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--border)]/30'
                              }`}
                            >
                              <input
                                type="radio"
                                name="voteOption"
                                value={optionText}
                                checked={voteChoice === optionText}
                                onChange={(e) => setVoteChoice(e.target.value)}
                                className="accent-[var(--accent)]"
                              />
                              <span className="text-xs">{optionText}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleVoteSubmit(selectedProposal.id)}
                        disabled={!voteChoice}
                        className="w-full py-3 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-extrabold text-xs shadow-md disabled:opacity-50 transition-all"
                      >
                        {t('submit_vote_btn')}
                      </button>
                    </div>
                  )}

                  {/* Live Results Bar Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
                    <h4 className="text-xs font-extrabold text-[#6E675F] uppercase tracking-wider">{t('live_results')}</h4>

                    {selectedProposal.optionsBreakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-[var(--text-primary)] font-semibold">
                          <span>{item.option}</span>
                          <span className="text-[var(--accent)] font-mono">{item.percentage}% ({item.votes} votes)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
                          <div
                            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-[#857E75] text-xs">
                  {t('no_proposals')}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 5. Modal: Worker Decline/Cancellation with Optional Reason Dropdown (Requirement 3) */}
      {cancellingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <button
              onClick={() => {
                setCancellingRequest(null);
                setDeclineReason('Not available now');
                setDeclineCustomNotes('');
              }}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#2B2824]">Decline Job Acceptance</h3>
              <p className="text-xs text-[#6E675F] mt-0.5">
                {cancellingRequest.category?.name} • {cancellingRequest.problem_type}
              </p>
            </div>

            <form onSubmit={handleWorkerCancel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                  Reason for Declining (Optional)
                </label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B] shadow-sm"
                >
                  <option value="Not available now">Not available now</option>
                  <option value="Too far">Too far</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {declineReason === 'Other' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-[#8B7355] uppercase tracking-wider">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={declineCustomNotes}
                    onChange={(e) => setDeclineCustomNotes(e.target.value)}
                    placeholder="e.g., Prior commitment ran late"
                    className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                    rows={2}
                  />
                </div>
              )}

              <p className="text-[11px] text-[#857E75]">
                Declining frees this slot so another waiting cooperative member can be accepted and confirmed.
              </p>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingRequest(null);
                    setDeclineReason('Not available now');
                    setDeclineCustomNotes('');
                  }}
                  className="flex-1 py-2.5 rounded-full border border-[#E8E2D9] text-xs font-bold text-[#6E675F] hover:bg-[#F4F0EA]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancellation}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingCancellation ? t('loading') : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Worker Mark as Completed & Payout Adjustment Form (Requirement 1) */}
      {completingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-5">
            <button
              onClick={() => setCompletingRequest(null)}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824] p-1.5 rounded-full hover:bg-[#F4F0EA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-extrabold text-[#8B7355] uppercase tracking-widest">
                Job Completion & Payout Adjustment
              </span>
              <h3 className="text-xl font-extrabold text-[#2B2824] mt-0.5">
                Mark Service as Completed
              </h3>
              <p className="text-xs text-[#6E675F]">
                {completingRequest.category?.name} • {completingRequest.problem_type}
              </p>
            </div>

            {/* Read-Only Original Payout Info (Requirement 1) */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1 text-xs">
              <div className="flex justify-between text-[#6E675F]">
                <span>Original Customer Total:</span>
                <strong className="text-[#2B2824]">₹{completingRequest.amount.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-[#6B4F3B] font-extrabold">
                <span>Original Payout (80%):</span>
                <span>Original: ₹{(completingRequest.amount * 0.8).toFixed(2)} (80% of ₹{completingRequest.amount.toFixed(2)})</span>
              </div>
            </div>

            <form onSubmit={handleCompleteWorkSubmit} className="space-y-4">
              {/* Revised Customer Total Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                  Revised Customer Total (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={revisedTotalInput}
                  onChange={(e) => setRevisedTotalInput(e.target.value)}
                  placeholder="e.g. 748.50"
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-sm font-extrabold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B] shadow-sm"
                  required
                />
                {Number(revisedTotalInput) > 0 && Math.abs(Number(revisedTotalInput) - completingRequest.amount) > 0.01 && (
                  <div className="text-[11px] font-extrabold text-[#6B4F3B] pt-0.5">
                    Revised Worker Payout (80%): ₹{(Number(revisedTotalInput) * 0.8).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Reason for change (Required if amount changed) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                    Reason for Change {Math.abs(Number(revisedTotalInput) - completingRequest.amount) > 0.01 ? '*' : '(Optional)'}
                  </label>
                  {Math.abs(Number(revisedTotalInput) - completingRequest.amount) > 0.01 && (
                    <span className="text-[10px] text-amber-700 font-extrabold">Customer Approval Required</span>
                  )}
                </div>
                <textarea
                  value={revisedReasonInput}
                  onChange={(e) => setRevisedReasonInput(e.target.value)}
                  placeholder="e.g. Additional pipe section needed replacement, not visible during initial assessment."
                  className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  rows={3}
                  required={Math.abs(Number(revisedTotalInput) - completingRequest.amount) > 0.01}
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingRequest(null)}
                  className="flex-1 py-3 rounded-full border border-[#E8E2D9] text-xs font-bold text-[#6E675F] hover:bg-[#F4F0EA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCompletion}
                  className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isSubmittingCompletion ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>
                      {Math.abs(Number(revisedTotalInput) - completingRequest.amount) > 0.01
                        ? 'Send for customer approval'
                        : 'Mark completed'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkerPortal;
