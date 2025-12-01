import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { SUITE_PRODUCTS, type SuiteProduct } from "../../shared/config/appConfig";
import { Button } from "../../shared/ui/CoreComponents";

const QuoterModule: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const product: SuiteProduct = SUITE_PRODUCTS.find((p) => p.id === productId) || {
    id: "error",
    name: "Módulo Desconocido",
    category: "Error",
    icon: AlertTriangle,
    color: "gray",
    description: "No se encontró el módulo solicitado.",
    path: "/",
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="w-5 h-5" /> Volver
          </Button>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2 text-white">
            {React.createElement(product.icon, { className: `text-${product.color}-500` })}
            <span className="font-bold text-xl">{product.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Guardar Borrador
          </Button>
          <Button variant="primary" size="sm">
            Exportar PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-6">
          <div className={`w-24 h-24 mx-auto rounded-full bg-${product.color}-500/20 flex items-center justify-center border-2 border-${product.color}-500`}>
            {React.createElement(product.icon, { className: `w-12 h-12 text-${product.color}-400` })}
          </div>
          <h2 className="text-3xl font-bold text-white">Módulo de {product.category}</h2>
          <p className="text-slate-400 text-lg">
            Estás en la ruta: <span className="font-mono bg-slate-800 px-2 py-1 rounded text-sm">/apps/quoter/{productId}</span>
          </p>
          <p className="text-slate-400 text-lg">{product.description}</p>
          <div className="mt-8 p-4 bg-slate-900 rounded border border-slate-800">
            <p className="text-sm text-slate-500">
              Próximamente: Integración con base de datos de materiales y lógica de precios específica para {product.name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoterModule;
