import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Star, Sparkles, CheckCircle2, Clock, Calendar, Info, ShieldCheck, DollarSign, X } from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { user, quickLoginAs } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  
  // Selected Worker for Booking Modal
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [bookingAddress, setBookingAddress] = useState('Flat 402, Green Park Heights, Sector 14');
  const [instructions, setInstructions] = useState('Please bring standard tools');
  const [bookingTime, setBookingTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Active Customer Bookings & Socket
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [ratingBooking, setRatingBooking] = useState<any | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('Excellent service!');

  // Tooltip hover state for AI match explanation
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadWorkers('');
    if (user) {
      loadMyBookings();
    }
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('global_booking_update', () => {
      if (user) loadMyBookings();
    });
    return () => {
      socket.off('global_booking_update');
    };
  }, [user]);

  const loadCategories = async () => {
    try {
      const data = await fetchApi('/categories');
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadWorkers = async (catName: string) => {
    setLoadingWorkers(true);
    try {
      const query = catName ? `?category=${encodeURIComponent(catName)}` : '';
      const data = await fetchApi(`/workers/search${query}`);
      setWorkers(data);
    } catch (e) {
      console.error('Failed to search workers', e);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const data = await fetchApi('/bookings/mine');
      setMyBookings(data);
    } catch (e) {
      console.error('Failed to load my bookings', e);
    }
  };

  const handleCategoryClick = (catName: string) => {
    const newCat = selectedCategory === catName ? '' : catName;
    setSelectedCategory(newCat);
    loadWorkers(newCat);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Quick login as customer if not authenticated
      await quickLoginAs('9900112233', 'CUSTOMER');
    }

    setIsSubmitting(true);
    setBookingSuccessMsg('');
    try {
      const baseAmount = selectedWorker.categoryAmount || 699.0;
      await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          worker_id: selectedWorker.id,
          category_id: selectedWorker.categoryId || categories[0]?.id,
          scheduled_time: bookingTime,
          address: bookingAddress,
          instructions,
          amount: baseAmount
        })
      });

      setBookingSuccessMsg('Booking requested successfully! Worker notified.');
      setTimeout(() => {
        setSelectedWorker(null);
        setBookingSuccessMsg('');
        loadMyBookings();
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Failed to request booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingBooking) return;
    try {
      await fetchApi(`/bookings/${ratingBooking.id}/rate`, {
        method: 'POST',
        body: JSON.stringify({
          score: ratingScore,
          comment: ratingComment
        })
      });
      setRatingBooking(null);
      loadMyBookings();
    } catch (e: any) {
      alert(e.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Category Selection Carousel/Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white">Browse Household & Community Services</h2>
            <p className="text-xs text-slate-400">Select a category to view smart AI-ranked cooperative workers near you</p>
          </div>
          {selectedCategory && (
            <button
              onClick={() => handleCategoryClick('')}
              className="text-xs font-semibold text-coop-400 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-center glass-panel ${
                  isSelected
                    ? 'border-coop-500 bg-coop-950/40 shadow-lg shadow-coop-500/10'
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="text-xs font-bold text-white mb-1 truncate">{cat.name}</div>
                <div className="text-[11px] font-extrabold text-coop-400">₹{cat.base_rate} base</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Smart Match Workers List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-coop-400 animate-pulse" />
            <h2 className="text-lg font-extrabold text-white">
              AI Smart-Ranked Cooperative Workers {selectedCategory && `(${selectedCategory})`}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Ranked by Proximity (40%), Rating (30%), Availability (20%), Skill (10%)</span>
        </div>

        {loadingWorkers ? (
          <div className="p-8 text-center text-slate-400 text-sm">Searching cooperative worker database...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => {
              const matchedCategoryObj = categories.find(c => selectedCategory ? c.name === selectedCategory : true) || categories[0];
              const categoryAmount = matchedCategoryObj ? matchedCategoryObj.base_rate : 699.0;
              const categoryId = matchedCategoryObj ? matchedCategoryObj.id : '';

              return (
                <div
                  key={worker.id}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 relative"
                >
                  
                  {/* Top Bar: Worker Name & Match Score Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-base">{worker.user?.name || 'Worker Member'}</h3>
                      <p className="text-xs text-coop-400 font-semibold">{worker.cooperative?.name}</p>
                      <div className="flex items-center space-x-1 mt-1 text-slate-400 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{worker.cooperative?.district}, {worker.cooperative?.state}</span>
                      </div>
                    </div>

                    {/* Smart Match Score Badge with Tooltip */}
                    <div className="relative">
                      <div
                        onMouseEnter={() => setActiveTooltipId(worker.id)}
                        onMouseLeave={() => setActiveTooltipId(null)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-coop-600/20 to-emerald-500/20 border border-coop-500/40 text-coop-300 text-xs font-extrabold cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-coop-400" />
                        <span>{worker.matchScore || 92}% Match</span>
                        <Info className="w-3 h-3 text-slate-400 ml-0.5" />
                      </div>

                      {/* Tooltip Popup explaining scoring logic transparency */}
                      {activeTooltipId === worker.id && worker.matchBreakdown && (
                        <div className="absolute right-0 top-8 z-30 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-[11px] text-slate-300 space-y-1.5 pointer-events-none">
                          <div className="font-bold text-white text-xs border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
                            <span>Smart Matching Transparency</span>
                            <span className="text-coop-400">{worker.matchScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Proximity Score (40%):</span>
                            <span className="font-mono text-white">{worker.matchBreakdown.proximityScore}% ({worker.matchBreakdown.distanceKm}km)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rating Score (30%):</span>
                            <span className="font-mono text-white">{worker.matchBreakdown.ratingScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Availability (20%):</span>
                            <span className="font-mono text-white">{worker.matchBreakdown.availabilityScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exact Skill Match (10%):</span>
                            <span className="font-mono text-white">{worker.matchBreakdown.skillMatchScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills tags & rating */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.split(',').map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                      <div className="flex items-center space-x-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{worker.rating_avg.toFixed(1)}</span>
                        <span className="text-slate-500 font-normal text-[11px]">(15+ bookings)</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Rate: </span>
                        <span className="text-sm font-extrabold text-white">₹{categoryAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => {
                      setSelectedWorker({
                        ...worker,
                        categoryAmount,
                        categoryId
                      });
                    }}
                    className="w-full py-2.5 rounded-xl bg-coop-500 hover:bg-coop-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-coop-500/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Book Service & View Breakdown</span>
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking Transparent Price Breakdown Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl">
            
            <button
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-white">Confirm Booking & Transparent Pricing</h3>
              <p className="text-xs text-slate-400 mt-0.5">Booking with {selectedWorker.user?.name} ({selectedWorker.cooperative?.name})</p>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 rounded-xl bg-coop-500/10 border border-coop-500/40 text-coop-400 text-sm font-bold text-center">
                {bookingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                
                {/* Address & Instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Service Address</label>
                  <input
                    type="text"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-coop-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Instructions / Notes</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-coop-500"
                  />
                </div>

                {/* 80/15/5 Payout Breakdown Card */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-coop-500/30 space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-coop-400 border-b border-slate-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-coop-400" />
                    <span>Transparent Payout Guarantee (Cooperative Model)</span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Worker Direct Share (80%):</span>
                    <span className="font-bold text-emerald-400">₹{(selectedWorker.categoryAmount * 0.80).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Cooperative Welfare Fund (15%):</span>
                    <span className="font-bold text-teal-400">₹{(selectedWorker.categoryAmount * 0.15).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Platform Tech Maintenance (5%):</span>
                    <span className="font-bold text-slate-400">₹{(selectedWorker.categoryAmount * 0.05).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Total Service Rate:</span>
                    <span className="text-coop-400 text-base">₹{selectedWorker.categoryAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-coop-600 via-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-coop-500/25 transition-all"
                >
                  {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking & Notify Worker'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Customer Booking History & Real-Time Status Tracker */}
      {user && (
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-extrabold text-white">My Active & Past Bookings</h2>

          {myBookings.length === 0 ? (
            <div className="p-6 rounded-2xl glass-panel text-center text-slate-400 text-xs">
              No bookings requested yet. Click "Book Service" above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-sm">{b.category?.name || 'Household Service'}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        b.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        b.status === 'ACCEPTED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">Worker: <strong className="text-slate-200">{b.worker?.user?.name}</strong> ({b.worker?.cooperative?.name})</p>
                    <p className="text-[11px] text-slate-500">{b.address}</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-coop-400">₹{b.amount}</div>
                      {b.payout && (
                        <div className="text-[10px] text-slate-400">Worker 80%: ₹{b.payout.worker_share}</div>
                      )}
                    </div>

                    {b.status === 'COMPLETED' && !b.rating && (
                      <button
                        onClick={() => setRatingBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-bold transition-all"
                      >
                        Rate Service
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Rating Modal */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl space-y-4">
            <button
              onClick={() => setRatingBooking(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white text-center">Rate Your Service Experience</h3>

            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  onClick={() => setRatingScore(s)}
                  className={`w-8 h-8 cursor-pointer transition-all ${
                    s <= ratingScore ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-coop-500"
              rows={3}
              placeholder="Leave feedback..."
            />

            <button
              onClick={handleRatingSubmit}
              className="w-full py-2.5 rounded-xl bg-coop-500 text-slate-950 font-bold text-xs shadow-lg"
            >
              Submit Rating & Review
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPortal;
