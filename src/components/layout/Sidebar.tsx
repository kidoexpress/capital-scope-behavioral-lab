import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type React from 'react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { MARKETS } from '../../config/markets';
import { getMarketStatus } from '../../utils/marketHours';
import {
  TrendingUp, Briefcase, ShieldCheck,
  FlaskConical, Zap, Star,
  FileText, BarChart2, Calculator,
  TerminalSquare,
  BookOpen, ScanSearch, Home, WalletCards, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const CORE_NAV: NavItem[] = [
  { path: '/analyzer',      icon: TrendingUp,   label: 'Analyzer'    },
  { path: '/portfolio',     icon: Briefcase,    label: 'Portfolio'   },
  { path: '/risk',          icon: ShieldCheck,  label: 'Risk'        },
  { path: '/montecarlo',    icon: FlaskConical, label: 'Monte Carlo' },
  { path: '/scenarios',     icon: Zap,          label: 'Scenarios'   },
  { path: '/watchlist',     icon: Star,         label: 'Watchlist'   },
  { path: '/paper-trading', icon: WalletCards,  label: 'Paper Trade' },
  { path: '/synthetic-lab', icon: Sparkles, label: 'Synthetic Lab' },
];

const AI_NAV: NavItem[] = [
  { path: '/agents/earnings', icon: FileText,   label: 'Earnings'  },
  { path: '/agents/research', icon: BarChart2,  label: 'Research'  },
  { path: '/agents/model',    icon: Calculator, label: 'Models'    },
  { path: '/research',        icon: BookOpen,   label: 'Deep Dive' },
  { path: '/scanner',         icon: ScanSearch, label: 'Scanner'   },
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

  const activeStatus = getMarketStatus(activeMarketId);
  const activeName = MARKETS.find(m => m.id === activeMarketId)?.name.split(' ')[0] ?? '';

  return (
    <aside className="sidebar-shell">
      <button
        onClick={() => navigate('/')}
        className="sidebar-brand"
        title="Back to Home"
      >
        <div className="sidebar-mark">CS</div>
        <div className="sidebar-brand-copy">
          <strong>Capital Scope</strong>
          <span>Behavioral Lab</span>
        </div>
      </button>

      {/* ── Global Market Selector ── */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border-dim, rgba(255,255,255,0.06))',
      }}>
        <p style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text-lo)',
          marginBottom: 8,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          Market
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {MARKETS.map(m => {
            const isActive = activeMarketId === m.id;
            const status = getMarketStatus(m.id);
            return (
              <button
                key={m.id}
                onClick={() => setActiveMarket(m.id)}
                title={`${m.name} · ${status.label}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-sub)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-lo)',
                }}
              >
                <span style={{ fontSize: 14 }}>{m.flag}</span>
                <span>{m.id}</span>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: status.color, flexShrink: 0, marginLeft: 1,
                }} />
              </button>
            );
          })}
        </div>

        {/* Active market status line */}
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: activeStatus.color, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10,
            color: activeStatus.isOpen ? '#10b981' : 'var(--text-lo)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {activeName} {activeStatus.label}
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
