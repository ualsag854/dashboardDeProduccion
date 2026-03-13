'use client';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Link from 'next/link';
import { fetchAllBatches } from '@/lib/api';

// -- TYPES & INTERFACES --
interface Batch {
  id: string | number;
  batchId?: string;
  batch_id?: string;
  material?: { name?: string; code?: string } | string;
  status?: string;
  ai_status?: string;
  createdAt?: string;
  piece_count?: number;
}

type FilterTab = 'pendientes' | 'revision' | 'aprobados' | 'todos';

export default function Dashboard() {
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('pendientes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const batches = await fetchAllBatches();
        setAllBatches(batches);
      } catch (err) {
        console.error('Error loading batches:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // -- HELPERS --
  const getBatchId = (b: Batch) => b.batchId || b.batch_id || `#${b.id}`;
  const getMaterialName = (b: Batch) => {
    if (!b.material) return '—';
    if (typeof b.material === 'string') return b.material;
    return b.material.name || b.material.code || '—';
  };

  const getInternalStatus = (b: Batch): FilterTab => {
    const status = (b.status || '').toLowerCase().trim();
    const ai = (b.ai_status || '').toLowerCase().trim();
    
    // Si aprueba todo
    if (status === 'homogéneo' || status === 'homogeneo' || status === 'aprobado' || ai === 'homogéneo' || ai === 'homogeneo') {
      return 'aprobados';
    }
    // Si requiere revision
    if (status === 'en revisión' || status === 'en revision' || ai === 'en revisión' || ai === 'revision manual' || ai === 'pendiente de revisión') {
      return 'revision';
    }
    // Por defecto pendiente
    return 'pendientes';
  };

  const getStatusBadge = (internalStatus: FilterTab, originalStatus: string) => {
    if (internalStatus === 'aprobados') {
      return <span className="status-badge status-approved">{originalStatus || 'Homogéneo'}</span>;
    }
    if (internalStatus === 'revision') {
      return <span className="status-badge status-revision">{originalStatus || 'En Revisión'}</span>;
    }
    return <span className="status-badge status-pending">{originalStatus || 'Pendiente'}</span>;
  };

  // -- MOCK PERFORMANCE (Since we don't have deep piece population here yet) --
  const getPerformanceIndicator = (b: Batch, internalStatus: FilterTab) => {
    if (!b.piece_count || b.piece_count === 0) return <span className="text-slate-400 text-sm">—</span>;
    
    if (internalStatus === 'aprobados') {
      return <div className="flex items-center gap-1.5"><div className="w-16 h-2 bg-green-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-full" /></div><span className="text-xs font-bold text-green-600">100%</span></div>;
    }
    if (internalStatus === 'revision') {
      // Fake a percentage between 70% and 95% for visual purposes
      const fakePct = 70 + (Number(b.id) % 25);
      return <div className="flex items-center gap-1.5"><div className="w-16 h-2 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${fakePct}%` }} /></div><span className="text-xs font-bold text-amber-600">{fakePct}%</span></div>;
    }
    return <span className="text-slate-400 text-sm italic">Calculando...</span>;
  };

  // -- FILTERING --
  const displayedBatches = allBatches.filter(b => {
    if (activeTab === 'todos') return true;
    return getInternalStatus(b) === activeTab;
  });

  return (
    <div className="bg-[--color-background-light] dark:bg-[--color-background-dark] font-display text-slate-900 dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <main className="flex-1 ml-64 overflow-y-auto bg-[--color-background-light] dark:bg-[--color-background-dark] p-10">

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  PANEL DE CONTROL
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                  {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2 rounded-xl">
                <span className="size-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-700 dark:text-green-400 font-bold text-sm">Planta Operativa</span>
              </div>
            </div>
          </header>

          {/* Módulos principales — solo dos */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Registrar Fallo */}
            <Link
              href="/defects"
              className="flex flex-col rounded-2xl overflow-hidden border-2 border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-center py-10 bg-red-50 dark:bg-red-950">
                <span className="material-symbols-outlined text-red-500" style={{ fontSize: '4rem' }}>report_problem</span>
              </div>
              <div className="flex-1 px-8 py-6">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Registrar Fallo</h2>
                  <span className="text-xs font-bold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2.5 py-0.5 rounded-full uppercase">Urgente</span>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Reporta incidencias técnicas en piezas o maquinaria de forma inmediata.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white text-base font-bold transition-colors">
                <span>Acceso rápido</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
              </div>
            </Link>

            {/* Ver Lotes */}
            <Link
              href="/batches"
              className="flex flex-col rounded-2xl overflow-hidden border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-center py-10 bg-indigo-50 dark:bg-indigo-950">
                <span className="material-symbols-outlined text-indigo-500" style={{ fontSize: '4rem' }}>inventory_2</span>
              </div>
              <div className="flex-1 px-8 py-6">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Ver Lotes</h2>
                  <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full uppercase">Hoy</span>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Consulta y controla todos los lotes de producción en curso y su trazabilidad.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold transition-colors">
                <span>Consultar lotes</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
              </div>
            </Link>
          </section>

          {/* Tabla de Lotes con Filtros */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">list_alt</span>
                Resumen de Lotes
                {!loading && (
                  <span className="ml-2 text-sm font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full">
                    {displayedBatches.length}
                  </span>
                )}
              </h2>
              
              {/* TABS DE FILTRO */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('pendientes')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'pendientes' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Pendientes
                </button>
                <button 
                  onClick={() => setActiveTab('revision')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'revision' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  En Revisión
                </button>
                <button 
                  onClick={() => setActiveTab('aprobados')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'aprobados' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Aprobados
                </button>
                <button 
                  onClick={() => setActiveTab('todos')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'todos' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Todos
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
                  <p className="text-base">Cargando lotes...</p>
                </div>
              ) : displayedBatches.length === 0 ? (
                <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">inbox</span>
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">No hay lotes en esta categoría</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Lote</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Material</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Piezas</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Rendimiento</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Estado</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wide text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedBatches.map((batch) => {
                      const internalLogicStatus = getInternalStatus(batch);
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-base text-slate-900 dark:text-slate-100">
                            {getBatchId(batch)}
                          </td>
                          <td className="px-6 py-4 text-base text-slate-600 dark:text-slate-300">
                            {getMaterialName(batch)}
                          </td>
                          <td className="px-6 py-4 text-base text-slate-600 dark:text-slate-300 font-semibold">
                            {batch.piece_count ?? '—'}
                          </td>
                          <td className="px-6 py-4">
                            {getPerformanceIndicator(batch, internalLogicStatus)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(internalLogicStatus, batch.ai_status || batch.status || '')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/batches/${batch.id}`}
                              className="inline-flex items-center justify-center size-8 rounded-full bg-slate-100 hover:bg-[--color-primary] hover:text-white dark:bg-slate-800 dark:hover:bg-[--color-primary] text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .status-badge {
          display: inline-block;
          font-size: 0.80rem;
          font-weight: 700;
          padding: 0.3rem 0.8rem;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .status-revision {
          background: rgb(254 243 199);
          color: rgb(180 83 9);
        }
        :global(.dark) .status-revision {
          background: rgba(180,83,9,0.2);
          color: rgb(251 191 36);
        }
        .status-pending {
          background: rgb(224 231 255);
          color: rgb(79 70 229);
        }
        :global(.dark) .status-pending {
          background: rgba(79,70,229,0.2);
          color: rgb(165 180 252);
        }
        .status-approved {
          background: rgb(220 253 230);
          color: rgb(22 101 52);
        }
        :global(.dark) .status-approved {
          background: rgba(22,101,52,0.2);
          color: rgb(74 222 128);
        }
      `}</style>
    </div>
  );
}
