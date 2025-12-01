import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, ArrowRight, Bell, Settings, LogOut, User, HelpCircle } from "lucide-react";

// Imports desde Shared (UI Genérica)
import { Button, Badge } from "../../shared/ui/CoreComponents";
import { APP_NAME, APP_ENTERPRISE_NAME, SUITE_PRODUCTS } from "../../shared/config/appConfig";

const LandingHub: React.FC = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-y-auto flex flex-col">
      {/* --- NAVBAR --- */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
              Ok
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">
                <span className="text-blue-500">{APP_NAME}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Platform v2.0</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800 mr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-400">All Systems Operational</span>
            </div>

            {/* Utility Icons */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
              <HelpCircle size={20} />
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-800 mx-1"></div>

            {/* User Profile Dropdown Simulator */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-slate-800 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  AG
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-bold text-slate-200 leading-none">Admin Global</div>
                  <div className="text-[10px] text-slate-500 font-medium">Planta Valencia</div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-sm text-white font-bold">Admin Global</p>
                    <p className="text-xs text-slate-500">admin@industrialsuite.com</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors">
                    <User size={16} /> Mi Perfil
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors">
                    <Settings size={16} /> Configuración Global
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-20 pb-16 px-6 text-center max-w-5xl mx-auto z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <Badge label="ENTERPRISE EDITION" variant="production" />

        <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent drop-shadow-sm">
          El Sistema Operativo <br /> de tu Fábrica.
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Centralización total. Desde la planificación inteligente (APS) hasta la ejecución en planta (MES) y presupuestación comercial.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/apps/mes")}>
            <Play className="fill-current w-5 h-5" /> Launch Demo MES
          </Button>
          <Button size="lg" variant="outline" onClick={() => alert("Documentación en construcción")}>
            <HelpCircle className="w-5 h-5" /> Documentación
          </Button>
        </div>
      </header>

      {/* --- APPS GRID --- */}
      <section className="flex-1 max-w-7xl mx-auto px-6 pb-20 w-full z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Módulos Instalados</h2>
          <div className="flex gap-2 text-sm">
            <button className="px-3 py-1 rounded-full bg-slate-800 text-white font-medium border border-slate-700 hover:bg-slate-700 transition-colors">
              Todos
            </button>
            <button className="px-3 py-1 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-slate-800">Producción</button>
            <button className="px-3 py-1 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-slate-800">Ventas</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUITE_PRODUCTS.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(product.path)}
              className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-6 transition-all hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer overflow-hidden flex flex-col">
              {/* Background Glow */}
              <div
                className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-${product.color}-600 to-transparent opacity-10 blur-2xl group-hover:opacity-30 transition-opacity`}></div>

              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-lg bg-slate-800 text-${product.color}-400 group-hover:bg-${product.color}-500 group-hover:text-white transition-colors shadow-sm`}>
                  {React.createElement(product.icon, { size: 28 })}
                </div>
                <Badge
                  label={product.category === "Producción" ? "PRODUCCIÓN" : "COMERCIAL"}
                  variant={product.category === "Producción" ? "production" : "success"}
                />
              </div>

              <h3 className="text-xl font-bold mb-2 text-slate-100 group-hover:text-blue-400 transition-colors">{product.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{product.description}</p>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-auto">
                <span className="text-xs text-slate-500 font-mono group-hover:text-slate-300 transition-colors">v1.2.0</span>
                <div className="flex items-center text-sm font-bold text-slate-500 group-hover:text-white transition-colors">
                  Acceder <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 mt-auto z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 opacity-75">
                <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center font-bold text-sm text-white">Ok</div>
                <span className="font-bold text-lg tracking-tight text-slate-300">
                  <span className="text-blue-500">{APP_NAME}</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Arquitectura de software industrial diseñada para escalabilidad, robustez y control en tiempo real.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Plataforma</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Estado del Servicio</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Release Notes</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Roadmap</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Soporte</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Centro de Ayuda</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">API Docs</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Contactar Ingeniería</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Privacidad</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Términos de Servicio</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Seguridad</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600">&copy; 2025 {APP_ENTERPRISE_NAME}. Desarrollado por DmN.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400 font-mono">SERVER: ONLINE</span>
              </div>
              <span className="text-xs text-slate-600 font-mono">v2.4.1-stable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingHub;
