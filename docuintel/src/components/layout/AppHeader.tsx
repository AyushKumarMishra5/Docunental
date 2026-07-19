'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSearch, GitCompare, BookOpen, History, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/analyze', label: 'Analyze', icon: FileSearch },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
];

export function AppHeader({ sessionId }: { sessionId?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-purple-500/5" />
      
      <div className="container mx-auto flex h-20 items-center justify-between px-6 relative">
        <Link href="/" className="flex items-center space-x-3 group relative">
          <div className="relative">
            <div className="absolute inset-0 bg-accent blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent/60 shadow-lg shadow-accent/50">
              <Shield className="h-7 w-7 text-black" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-accent via-cyan-300 to-purple-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-accent group-hover:to-cyan-300 transition-all">
              DocuIntel
            </h1>
            <p className="text-[10px] text-accent/60 font-mono tracking-wider uppercase">AI Contract Scanner</p>
          </div>
        </Link>

        <nav className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative group flex items-center space-x-2 rounded-lg px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300",
                  "overflow-hidden",
                  isActive
                    ? "bg-accent/10 text-accent shadow-lg shadow-accent/20"
                    : "text-text-secondary hover:text-accent hover:bg-accent/5"
                )}
              >
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  "bg-gradient-to-r from-transparent via-accent/10 to-transparent",
                  "animate-shimmer"
                )} />
                
                <div className="relative">
                  {isActive && (
                    <div className="absolute inset-0 bg-accent blur-md opacity-50" />
                  )}
                  <Icon className={cn(
                    "h-4 w-4 relative z-10 transition-transform group-hover:scale-110",
                    isActive && "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  )} />
                </div>
                
                <span className="relative z-10">{item.label}</span>
                
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        {sessionId && (
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-success/5">
            <div className="relative">
              <div className="absolute inset-0 bg-success blur-md opacity-50 animate-pulse" />
              <Zap className="h-4 w-4 text-success relative z-10" />
            </div>
            <div>
              <div className="text-xs font-bold text-success uppercase tracking-wider">Active</div>
              <div className="text-[10px] text-success/60 font-mono">Session Live</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </header>
  );
}
