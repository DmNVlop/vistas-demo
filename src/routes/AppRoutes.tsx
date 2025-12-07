import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CuttingV2Module from "../modules/quoter/cutting-v2/CuttingV2Module";

// Lazy loading con rutas actualizadas
const LandingHub = lazy(() => import("../modules/landing/LandingModule"));
const MesModule = lazy(() => import("../modules/mes/MesModule"));
const QuoterModule = lazy(() => import("../modules/quoter/QuoterModule"));

const CuttingModule = lazy(() => import("../modules/quoter/cutting/CuttingModule"));
const KitchenDoorModule = lazy(() => import("../modules/quoter/kitchen-door/KitchenDoorModule"));

const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-blue-500">
    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <div className="text-sm font-mono uppercase tracking-widest text-slate-400">Cargando Módulo...</div>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingHub />} />

        {/* Módulo MES/APS (Con subrutas si fuera necesario, por ahora maneja estado interno) */}
        <Route path="/apps/mes/*" element={<MesModule />} />

        {/* Módulo Presupuestadores (Dinámico) */}
        <Route path="/apps/quoter/:productId" element={<QuoterModule />} />

        {/* Módulo Presupuestador Corte */}
        <Route path="/apps/quoter/cutting" element={<CuttingModule />} />

        {/* Módulo Presupuestador Corte V2 */}
        <Route path="/apps/quoter/cutting-v2" element={<CuttingV2Module />} />

        {/* Módulo Presupuestador Puertas de Cocina */}
        <Route path="/apps/quoter/kitchen-door" element={<KitchenDoorModule />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
