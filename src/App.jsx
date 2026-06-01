import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  fetchEconomyData, getMockData, buildPriceMap, clearCache
} from './services/excaliaApi';
import Dashboard from './pages/Dashboard';
import MineralsList from './pages/MineralsList';
import Shops from './pages/Shops';
import Comparator from './pages/Comparator';
import TiersComparator from './pages/TiersComparator';
import Simulator from './pages/Simulator';
import TopProfits from './pages/TopProfits';
import AdminPanel from './pages/AdminPanel';
import AdminPrices from './pages/AdminPrices';
import DebugApi from './pages/DebugApi';
import {
  LayoutDashboard, Gem, GitCompare, Calculator, TrendingUp,
  RefreshCw, Wifi, WifiOff, AlertTriangle, Menu, X, Zap,
  Settings, FlaskConical, ShoppingCart, Layers
} from 'lucide-react';

export const EconomyContext = createContext(null);
export const useEconomy = () => useContext(EconomyContext);

export default function App() {
  const [items, setItems]           = useState([]);
  const [priceMap, setPriceMap]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [isStale, setIsStale]       = useState(false);
  const [apiError, setApiError]     = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [debugData, setDebugData]   = useState(null);
  const [rawStructure, setRawStructure] = useState(null);
  const location = useLocation();

  const applyResult = useCallback((result) => {
    setItems(result.data);
    setPriceMap(buildPriceMap(result.data));
    setLastUpdate(result.timestamp);
    setDataSource(result.source);
    setIsStale(result.stale ?? false);
    setApiError(result.apiError ?? null);
    setDebugData(result.data);
    setRawStructure(result.rawStructure ?? null);
  }, []);

  const loadData = useCallback(async (force = false) => {
    setLoading(true);
    if (force) clearCache();
    if (isDemoMode) {
      applyResult(getMockData());
      setLoading(false);
      return;
    }
    const result = await fetchEconomyData();
    applyResult(result);
    setLoading(false);
  }, [isDemoMode, applyResult]);

  const activateDemoMode = useCallback(() => {
    setIsDemoMode(true);
    applyResult(getMockData());
  }, [applyResult]);

  const deactivateDemoMode = useCallback(() => {
    setIsDemoMode(false);
    clearCache();
    loadData(true);
  }, [loadData]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (isDemoMode) return;
    const interval = setInterval(() => loadData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData, isDemoMode]);

  useEffect(() => { setSidebarOpen(false); }, [location]);

  const StatusBadge = () => {
    if (dataSource === 'api' || (dataSource === 'cache' && !isStale)) {
      return (
        <span className="profit-badge-positive flex items-center gap-1">
          <Wifi size={10} />{dataSource === 'cache' ? 'API (cache)' : 'API connectée'}
        </span>
      );
    }
    if (dataSource === 'cache' && isStale) {
      return <span className="profit-badge-neutral flex items-center gap-1"><Wifi size={10} /> Cache expiré</span>;
    }
    if (dataSource === 'mock') {
      return (
        <span className="profit-badge-neutral flex items-center gap-1 cursor-pointer" onClick={deactivateDemoMode} title="Cliquer pour quitter le mode démo">
          <FlaskConical size={10} /> Mode démo ✕
        </span>
      );
    }
    if (dataSource === 'error') {
      return <span className="profit-badge-negative flex items-center gap-1" title={apiError}><AlertTriangle size={10} /> Erreur API</span>;
    }
    return null;
  };

  const navItems = [
    { path: '/',              icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/shops',         icon: ShoppingCart,    label: 'Shops' },
    { path: '/minerals',      icon: Gem,             label: 'Minerais' },
    { path: '/comparator',    icon: GitCompare,       label: 'Comparateur' },
    { path: '/tiers',         icon: Layers,          label: 'Comparateur Tiers' },
    { path: '/simulator',     icon: Calculator,      label: 'Simulateur' },
    { path: '/top-profits',   icon: TrendingUp,      label: 'Top Profits' },
    { path: '/admin',         icon: Settings,        label: 'Admin Panel' },
    { path: '/admin-prices',  icon: Settings,        label: 'Prix Admin' },
    { path: '/debug',         icon: FlaskConical,    label: 'Debug API' },
  ];

  const contextValue = {
    items, priceMap, loading, loadData,
    isMock: dataSource === 'mock',
    isStale, dataSource, apiError, lastUpdate, debugData, rawStructure,
    activateDemoMode, deactivateDemoMode, isDemoMode,
  };

  return (
    <EconomyContext.Provider value={contextValue}>
      <div className="min-h-screen grid-bg text-slate-200">
        <div className="scan-line opacity-30" />

        <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 lg:px-6"
          style={{ background: 'linear-gradient(180deg, rgba(2,4,8,0.98) 0%, rgba(5,13,20,0.95) 100%)', borderBottom: '1px solid rgba(14,165,233,0.15)' }}>

          <button className="lg:hidden mr-3 p-2 rounded-lg hover:bg-crystal-500/10 text-crystal-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.4)' }}>
              <Zap size={16} className="text-crystal-400" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold text-crystal-400 leading-none" style={{ letterSpacing: '0.1em' }}>EXCALIA</h1>
              <p className="text-xs text-slate-500 font-body" style={{ letterSpacing: '0.08em' }}>ECONOMY ANALYZER</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <StatusBadge />
              {lastUpdate && (
                <span className="text-slate-500 font-mono text-xs">
                  {new Date(lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {!isDemoMode && dataSource === 'error' && (
              <button className="btn-secondary text-xs py-1.5 px-3" onClick={activateDemoMode}>
                <FlaskConical size={13} />
                <span className="hidden sm:inline">Mode démo</span>
              </button>
            )}

            <button className="btn-primary text-xs py-1.5 px-3" onClick={() => loadData(true)} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </header>

        <div className="flex pt-16">
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <aside className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-60 flex-shrink-0 overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ background: 'rgba(5,13,20,0.98)', borderRight: '1px solid rgba(14,165,233,0.1)' }}>
            <nav className="p-4 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={16} />{label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 mx-4 rounded-lg mt-4"
              style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.1)' }}>
              <p className="font-display text-xs text-crystal-400 mb-1" style={{ letterSpacing: '0.1em' }}>ITEMS CHARGÉS</p>
              <p className="font-display text-2xl font-bold text-white">{items.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                {dataSource === 'mock' ? 'données démo' : dataSource === 'api' ? 'depuis l\'API' : 'depuis le cache'}
              </p>
            </div>

            {dataSource === 'error' && (
              <div className="p-4 mx-4 rounded-lg mt-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="font-display text-xs text-red-400 mb-1">ERREUR API</p>
                <p className="text-xs text-slate-400">{apiError}</p>
                <button className="mt-2 text-xs text-crystal-400 underline" onClick={activateDemoMode}>
                  Activer le mode démo
                </button>
              </div>
            )}
          </aside>

          <main className="flex-1 min-w-0 p-4 lg:p-6">
            {loading && items.length === 0 ? (
              <LoadingScreen />
            ) : dataSource === 'error' && items.length === 0 ? (
              <ErrorScreen error={apiError} onDemo={activateDemoMode} onRetry={() => loadData(true)} />
            ) : (
              <Routes>
                <Route path="/"             element={<Dashboard />} />
                <Route path="/shops"        element={<Shops />} />
                <Route path="/minerals"     element={<MineralsList />} />
                <Route path="/comparator"   element={<Comparator />} />
                <Route path="/tiers"        element={<TiersComparator />} />
                <Route path="/simulator"    element={<Simulator />} />
                <Route path="/top-profits"  element={<TopProfits />} />
                <Route path="/admin"        element={<AdminPanel />} />
                <Route path="/admin-prices" element={<AdminPrices />} />
                <Route path="/debug"        element={<DebugApi />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </EconomyContext.Provider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-crystal-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-crystal-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-crystal-500/60 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Gem size={24} className="text-crystal-400" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-display text-crystal-400 text-sm tracking-widest animate-pulse">CHARGEMENT</p>
        <p className="text-slate-500 text-sm mt-1">Connexion à l'API Excalia...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onDemo, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle size={40} className="text-red-400" />
      <div>
        <p className="font-display text-red-400 text-sm tracking-widest mb-1">ERREUR API</p>
        <p className="text-slate-400 text-sm max-w-md">{error}</p>
        <p className="text-slate-500 text-xs mt-2">
          Vérifie ta connexion ou que le proxy Vite est configuré (<code>/api/excalia</code>).
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button className="btn-primary text-xs py-2 px-4" onClick={onRetry}>
          <RefreshCw size={13} /> Réessayer
        </button>
        <button className="btn-secondary text-xs py-2 px-4" onClick={onDemo}>
          <FlaskConical size={13} /> Mode démo
        </button>
      </div>
    </div>
  );
}
