import React, { useState, useMemo } from "react";
import { Factory, Scan, Play, AlertTriangle, ArrowRight } from "lucide-react";
import type { Station, ProductionPart, StationType } from "../domain/types";
import { Button, Card } from "../../../shared/ui/CoreComponents";

interface FactoryViewProps {
  stations: Station[];
  allParts: ProductionPart[];
  onUpdatePart: (partId: string, stationType: StationType, status: "done" | "scrap") => void;
}

export const FactoryView: React.FC<FactoryViewProps> = ({ stations, allParts, onUpdatePart }) => {
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [operatorId, setOperatorId] = useState("");
  const [scannedPart, setScannedPart] = useState<ProductionPart | null>(null);
  const [processing, setProcessing] = useState(false);

  // Filtra piezas en cola para esta estación
  const queue = useMemo(() => {
    if (!activeStation) return [];
    return allParts.filter((p) => {
      const step = p.route.find((r) => r.stationType === activeStation.type);
      return step && step.status === "pending" && p.status === "waiting_next";
    });
  }, [allParts, activeStation]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("partInput") as HTMLInputElement;
    const partId = input.value;

    // Simulación de búsqueda
    const part = allParts.find((p) => p._id === partId);
    if (part && activeStation) {
      const currentRouteStep = part.route.find((r) => r.stationType === activeStation.type);
      if (currentRouteStep && currentRouteStep.status === "pending") {
        setScannedPart(part);
      } else {
        alert("ALERTA: Pieza incorrecta para esta estación o ya procesada.");
      }
    } else {
      alert("Pieza no encontrada.");
    }
    form.reset();
  };

  const startProcessing = () => {
    if (!activeStation || !scannedPart) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onUpdatePart(scannedPart._id, activeStation.type, "done");
      setScannedPart(null);
    }, 1500); // Ciclo rápido para demo
  };

  // 1. PANTALLA DE LOGIN
  if (!activeStation) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Factory className="mx-auto h-16 w-16 text-blue-500" />
            <h2 className="mt-4 text-3xl font-bold text-white uppercase tracking-widest">Login Puesto</h2>
          </div>
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setOperatorId("1234");
                    setActiveStation(s);
                  }}
                  className="p-4 bg-slate-700 hover:bg-blue-600 text-white font-bold rounded border border-slate-600 transition-colors">
                  {s.name}
                </button>
              ))}
            </div>
            <input
              type="password"
              value={operatorId}
              readOnly
              className="w-full bg-slate-900 border border-slate-600 rounded p-4 text-center text-2xl text-white tracking-[1em]"
              placeholder="••••"
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. INTERFAZ OPERARIO (TOUCH)
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <header className="bg-slate-900 p-4 flex justify-between items-center border-b-4 border-blue-600">
        <div>
          <h1 className="text-2xl font-bold uppercase text-blue-400">{activeStation.name}</h1>
          <p className="text-slate-400 text-sm">OP: Jorge M.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-slate-800 px-4 py-2 rounded border border-slate-700 text-center">
            <div className="text-xs text-slate-400 uppercase">Cola</div>
            <div className="text-xl font-mono font-bold">{queue.length}</div>
          </div>
          <Button variant="secondary" onClick={() => setActiveStation(null)}>
            Salir
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* IZQUIERDA: Escáner / Info Pieza */}
        <div className="w-1/2 p-6 flex flex-col gap-6 border-r border-slate-800">
          <Card className="bg-slate-900">
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  name="partInput"
                  autoFocus
                  placeholder="Escanear..."
                  autoComplete="off"
                  className="w-full bg-slate-800 border-2 border-slate-600 focus:border-blue-500 rounded-lg py-4 pl-12 text-xl font-mono text-white outline-none"
                />
              </div>
            </form>
          </Card>

          {!scannedPart ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
              <ArrowRight className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-2xl font-bold uppercase">Esperando Pieza</h3>
            </div>
          ) : (
            <div className="flex-1 bg-slate-800 rounded-xl p-6 border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
              <h2 className="text-4xl font-mono font-bold text-white mb-2">{scannedPart._id}</h2>
              <div className="text-xl text-blue-400 font-bold mb-4">{scannedPart.name}</div>
              <div className="bg-slate-900 p-4 rounded-lg mb-4 border border-slate-700">
                <div className="text-sm text-slate-400 uppercase mb-1">Instrucción</div>
                <div className="text-xl font-medium">
                  {activeStation.type === "cutting" && "Programa: P_OPT_224.xml"}
                  {activeStation.type === "edge_banding" && "Canto: PVC 1mm Blanco"}
                  {activeStation.type === "cnc" && "Programa: DRILL_HINGE_L.mpr"}
                  {activeStation.type === "assembly" && "Armar Estructura"}
                </div>
              </div>
              <div className="text-lg">
                <span className="text-slate-400">Medidas:</span> <span className="font-mono">{scannedPart.dimensions}</span>
              </div>
            </div>
          )}
        </div>

        {/* DERECHA: Acciones */}
        <div className="w-1/2 p-6 flex flex-col justify-center gap-6 bg-slate-900/50">
          {scannedPart ? (
            processing ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <div className="w-32 h-32 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                <h2 className="text-3xl font-bold text-blue-400 uppercase">PROCESANDO...</h2>
              </div>
            ) : (
              <>
                <Button variant="success" size="xl" onClick={startProcessing} className="flex-1 text-3xl">
                  <Play className="w-12 h-12 fill-current" /> EJECUTAR
                </Button>
                <div className="grid grid-cols-2 gap-4 h-24">
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => {
                      setScannedPart(null);
                    }}>
                    <AlertTriangle className="w-6 h-6" /> SCRAP
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setScannedPart(null)}>
                    CANCELAR
                  </Button>
                </div>
              </>
            )
          ) : (
            <div className="h-full flex flex-col">
              <h3 className="text-slate-400 uppercase font-bold mb-4">Próximas en Cola ({queue.length})</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {queue.slice(0, 6).map((p) => (
                  <div key={p._id} className="bg-slate-800 p-4 rounded border-l-4 border-slate-600 flex justify-between items-center opacity-75">
                    <div>
                      <div className="font-mono text-sm text-slate-300">{p._id}</div>
                      <div className="text-white font-bold">{p.name}</div>
                    </div>
                    <div className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">{p.dimensions}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
