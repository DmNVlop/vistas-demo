import { useState, useEffect, useMemo, type ReactNode, type ElementType } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  Search,
  AlertTriangle,
  BarChart3,
  Factory,
  ChevronRight,
  Box,
  X,
  Truck,
  ArrowRightCircle,
  Plus,
  Drill,
  ClipboardList,
  Weight,
} from "lucide-react";

/**
 * KLEM WOOD - ASP & LOGISTICS MODULE v3.0
 * Author: G (Lead Architect)
 * * Changes v3.0:
 * - LOGISTICS MODULE: New 'Expeditions' view.
 * - AUTO-TRANSITION: Batches auto-move to 'READY_TO_SHIP' when 100% complete.
 * - TRUCK LOADING UI: Drag & Drop simulation to assign batches to trucks.
 * - CAPACITY LOGIC: Volume/Weight simulation for logistics.
 */

// --- 1. CONSTANTS & ENUMS ---

const PieceStatus = {
  PLANNED: "PLANNED",
  RELEASED: "RELEASED",
  IN_PROCESS: "IN_PROCESS",
  COMPLETED: "COMPLETED",
  SCRAP: "SCRAP",
  HOLD: "HOLD",
};

const BatchStatus = {
  PLANNED: "PLANNED",
  RELEASED: "RELEASED",
  HOLD: "HOLD",
  READY_TO_SHIP: "READY_TO_SHIP", // New Status: Finished production, waiting in warehouse
  DISPATCHED: "DISPATCHED", // New Status: Loaded on truck
};

const StationType = {
  CUTTING: "CUTTING",
  EDGING: "EDGING",
  CNC: "CNC",
  ASSEMBLY: "ASSEMBLY",
  PACKING: "PACKING",
};

// const STATION_CONFIG = {
//   [StationType.CUTTING]: { label: "Seccionadora", icon: Scissors, color: "text-blue-600 bg-blue-50 border-blue-200" },
//   [StationType.EDGING]: { label: "Canteadora", icon: Layers, color: "text-amber-600 bg-amber-50 border-amber-200" },
//   [StationType.CNC]: { label: "C. Mecanizado", icon: Drill, color: "text-purple-600 bg-purple-50 border-purple-200" },
//   [StationType.ASSEMBLY]: { label: "Armado", icon: Hammer, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
//   [StationType.PACKING]: { label: "Embalaje", icon: Package, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
// };

const MATERIALS = ["MEL-BLANCO-19", "ROBLE-NATURAL-19", "MDF-CRUDO-16", "HPL-NEGRO-10"];

// --- DATA GENERATION ---

const generatePiecesForBatch = (batchId: string, count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const rand = Math.random();
    let type = "Standard";
    let routeTemplate = [];

    if (rand > 0.7) {
      type = "Complex (CNC)";
      routeTemplate = [StationType.CUTTING, StationType.EDGING, StationType.CNC, StationType.ASSEMBLY, StationType.PACKING];
    } else if (rand > 0.4) {
      type = "Standard (Panel)";
      routeTemplate = [StationType.CUTTING, StationType.EDGING, StationType.CNC, StationType.PACKING];
    } else {
      type = "Simple (Backing)";
      routeTemplate = [StationType.CUTTING, StationType.PACKING];
    }

    // Initialize logic
    let status = PieceStatus.PLANNED;
    let completedSteps = 0;

    // Simulate some initial state based on batch ID cues (for demo)
    if (batchId.includes("REL")) {
      completedSteps = Math.floor(Math.random() * (routeTemplate.length + 1)); // Random progress
    }
    // Simulate a "Finished" batch for logistics demo
    if (batchId.includes("SHIP")) {
      completedSteps = routeTemplate.length;
    }

    // Determine status from steps
    if (completedSteps === 0) status = batchId.includes("REL") ? PieceStatus.RELEASED : PieceStatus.PLANNED;
    else if (completedSteps < routeTemplate.length) status = PieceStatus.IN_PROCESS;
    else status = PieceStatus.COMPLETED;

    return {
      uid: `${batchId}-${String(i + 100).padStart(3, "0")}`,
      ardis_id: `ARD-${Math.floor(Math.random() * 9999)}`,
      batch_id: batchId,
      description: `Pieza ${type} - ${String.fromCharCode(65 + (i % 5))}`,
      dimensions: { l: 400 + Math.floor(Math.random() * 1000), w: 200 + Math.floor(Math.random() * 600), t: 19 },
      material_code: MATERIALS[Math.floor(Math.random() * MATERIALS.length)],
      status: status,
      current_step_index: completedSteps,
      route: routeTemplate.map((s, idx) => ({
        order: idx + 1,
        target_station_type: s,
        completed: idx < completedSteps,
      })),
    };
  });
};

