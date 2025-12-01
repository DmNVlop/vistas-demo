import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarClock, Truck, Factory, ArrowLeft, Cpu } from "lucide-react";

// Imports de Dominio y Servicios
import type { Order, ProductionPart, StationType } from "./domain/types";
import { INITIAL_ORDERS, generateMockParts, mockStations } from "./services/mesMockService";

// Imports de Vistas (Features)
import { DashboardView, PlanningView, LogisticsView } from "./features/OfficeViews";
import { FactoryView } from "./features/FactoryView";
import { Badge } from "../../shared/ui/CoreComponents";

const MesModule: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<"dashboard" | "planning" | "logistics" | "factory">("dashboard");

  // Estado Global del Módulo (Simulando BD)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [parts, setParts] = useState<ProductionPart[]>([]);

  // Inicialización de Datos
  useEffect(() => {
    if (parts.length === 0) {
      setParts(generateMockParts(orders));
    }
  }, []);

  // Lógica de Negocio: Actualizar Pieza
  const handleUpdatePart = (partId: string, stationType: StationType, newStatus: "done" | "scrap") => {
    setParts((prevParts) =>
      prevParts.map((part) => {
        if (part._id !== partId) return part;

        const newRoute = part.route.map((step) => {
          if (step.stationType === stationType) {
            const updatedStatus: "scrap" | "done" = newStatus === "scrap" ? "scrap" : "done";
            return { ...step, status: updatedStatus };
          }
          return step;
        });

        // Verificar si la pieza terminó
        const allDone = newRoute.every((r) => r.status === "done");
        const globalStatus = newStatus === "scrap" ? "scrap" : allDone ? "done" : "waiting_next";

        // Trigger simple para actualizar orden si pieza terminó
        if (allDone && part.status !== "done") {
          setOrders((prevOrders) => prevOrders.map((o) => (o.id === part.orderId ? { ...o, completedParts: o.completedParts + 1 } : o)));
        }

        return { ...part, route: newRoute, status: globalStatus };
      })
    );
  };

  const handleSimulateArdis = () => {
    alert("Conectando con Ardis... (Simulación: No se añadieron datos nuevos en esta demo)");
  };

  // Si es vista de fábrica, renderizamos pantalla completa sin sidebar
  if (currentView === "factory") {
    return <FactoryView stations={mockStations} allParts={parts} onUpdatePart={handleUpdatePart} />;
  }

  // Helper local para menú
  const MenuButton = ({ icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
        active ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}>
      {React.cloneElement(icon, { size: 20 })}
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans animate-in fade-in duration-300">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Cpu className="w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter">
              MES<span className="text-white">PRO</span>
            </span>
          </div>
          <button onClick={() => navigate("/")} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 mt-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Volver al Hub
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <MenuButton icon={<LayoutDashboard />} label="Dashboard BI" active={currentView === "dashboard"} onClick={() => setCurrentView("dashboard")} />
          <MenuButton icon={<CalendarClock />} label="Planificación APS" active={currentView === "planning"} onClick={() => setCurrentView("planning")} />
          <MenuButton icon={<Truck />} label="Logística" active={currentView === "logistics"} onClick={() => setCurrentView("logistics")} />
          <div className="pt-8 pb-2">
            <p className="px-4 text-xs font-bold text-slate-600 uppercase mb-2">Planta</p>
            <MenuButton icon={<Factory />} label="Vista Operario" active={false} onClick={() => setCurrentView("factory")} />
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white uppercase">
              {currentView === "dashboard" ? "Dashboard BI" : currentView === "planning" ? "Planificación APS" : "Logística"}
            </h1>
            <div className="flex gap-2 items-center">
              <Badge label="PRODUCTION" variant="production" />
              <span className="text-slate-500 font-mono text-sm">LIVE</span>
            </div>
          </div>

          {currentView === "dashboard" && <DashboardView orders={orders} parts={parts} stations={mockStations} />}
          {currentView === "planning" && <PlanningView orders={orders} onSimulateArdis={handleSimulateArdis} />}
          {currentView === "logistics" && <LogisticsView orders={orders} />}
        </div>
      </main>
    </div>
  );
};

export default MesModule;
