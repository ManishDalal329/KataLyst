import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, DollarSign, Vote, Award, CheckCircle2, TrendingUp, Users2, Sparkles, Building2 } from 'lucide-react';

interface LandingPageProps {
  onStartBooking: () => void;
  onExploreGov: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartBooking, onExploreGov }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-slate-950">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-coop-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-coop-500/10 border border-coop-500/30 text-coop-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-4 h-4 text-coop-400" />
            <span>Smart India Hackathon 2026 • Problem Statement 26089</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Fair Household Services Built Around <span className="gradient-text">Worker Cooperatives</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
            {t('hero_desc')}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartBooking}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-coop-600 via-emerald-500 to-teal-400 hover:from-coop-500 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-coop-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <span>Explore Services & Book</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={onExploreGov}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all"
            >
              <Building2 className="w-4 h-4 text-coop-400" />
              <span>Ministry & Admin Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Direct Financial Comparison Matrix */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-coop-400 uppercase tracking-widest">Cooperative Economics</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Why SahakarConnect Disrupts Traditional Gig Platforms</h2>
          <p className="text-xs sm:text-sm text-slate-400">Comparing typical commercial gig apps vs. democratic worker cooperative platform model</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Traditional Gig Platform Card */}
          <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-bl-xl border-l border-b border-red-500/30">
              Corporate Gig Platforms
            </div>
            
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Urban Company / Commercial Apps</span>
            </h3>

            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start space-x-2.5">
                <span className="text-red-400 font-bold">✖</span>
                <span><strong className="text-slate-200">20-30% Commission Fee</strong> taken by corporate shareholders</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-red-400 font-bold">✖</span>
                <span><strong className="text-slate-200">Zero Worker Ownership</strong> — gig workers treated as disposable contractors</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-red-400 font-bold">✖</span>
                <span><strong className="text-slate-200">Arbitrary Rate Drops & Bans</strong> without any democratic right to appeal</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-red-400 font-bold">✖</span>
                <span>No insurance or welfare funds reinvested into worker families</span>
              </li>
            </ul>
          </div>

          {/* SahakarConnect Cooperative Model Card */}
          <div className="glass-panel p-6 rounded-2xl border border-coop-500/40 bg-gradient-to-b from-coop-950/40 to-slate-900/90 relative overflow-hidden shadow-xl shadow-coop-500/10">
            <div className="absolute top-0 right-0 px-3 py-1 bg-coop-500 text-slate-950 text-[10px] font-extrabold uppercase rounded-bl-xl shadow-md">
              SahakarConnect Model
            </div>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-coop-400 animate-ping" />
              <span className="text-coop-400 font-extrabold">SahakarConnect Cooperatives</span>
            </h3>

            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-coop-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">80% Direct to Worker</strong> — maximum earnings per booking</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-coop-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">15% Cooperative Fund</strong> — worker health insurance & equipment grants</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-coop-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">5% Platform Fee</strong> — lean open-technology maintenance</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-coop-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">1-Member-1-Vote Governance</strong> — workers vote on rate revisions</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Feature Pillar Badges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-coop-500/10 border border-coop-500/30 flex items-center justify-center text-coop-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Transparent 80/15/5 Split</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every booking receipt explicitly breaks down worker earnings, cooperative reserve funds, and platform maintenance fee before payment.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Vote className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Democratic Governance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Workers vote on rate changes, equipment investments, and new member approvals. One member equals one vote.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">AI Smart Match Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transparent algorithm ranks workers by proximity, rating, availability, and skill match with clear score tooltips.
          </p>
        </div>

      </section>

    </div>
  );
};

export default LandingPage;
