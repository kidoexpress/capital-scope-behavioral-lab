import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type React from 'react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { MARKETS, getMarketStatus } from '../../config/markets';
import {
  TrendingUp, Briefcase, ShieldCheck,
  FlaskConical, Zap, Star,
  FileText, BarChart2, Calculator,
  TerminalSquare,
  BookOpen, ScanSearch, Home, WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const CORE_NAV: NavItem[] = [
  { path: '/analyzer',   icon: TrendingUp,   label: 'Analyzer'   },
  { path: '/portfolio',  icon: Briefcase,    label: 'Portfolio'  },
  { path: '/risk',       icon: ShieldCheck,  label: 'Risk'       },
  { path: '/montecarlo', icon: FlaskConical, label: 'Monte Carlo'},
  { path: '/scenarios',  icon: Zap,          label: 'Scenarios'  },
  { path: '/watchlist',  icon: Star,         label: 'Watchlist'  },
  { path: '/paper-trading', icon: WalletCards, label: 'Paper Trade' },
];

const AI_NAV: NavItem[] = [
  { path: '/agents/earnings', icon: FileText,   label: 'Earnings'   },
  { path: '/agents/research', icon: BarChart2,  label: 'Research'   },
  { path: '/agents/model',    icon: Calculator, label: 'Models'     },
  { path: '/research',        icon: BookOpen,   label: 'Deep Dive'  },
  { path: '/scanner',         icon: ScanSearch, label: 'Scanner'    },
];

function SideNavItem({ path, icon: Icon, label }: NavItem) {
  const location = useLocation();
  const active = path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  return (
    <NavLink
      to={path}
      className={`nav-item ${active ? 'active' : ''}`}
      title={label}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.65} />
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-section-label">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { activeMarketId, setActiveMarket } = usePortfolioStore();
  const activeMarket = MARKETS.find(m => m.id === activeMarketId) ?? MARKETS[0];
  const marketStatus = getMarketStatus(activeMarket);

  return (
    <aside className="sidebar-shell">
      <button
        onClick={() => navigate('/')}
        className="sidebar-brand"
        title="Back to Home"
      >
        <div className="sidebar-mark">CS</div>
        <div className="sidebar-brand-copy">
          <strong>CapitalScope</strong>
          <span>Research OS</span>
        </div>
      </button>

      {/* ── Global Market Selector ── */}
      <div style={{
        padding: '8px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 4,
      }}>
        <p style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--text-lo)',
          marginBottom: 6, fontFamily: 'JetBrains Mono, monospace',
        }}>
          Market
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {MARKETS.map(m => {
            const isActive = activeMarketId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMarket(m.id)}
                title={m.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '3px 7px', borderRadius: 99, fontSize: 10,
                  fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer', transition: 'all 0.12s',
                  border: isActive ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                  background: isActive ? 'rgba(138,164,255,0.15)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                }}
              >
                <span style={{ fontSize: 13 }}>{m.flag}</span>
                <span>{m.id}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: marketStatus.color, flexShrink: 0,
            boxShadow: marketStatus.isOpen ? `0 0 6px ${marketStatus.color}` : 'none',
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace' }}>
            {marketStatus.label}
          </span>
        </div>
      </div>

      <div className="sidebar-group">
        <SectionLabel>Core</SectionLabel>
        {CORE_NAV.map(item => <SideNavItem key={item.path} {...item} />)}
      </div>

      <div className="sidebar-group">
        <SectionLabel>Research</SectionLabel>
        {AI_NAV.map(item => <SideNavItem key={item.path} {...item} />)}
      </div>

      <div className="flex-1" />

      <div className="sidebar-group sidebar-bottom">
        <SideNavItem path="/terminal" icon={TerminalSquare} label="Terminal" />
        <NavLink
          to="/"
          className="nav-item"
          title="Landing page"
        >
          <Home size={16} strokeWidth={1.65} />
          <span className="nav-label">Home</span>
        </NavLink>
      </div>
    </aside>
  );
}
