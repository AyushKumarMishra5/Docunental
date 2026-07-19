import Link from 'next/link';
import { ArrowRight, FileSearch, GitCompare, BookOpen, Shield, Zap, CheckCircle, Sparkles, Crosshair, Target } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { AppHeader } from '@/components/layout/AppHeader';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 grid-pattern opacity-30" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-accent/5 to-purple-500/10" />
      
      <div className="fixed top-20 left-10 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <AppHeader />
      
      <main className="flex-1 relative z-10">
        <section className="container mx-auto px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-5xl text-center relative">
            <div className="mb-6 relative inline-block">
              <div className="absolute inset-0 bg-accent/20 blur-3xl animate-pulse" />
              <h1 className="font-display text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent via-cyan-300 to-purple-400 mb-2 relative animate-glow tracking-tight">
                DOCUINTEL
              </h1>
              <div className="flex items-center justify-center gap-3 text-sm font-bold text-accent/80 tracking-[0.3em] uppercase">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent" />
                <span>AI Contract Scanner</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent" />
              </div>
            </div>
            
            <p className="text-xl lg:text-2xl text-text-secondary mb-4 max-w-3xl mx-auto font-medium">
              Next-gen AI analysis for contracts & legal docs
            </p>
            <p className="text-base text-text-muted mb-12 max-w-2xl mx-auto">
              Faster than human review. More accurate than legacy tools. Powered by cutting-edge AI.
            </p>
            
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link href="/analyze">
                <Button size="lg" className="relative group overflow-hidden h-14 px-8 bg-gradient-to-r from-accent to-cyan-400 hover:from-cyan-400 hover:to-accent border-2 border-accent/50 shadow-lg shadow-accent/30 text-black font-bold text-base">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <Crosshair className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">START SCAN</span>
                  <ArrowRight className="h-5 w-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="secondary" className="h-14 px-8 border-2 border-accent/30 bg-black/50 hover:bg-accent/10 hover:border-accent/50 text-accent font-bold text-base group">
                  <GitCompare className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  VERSION COMPARE
                </Button>
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-black text-accent mb-1">
                  <span className="inline-block animate-pulse">10</span>x
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Faster Analysis</div>
              </div>
              <div className="text-center border-x border-accent/20">
                <div className="text-3xl font-black text-purple-400 mb-1">99%</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-cyan-400 mb-1">&lt;30s</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Processing Time</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-accent/20 bg-black/40 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-20">
            <h2 className="font-display text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
              COMBAT-READY FEATURES
            </h2>
            <p className="text-center text-text-muted mb-12 max-w-2xl mx-auto">
              Enterprise-grade AI weapons for document warfare
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={<FileSearch className="h-7 w-7" />}
                title="AI SCAN ENGINE"
                description="Multi-layer neural pipeline extracts, analyzes, and delivers risk intel with pinpoint citations."
                color="accent"
              />
              <FeatureCard
                icon={<GitCompare className="h-7 w-7" />}
                title="VERSION DIFF"
                description="Clause-level tracking shows what changed, impact analysis, and risk delta between versions."
                color="purple-400"
              />
              <FeatureCard
                icon={<BookOpen className="h-7 w-7" />}
                title="CUSTOM PLAYBOOKS"
                description="Deploy your standards as baseline. Auto-compare incoming docs against your policies."
                color="cyan-400"
              />
              <FeatureCard
                icon={<Shield className="h-7 w-7" />}
                title="RISK SCORING"
                description="Every threat categorized by severity. Explainable AI reasoning with actionable fixes."
                color="accent"
              />
              <FeatureCard
                icon={<Zap className="h-7 w-7" />}
                title="INSTANT DEPLOY"
                description="Process contracts in seconds. Real-time progress tracking with stage-by-stage visibility."
                color="purple-400"
              />
              <FeatureCard
                icon={<CheckCircle className="h-7 w-7" />}
                title="SOURCE LOCK"
                description="Click any finding to target exact clause location with inline highlighting and context."
                color="cyan-400"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-accent/20 bg-gradient-to-b from-transparent to-accent/5">
          <div className="container mx-auto px-6 py-20">
            <h2 className="font-display text-3xl font-bold text-center mb-3 text-text-primary">
              MISSION PROFILES
            </h2>
            <p className="text-center text-text-muted mb-12">Built for elite enterprise teams</p>
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <UseCaseCard title="LEGAL OPS" description="Contract review & risk assessment" icon={<Shield className="h-6 w-6" />} />
              <UseCaseCard title="COMPLIANCE" description="Policy audit & regulatory checks" icon={<CheckCircle className="h-6 w-6" />} />
              <UseCaseCard title="PROCUREMENT" description="Vendor agreement analysis" icon={<Target className="h-6 w-6" />} />
              <UseCaseCard title="AUDIT TEAM" description="Document verification & comparison" icon={<Sparkles className="h-6 w-6" />} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-accent/20 bg-black/60 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted font-mono">
              DOCUINTEL v2.0 <span className="text-accent">█</span> AI-Powered Contract Intelligence
            </p>
            <p className="text-xs text-text-muted/60 font-mono">
              SYSTEM_STATUS: <span className="text-success">ONLINE</span> | NO_AUTH_REQUIRED
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <div className="group relative flex flex-col items-start p-6 rounded-lg border-2 border-border bg-black/60 hover:bg-black/80 hover:border-accent/50 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      <div className={`relative flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-${color}/20 to-${color}/5 text-${color} mb-4 border border-${color}/30 group-hover:shadow-lg group-hover:shadow-${color}/30 transition-all`}>
        {icon}
      </div>
      <h3 className="relative font-bold text-text-primary mb-2 uppercase tracking-wide text-sm">{title}</h3>
      <p className="relative text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function UseCaseCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative text-center p-6 rounded-lg bg-black/60 border-2 border-border hover:border-accent/50 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent translate-y-0 group-hover:translate-y-full transition-transform duration-1000" />
      
      <div className="relative flex justify-center mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent/50 transition-all">
          {icon}
        </div>
      </div>
      <h4 className="relative font-bold text-text-primary mb-2 uppercase tracking-wider text-sm">{title}</h4>
      <p className="relative text-xs text-text-secondary">{description}</p>
    </div>
  );
}