// --- COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    [BatchStatus.PLANNED]: "bg-slate-100 text-slate-500 border-slate-200",
    [BatchStatus.RELEASED]: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-300",
    [BatchStatus.HOLD]: "bg-purple-50 text-purple-700 border-purple-200",
    [BatchStatus.READY_TO_SHIP]: "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-300",
    [BatchStatus.DISPATCHED]: "bg-slate-800 text-white border-slate-900",
    // Piece statuses
    [PieceStatus.IN_PROCESS]: "bg-amber-50 text-amber-700 border-amber-200",
    [PieceStatus.COMPLETED]: "bg-emerald-50 text-emerald-700 border-emerald-200",
    [PieceStatus.SCRAP]: "bg-red-50 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    [BatchStatus.PLANNED]: "PLANIF",
    [BatchStatus.RELEASED]: "EN PLANTA",
    [BatchStatus.HOLD]: "RETENIDO",
    [BatchStatus.READY_TO_SHIP]: "EN ALMACÉN",
    [BatchStatus.DISPATCHED]: "DESPACHADO",
    [PieceStatus.IN_PROCESS]: "PROCESO",
    [PieceStatus.COMPLETED]: "FIN",
    [PieceStatus.SCRAP]: "SCRAP",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${styles[status] || "bg-gray-100"}`}>
      {labels[status] || status}
    </span>
  );
};

const ProgressBar = ({ total, completed }: { total: number; completed: number }) => {
  const compPct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
      <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${compPct}%` }} />
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: string;
}

const Modal = ({ isOpen, onClose, title, children, actions, size = "max-w-5xl" }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${size} max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">{children}</div>
        {actions && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">{actions}</div>}
      </div>
    </div>
  );
};

// --- LOGISTICS COMPONENTS ---

interface Piece {
  uid: string;
  ardis_id: string;
  batch_id: string;
  description: string;
  dimensions: {
    l: number;
    w: number;
    t: number;
  };
  material_code: string;
  status: string;
  current_step_index: number;
  route: {
    order: number;
    target_station_type: string;
    completed: boolean;
  }[];
}

interface Batch {
  id: string;
  name: string;
  priority: number;
  status: string;
  date: string;
  total: number;
  weight: number;
  stats?: {
    total: number;
    completed: number;
    progress: number;
  };
}

interface Truck {
  id: string;
  name: string;
  licensePlate: string;
  maxLoad: number;
  currentLoad: number;
  departureTime: string;
  batches: Batch[];
}

interface TruckCardProps {
  truck: Truck;
  onDispatch: (truckId: string) => void;
  onRemoveBatch: (truckId: string, batch: Batch) => void;
}

