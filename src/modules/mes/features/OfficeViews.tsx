import React from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Truck, Cpu, Package } from "lucide-react";
import { Card, Badge, Button } from "../../../shared/ui/CoreComponents";
import type { Order, Station, ProductionPart } from "../domain/types";

// --- DASHBOARD VIEW (BI) ---
interface DashboardProps {
  orders: Order[];
  parts: ProductionPart[];
  stations: Station[];
}

export const DashboardView: React.FC<DashboardProps> = ({ orders, parts, stations }) => {
  const kpis = {
    dailyParts: parts.filter((p) => p.route.some((r) => r.status === "done")).length, // Simple mock logic
    efficiency: 87,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="OEE Global" className="border-l-4 border-l-emerald-500">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-mono font-bold text-white">{kpis.efficiency}%</span>
            <span className="text-emerald-400 text-sm font-bold flex items-center">
              <ArrowRight className="w-4 h-4 rotate-45" /> +2.4%
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 mt-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${kpis.efficiency}%` }}></div>
          </div>
        </Card>

        <Card title="Piezas Hoy" className="border-l-4 border-l-blue-500">
          <div className="text-4xl font-mono font-bold text-white">{kpis.dailyParts}</div>
          <div className="text-slate-400 text-xs mt-1">Objetivo: 2,500</div>
        </Card>

        <Card title="Cuellos de Botella" className="border-l-4 border-l-rose-500">
          <div className="text-xl font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Canteadora K-500
          </div>
          <div className="text-slate-400 text-xs mt-1">Cola: 450 piezas</div>
        </Card>

        <Card title="Predicción" className="border-l-4 border-l-amber-500">
          <div className="text-2xl font-bold text-white">ORD-003</div>
          <div className="text-amber-400 text-xs font-bold">Riesgo Retraso</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Órdenes Activas" className="lg:col-span-2">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono text-white">{order.id}</td>
                  <td className="px-4 py-3">{order.client}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-500"
                          style={{ width: `${(order.completedParts / order.totalParts) * 100}%` }}></div>
                      </div>
                      <span className="text-xs">{Math.round((order.completedParts / order.totalParts) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={order.status}
                      variant={
                        order.status === "done" ? "success" : order.status === "delayed" ? "danger" : order.status === "in_progress" ? "production" : "default"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Carga Máquinas">
          <div className="space-y-4">
            {stations.map((station) => (
              <div key={station.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{station.name}</span>
                  <span className="text-slate-400">85%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${station.id === "edge_01" ? "bg-rose-500" : "bg-blue-500"}`}
                    style={{ width: station.id === "edge_01" ? "95%" : "60%" }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- PLANNING VIEW (APS) ---
interface PlanningProps {
  orders: Order[];
  onSimulateArdis: () => void;
}

export const PlanningView: React.FC<PlanningProps> = ({ orders, onSimulateArdis }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Advanced Planning & Scheduling (APS)</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => alert("Simulando conexión con Python Solver...")}>
            <Cpu className="w-4 h-4" /> Optimizar Rutas
          </Button>
          <Button variant="primary" size="sm" onClick={onSimulateArdis}>
            <Package className="w-4 h-4" /> Importar Ardis (XML)
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded p-4">
        <div className="text-center text-slate-500 py-10 border-2 border-dashed border-slate-800 rounded">
          [AQUÍ IRÍA EL GANTT CHART DE PLANIFICACIÓN]
          <br />
          <span className="text-xs">Visualización de cargas de trabajo por máquina y turno</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Cola de Espera (Prioridad Python)">
          <ul className="space-y-2 text-sm text-slate-300">
            {orders.slice(0, 3).map((o, idx) => (
              <li key={o.id} className="flex justify-between items-center bg-slate-700/30 p-2 rounded border-l-2 border-blue-500">
                <span>
                  {o.id}: {o.client}
                </span>
                <span className="text-slate-500 font-mono">Prio: {100 - idx * 10}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Consumo Materiales">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Melamina Blanca 19mm</span>
                <span>120 Tableros</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full">
                <div className="bg-slate-400 h-full w-[40%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Roble Natural 19mm</span>
                <span className="text-rose-400">Low Stock</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full">
                <div className="bg-rose-500 h-full w-[15%]"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- LOGISTICS VIEW ---
interface LogisticsProps {
  orders: Order[];
}

export const LogisticsView: React.FC<LogisticsProps> = ({ orders }) => (
  <div className="space-y-6 animate-in slide-in-from-right duration-300">
    <h2 className="text-2xl font-bold text-white mb-6">Expedición y Carga</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {orders.map((order) => {
        const isReady = order.completedParts === order.totalParts && order.totalParts > 0;
        return (
          <Card key={order.id} className={isReady ? "border-emerald-500 border-2" : ""}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{order.client}</h3>
                <div className="font-mono text-slate-400">{order.id}</div>
              </div>
              {isReady ? (
                <div className="bg-emerald-600 text-white px-3 py-1 rounded font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> LISTO
                </div>
              ) : (
                <div className="bg-slate-700 text-slate-300 px-3 py-1 rounded flex items-center gap-2 text-xs">En Producción</div>
              )}
            </div>

            <div className="bg-slate-900 rounded p-4 mb-4">
              <div className="flex justify-between text-sm mb-2 text-slate-400">
                <span>Paletizado</span>
                <span>
                  {order.completedParts} / {order.totalParts}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isReady ? "bg-emerald-500" : "bg-blue-600"}`}
                  style={{ width: `${order.totalParts > 0 ? (order.completedParts / order.totalParts) * 100 : 0}%` }}></div>
              </div>
            </div>

            {isReady && (
              <Button variant="primary" className="w-full">
                <Truck className="w-5 h-5" /> GENERAR ALBARÁN
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  </div>
);