const TruckCard = ({ truck, onDispatch, onRemoveBatch }: TruckCardProps) => {
  const capacityPct = (truck.currentLoad / truck.maxLoad) * 100;

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-4 flex flex-col h-full hover:border-slate-300 transition-colors relative group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{truck.name}</h4>
            <p className="text-xs text-slate-500">{truck.licensePlate}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase">Salida</div>
          <div className="font-mono text-sm text-slate-700">{truck.departureTime}</div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500 font-medium">
            Carga: {truck.currentLoad}kg / {truck.maxLoad}kg
          </span>
          <span className={`font-bold ${capacityPct > 90 ? "text-red-500" : "text-slate-600"}`}>{Math.round(capacityPct)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${capacityPct > 100 ? "bg-red-500" : "bg-slate-800"}`}
            style={{ width: `${Math.min(capacityPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Manifest List */}
      <div className="flex-1 bg-slate-50 rounded-lg p-2 space-y-2 overflow-y-auto max-h-48 mb-4 border border-slate-100">
        {truck.batches.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Arrastra lotes aquí (Simulado con Clic)</div>
        ) : (
          truck.batches.map((b) => (
            <div key={b.id} className="bg-white p-2 rounded border border-slate-200 shadow-sm flex justify-between items-center text-xs">
              <div>
                <span className="font-bold block text-slate-700">{b.id}</span>
                <span className="text-slate-500 text-[10px]">{b.name}</span>
              </div>
              <button onClick={() => onRemoveBatch(truck.id, b)} className="text-slate-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => onDispatch(truck.id)}
        disabled={truck.batches.length === 0}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
        <ClipboardList size={16} /> Generar Albarán y Salir
      </button>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function ASPModule() {
  const [activeTab, setActiveTab] = useState("SCHEDULER");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [allPieces, setAllPieces] = useState<Piece[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([
    { id: "TRUCK-01", name: "Camión Norte", licensePlate: "4589-KLM", maxLoad: 5000, currentLoad: 0, departureTime: "14:00", batches: [] },
    { id: "TRUCK-02", name: "Furgoneta Express", licensePlate: "1234-XYZ", maxLoad: 1200, currentLoad: 0, departureTime: "16:30", batches: [] },
  ]);

  // UI State
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. INIT DATA ---
  useEffect(() => {
    const initialBatches = [
      { id: "LOTE-2025-10-A", name: "Cocinas Proyecto Alfa", priority: 1, status: BatchStatus.RELEASED, date: "2025-12-10", total: 40, weight: 850 },
      { id: "LOTE-2025-10-B", name: "Armarios Residencial Sur", priority: 2, status: BatchStatus.PLANNED, date: "2025-12-11", total: 150, weight: 3200 },
      { id: "LOTE-2025-10-C", name: "Mesas Oficina Central", priority: 3, status: BatchStatus.READY_TO_SHIP, date: "2025-12-12", total: 20, weight: 400 }, // Pre-finished for demo
      { id: "LOTE-2025-10-D", name: "Stock Reposición Blanco", priority: 4, status: BatchStatus.HOLD, date: "2025-12-14", total: 200, weight: 1500 },
      { id: "LOTE-2025-10-E", name: "Paneles Acústicos", priority: 5, status: BatchStatus.RELEASED, date: "2025-12-09", total: 30, weight: 600 },
    ];
    setBatches(initialBatches);

    let generatedPieces: Piece[] = [];
    initialBatches.forEach((b) => {
      // If batch is READY_TO_SHIP, generate with SHIP flag to complete them immediately
      const flag = b.status === BatchStatus.READY_TO_SHIP ? b.id + "-SHIP" : b.status === BatchStatus.RELEASED ? b.id + "-REL" : b.id;
      const pieces = generatePiecesForBatch(flag, b.total);
      generatedPieces = [...generatedPieces, ...pieces];
    });
    setAllPieces(generatedPieces);
  }, []);

  // --- 2. SIMULATION ENGINE + AUTO-TRANSITION ---
  useEffect(() => {
    const interval = setInterval(() => {
      // 2a. Advance Pieces
      setAllPieces((currentPieces) => {
        return currentPieces.map((p) => {
          if ([PieceStatus.RELEASED, PieceStatus.IN_PROCESS].includes(p.status) && Math.random() > 0.7) {
            const currentRouteLength = p.route.length;
            const nextStep = p.current_step_index + 1;
            const isFinished = nextStep >= currentRouteLength;

            return {
              ...p,
              current_step_index: Math.min(nextStep, currentRouteLength),
              status: isFinished ? PieceStatus.COMPLETED : PieceStatus.IN_PROCESS,
              route: p.route.map((r, idx) => ({ ...r, completed: idx < nextStep })),
            };
          }
          return p;
        });
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // 2b. Check for Batch Completion (Auto-Transition)
  useEffect(() => {
    // We check this every time pieces update
    const releasedBatches = batches.filter((b) => b.status === BatchStatus.RELEASED);

    releasedBatches.forEach((batch) => {
      const batchPieces = allPieces.filter((p) => p.batch_id === batch.id || p.batch_id === batch.id + "-REL"); // Match ID logic
      if (batchPieces.length > 0) {
        const allDone = batchPieces.every((p) => p.status === PieceStatus.COMPLETED || p.status === PieceStatus.SCRAP);

        if (allDone) {
          // AUTO-TRANSITION TO LOGISTICS
          setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: BatchStatus.READY_TO_SHIP } : b)));
        }
      }
    });
  }, [allPieces, batches]);

  // --- 3. DERIVED METRICS ---
  const batchStats = useMemo(() => {
    return batches.map((b) => {
      // Handle ID matching carefully due to generation flags
      const batchPieces = allPieces.filter((p) => p.batch_id.startsWith(b.id));
      const completed = batchPieces.filter((p) => p.status === PieceStatus.COMPLETED).length;

      return {
        ...b,
        stats: {
          total: batchPieces.length,
          completed,
          progress: batchPieces.length ? Math.round((completed / batchPieces.length) * 100) : 0,
        },
      };
    });
  }, [batches, allPieces]);

  // --- 4. LOGISTICS ACTIONS ---

  const handleAddToTruck = (truckId: string, batch: Batch) => {
    setTrucks((prev) =>
      prev.map((t) => {
        if (t.id === truckId) {
          if (t.currentLoad + batch.weight > t.maxLoad) {
            alert("¡Exceso de Peso! No se puede cargar este lote.");
            return t;
          }
          return {
            ...t,
            currentLoad: t.currentLoad + batch.weight,
            batches: [...t.batches, batch],
          };
        }
        return t;
      })
    );

    // Update batch to avoid duplicates in list (could change status to 'LOADING' but for now remove from list logic)
    setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: "STAGED_ON_TRUCK" } : b)));
  };

  const handleRemoveFromTruck = (truckId: string, batch: Batch) => {
    setTrucks((prev) =>
      prev.map((t) => {
        if (t.id === truckId) {
          return {
            ...t,
            currentLoad: t.currentLoad - batch.weight,
            batches: t.batches.filter((b) => b.id !== batch.id),
          };
        }
        return t;
      })
    );
    setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: BatchStatus.READY_TO_SHIP } : b)));
  };

  const handleDispatchTruck = (truckId: string) => {
    const truck = trucks.find((t) => t.id === truckId);
    if (!truck) return;

    // 1. Mark Batches as DISPATCHED
    const batchIds = truck.batches.map((b) => b.id);
    setBatches((prev) => prev.map((b) => (batchIds.includes(b.id) ? { ...b, status: BatchStatus.DISPATCHED } : b)));

    // 2. Clear Truck
    setTrucks((prev) => prev.map((t) => (t.id === truckId ? { ...t, currentLoad: 0, batches: [] } : t)));

    alert(`Camión ${truckId} despachado con éxito. Albarán generado para ${batchIds.length} lotes.`);
  };

  // --- RENDER ---

  const renderSchedulerView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[calc(100%-140px)]">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar Lote..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <div className="col-span-1">Prio</div>
        <div className="col-span-4">Lote / Proyecto</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-3">Progreso</div>
        <div className="col-span-2 text-right">Detalle</div>
      </div>

      {/* Scheduler Body */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
        {batchStats
          .filter((b) => [BatchStatus.PLANNED, BatchStatus.RELEASED, BatchStatus.HOLD, BatchStatus.READY_TO_SHIP].includes(b.status)) // Show all but dispatched
          .filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((batch) => (
            <div
              key={batch.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
              onClick={() => {
                setSelectedBatch(batch);
                setIsDetailOpen(true);
              }}>
              <div className="col-span-1">
                <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-bold text-slate-600">
                  {batch.priority}
                </div>
              </div>
              <div className="col-span-4">
                <div className="font-bold text-slate-800 text-sm">{batch.name}</div>
                <div className="text-xs text-slate-500 font-mono">{batch.id}</div>
              </div>
              <div className="col-span-2">
                <StatusBadge status={batch.status} />
              </div>
              <div className="col-span-3 pr-4">
                <ProgressBar total={batch.stats.total} completed={batch.stats.completed} />
                <div className="text-[10px] text-right mt-1 text-slate-400">
                  {batch.stats.completed}/{batch.stats.total} ({batch.stats.progress}%)
                </div>
              </div>
              <div className="col-span-2 flex justify-end">
                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderLogisticsView = () => (
    <div className="h-full flex gap-6 overflow-hidden">
      {/* LEFT: STAGING AREA (Picking) */}
      <div className="w-1/3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <h3 className="font-bold text-orange-900 flex items-center gap-2">
            <Box className="text-orange-600" /> Zona de Picking
          </h3>
          <span className="text-xs bg-white px-2 py-1 rounded text-orange-600 border border-orange-200 font-bold">
            {batchStats.filter((b) => b.status === BatchStatus.READY_TO_SHIP).length} Lotes Listos
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {batchStats.filter((b) => b.status === BatchStatus.READY_TO_SHIP).length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No hay lotes terminados esperando. <br />
              <span className="text-xs opacity-70">(El sistema moverá lotes aquí automáticamente cuando el progreso llegue al 100%)</span>
            </div>
          )}

          {batchStats
            .filter((b) => b.status === BatchStatus.READY_TO_SHIP)
            .map((batch) => (
              <div key={batch.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800">{batch.name}</div>
                  <div className="text-xs font-mono bg-slate-100 px-1 rounded">{batch.id}</div>
                </div>
                <div className="flex justify-between items-end text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Weight size={14} /> {batch.weight} kg
                  </div>
                  <div className="flex items-center gap-1">
                    <Box size={14} /> {batch.stats.total} Pzas
                  </div>
                </div>

                {/* Action: Add to Truck */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  {trucks.map((truck) => (
                    <button
                      key={truck.id}
                      onClick={() => handleAddToTruck(truck.id, batch)}
                      className="text-[10px] py-1.5 px-2 bg-slate-100 hover:bg-slate-800 hover:text-white rounded text-slate-600 transition-colors flex items-center justify-center gap-1">
                      <ArrowRightCircle size={12} /> {truck.name.split(" ")[1]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* RIGHT: DOCK / TRUCKS */}
      <div className="w-2/3 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-slate-600" /> Muelles de Carga
          </h3>
          <div className="text-sm text-slate-500">Arrastra o haz clic en los lotes para asignarlos.</div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-6 overflow-y-auto pb-4">
          {trucks.map((truck) => (
            <TruckCard key={truck.id} truck={truck} onDispatch={handleDispatchTruck} onRemoveBatch={handleRemoveFromTruck} />
          ))}

          {/* Add Truck Button Placeholder */}
          <button className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all min-h-[300px]">
            <Plus size={48} className="mb-2 opacity-50" />
            <span className="font-bold">Solicitar Transporte</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
            <Factory className="text-emerald-500" /> KLEM<span className="font-light">WOOD</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">MES / ASP System v3.0</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavButton icon={LayoutDashboard} label="Dashboard" active={activeTab === "DASHBOARD"} onClick={() => setActiveTab("DASHBOARD")} />
          <NavButton icon={CalendarDays} label="Planificación (ASP)" active={activeTab === "SCHEDULER"} onClick={() => setActiveTab("SCHEDULER")} />
          <NavButton icon={Truck} label="Logística / Expedición" active={activeTab === "LOGISTICS"} onClick={() => setActiveTab("LOGISTICS")} />
          <div className="pt-8 pb-2 text-xs font-bold text-slate-600 uppercase">Configuración</div>
          <NavButton icon={Settings} label="Maestros" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4 text-slate-500">
            <div className="text-2xl font-bold text-slate-800">
              {activeTab === "SCHEDULER" ? "Planificador de Producción" : activeTab === "LOGISTICS" ? "Gestión de Logística y Despachos" : "Dashboard General"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-3 py-1.5 rounded-md text-sm font-mono text-slate-600 border border-slate-200">Última Sincro: Hace 1m</div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">G</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {/* KPI (Dynamic based on Tab) */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {activeTab === "LOGISTICS" ? (
              <>
                <KPICard
                  title="Lotes Listos para Envío"
                  value={batchStats.filter((b) => b.status === BatchStatus.READY_TO_SHIP).length}
                  icon={Box}
                  color="orange"
                />
                <KPICard title="Camiones en Muelle" value={trucks.length} icon={Truck} color="blue" />
                <KPICard title="Peso Total Despachado" value="12.5t" icon={Weight} color="emerald" sub="Hoy" />
                <KPICard title="Entregas Retrasadas" value="0" icon={AlertTriangle} color="emerald" />
              </>
            ) : (
              <>
                <KPICard title="Piezas Activas (MES)" value={allPieces.filter((p) => p.status === PieceStatus.IN_PROCESS).length} icon={Factory} color="blue" />
                <KPICard title="Progreso Turno" value="65%" icon={BarChart3} color="emerald" />
                <KPICard title="Carga CNC Est." value="320" icon={Drill} color="purple" sub="Piezas hoy" />
                <KPICard title="Scrap Rate" value="0.8%" icon={AlertTriangle} color="emerald" />
              </>
            )}
          </div>

          {/* VIEW SWITCHER */}
          {activeTab === "SCHEDULER" ? (
            renderSchedulerView()
          ) : activeTab === "LOGISTICS" ? (
            renderLogisticsView()
          ) : (
            <div className="text-center p-20 text-slate-400">Dashboard View Placeholder</div>
          )}
        </div>
      </main>

      {/* Modal Reused for Details */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedBatch ? `Detalle Lote: ${selectedBatch.id}` : ""}>
        {selectedBatch && (
          <div className="p-4">
            <h4 className="font-bold mb-2">Estado del Lote</h4>
            <div className="mb-4">
              <StatusBadge status={selectedBatch.status} />
            </div>
            <p className="text-sm text-slate-600">Aquí iría el detalle completo de piezas (BOM) visto anteriormente.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Helpers
interface NavButtonProps {
  icon: ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavButton({ icon: Icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      }`}>
      <Icon size={18} />
      {label}
    </button>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  color: string;
  sub?: string;
}

function KPICard({ title, value, icon: Icon, color, sub }: KPICardProps) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow cursor-default">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">{value}</h3>
        {sub && <p className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1 bg-slate-50 inline-block px-1.5 py-0.5 rounded">{sub}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colors[color] || "bg-slate-100"}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
