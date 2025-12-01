import { useState, useEffect, useRef, useMemo } from "react";
import * as PIXI from "pixi.js";
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRightLeft,
  FileSpreadsheet,
  Wrench,
  X,
  ScanLine, // Icono para Cantos
} from "lucide-react";

/* ===========================================================================
  CAPA DE DATOS & SERVICIOS MOCK
  ===========================================================================
*/

// Catálogo de Modelos
const CATALOG_MODELS = [
  { id: "MOD_LISO", name: "Serie Flat (Lisa)", type: "FLAT", minW: 100, minH: 100, thickness: 19 },
  { id: "MOD_J_PULL", name: "Serie Integra (Uñero J)", type: "J_PULL", minW: 150, minH: 100, thickness: 22 },
  { id: "MOD_SHAKER", name: "Serie Oxford (Enmarcada)", type: "SHAKER", minW: 250, minH: 250, frameWidth: 60, thickness: 22 },
];

// Acabados (Superficies)
const FINISHES = [
  { id: "F01", name: "Blanco Mate", group: "G1", color: 0xf5f5f5 },
  { id: "F02", name: "Roble Nudos", group: "G2", color: 0xd2b48c },
  { id: "F03", name: "Gris Antracita", group: "G1", color: 0x374151 },
  { id: "F04", name: "Azul Noche (Laca)", group: "G3", color: 0x1e3a8a },
];

// NUEVO: Catálogo de Cantos (Edge Banding)
const CATALOG_EDGES = [
  { id: "EDGE_AUTO", name: "Igual a Superficie (Estándar)", pricePerMeter: 1.5, color: null }, // Color null = hereda
  { id: "EDGE_ALU", name: "PVC Efecto Aluminio", pricePerMeter: 2.8, color: 0xcccccc },
  { id: "EDGE_PLY", name: "PVC Efecto Contrachapado", pricePerMeter: 3.5, color: 0xeebb99 },
  { id: "EDGE_BLK", name: "PVC Negro Mate", pricePerMeter: 2.0, color: 0x222222 },
  { id: "EDGE_WHT", name: "PVC Blanco Brillo", pricePerMeter: 1.8, color: 0xffffff },
];

// Extras / Accesorios
const CATALOG_EXTRAS = [
  { id: "DRILL_STD", name: "Taladro Bisagra Std", price: 1.5, category: "Mecanizado" },
  { id: "HANDLE_GOLA", name: "Perfil Gola (Corte)", price: 4.0, category: "Mecanizado" },
  { id: "HANDLE_KNOB", name: "Tirador Pomo Negro", price: 3.2, category: "Herraje" },
  { id: "HINGE_SLOW", name: "Bisagra Cierre Suave", price: 5.5, category: "Herraje" },
  { id: "CUT_SPECIAL", name: "Corte en Inglete 45º", price: 8.0, category: "Mecanizado" },
];

// SERVICIO DE PRECIOS
const PRICING_MATRIX = {
  basePrice: 25,
};

const PricingService = {
  calculatePrice: (w: number, h: number, finishGroup: string | undefined, edgeId: string, extrasIds: string[] = []) => {
    if (!w || !h) return 0;

    // 1. Precio Base (M2)
    const area = (w * h) / 1000000;
    let groupMultiplier = 1;
    if (finishGroup === "G2") groupMultiplier = 1.4;
    if (finishGroup === "G3") groupMultiplier = 2.2;

    const widthPremium = w > 600 ? 1.2 : 1;
    const heightPremium = h > 900 ? 1.1 : 1;

    let total = (PRICING_MATRIX.basePrice + area * 80) * groupMultiplier * widthPremium * heightPremium;

    // 2. NUEVO: Precio del Canto (Metro Lineal)
    // Perímetro = (Ancho + Alto) * 2 / 1000 para pasar a metros
    const perimeterMeters = (w * 2 + h * 2) / 1000;
    const edgeObj = CATALOG_EDGES.find((e) => e.id === edgeId) || CATALOG_EDGES[0];
    total += perimeterMeters * edgeObj.pricePerMeter;

    // 3. Extras
    extrasIds.forEach((id) => {
      const extra = CATALOG_EXTRAS.find((e) => e.id === id);
      if (extra) total += extra.price;
    });

    return Math.round(total * 100) / 100;
  },
};

/* ===========================================================================
  COMPONENTES VISUALES (PIXI.JS)
  ===========================================================================
*/

interface DoorPreviewProps {
  width: number;
  height: number;
  modelType: string;
  color: number;
  edgeColor: number | null;
  grainDirection: string;
  extras?: string[];
  frameWidth?: number;
}

const DoorPreview = ({ width, height, modelType, color, edgeColor, grainDirection, extras = [], frameWidth = 60 }: DoorPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const app = new PIXI.Application({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    return () => app.destroy(true, { children: true, texture: true, baseTexture: true });
  }, []);

  useEffect(() => {
    if (!appRef.current) return;
    const app = appRef.current;
    app.stage.removeChildren();

    const canvasW = app.screen.width;
    const canvasH = app.screen.height;
    const padding = 40;

    const maxDisplayW = canvasW - padding * 2;
    const maxDisplayH = canvasH - padding * 2;

    const scaleX = maxDisplayW / (width || 100);
    const scaleY = maxDisplayH / (height || 100);
    const scale = Math.min(scaleX, scaleY, 1.5);

    const drawW = (width || 100) * scale;
    const drawH = (height || 100) * scale;
    const startX = (canvasW - drawW) / 2;
    const startY = (canvasH - drawH) / 2;

    // --- NUEVO: Logica de Color de Canto ---
    // Si edgeColor es null, usamos el color de la puerta pero un poco más oscuro para que se note el borde

    // Si el canto es igual a la superficie, dibujamos linea fina oscura, si es diferente, linea gruesa del color
    const strokeThickness = edgeColor !== null ? 4 * scale : 1;
    const strokeColor = edgeColor !== null ? edgeColor : 0x000000;
    const strokeAlpha = edgeColor !== null ? 1 : 0.2;

    // 1. Base (Cuerpo de la puerta)
    const door = new PIXI.Graphics();

    // Dibujar Canto (Borde)
    door.lineStyle(strokeThickness, strokeColor, strokeAlpha);
    door.beginFill(color);
    door.drawRect(0, 0, drawW, drawH);
    door.endFill();

    // 2. Modelo Interior
    if (modelType === "SHAKER") {
      const framePx = frameWidth * scale;
      door.lineStyle(1, 0x000000, 0.1);
      door.beginFill(0x000000, 0.05);
      door.drawRect(framePx, framePx, drawW - framePx * 2, drawH - framePx * 2);
      door.endFill();
    } else if (modelType === "J_PULL") {
      door.beginFill(0x000000, 0.15);
      door.drawRect(0, 0, drawW, 25 * scale);
      door.endFill();
    }

    // 3. Veta
    if (grainDirection) {
      const lines = new PIXI.Graphics();
      lines.lineStyle(1, 0x000000, 0.05);
      const step = 20 * scale;
      if (grainDirection === "vertical") {
        for (let i = 0; i < drawW; i += step) {
          lines.moveTo(i, 0);
          lines.lineTo(i, drawH);
        }
      } else {
        for (let i = 0; i < drawH; i += step) {
          lines.moveTo(0, i);
          lines.lineTo(drawW, i);
        }
      }
      door.addChild(lines);
    }

    // 4. Mecanizados
    if (extras.includes("DRILL_STD")) {
      const holeSize = 35 * scale;
      const offset = 100 * scale;
      const holes = new PIXI.Graphics();
      holes.lineStyle(2, 0xff0000, 0.8);
      holes.beginFill(0xffffff, 0.5);
      holes.drawCircle(22 * scale, offset, holeSize / 2);
      holes.drawCircle(22 * scale, drawH - offset, holeSize / 2);
      holes.endFill();
      door.addChild(holes);
    }

    // Icono mecanizados especiales
    if (extras.some((e) => e !== "DRILL_STD")) {
      const icon = new PIXI.Text("⚙️", { fontSize: 24 * scale });
      icon.x = drawW - 30 * scale;
      icon.y = drawH - 30 * scale;
      door.addChild(icon);
    }

    door.x = startX;
    door.y = startY;
    app.stage.addChild(door);

    // Cotas
    const style = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 12, fill: "#666" });
    const textW = new PIXI.Text(`${width}mm`, style);
    textW.x = startX + drawW / 2 - textW.width / 2;
    textW.y = startY + drawH + 5;
    app.stage.addChild(textW);

    const textH = new PIXI.Text(`${height}mm`, style);
    textH.x = startX - 25;
    textH.y = startY + drawH / 2;
    textH.rotation = -Math.PI / 2;
    app.stage.addChild(textH);
  }, [width, height, modelType, color, edgeColor, grainDirection, extras, frameWidth]);

  return <div ref={containerRef} className="w-full h-full" />;
};

/* ===========================================================================
  MODAL: GESTIÓN DE EXTRAS
  ===========================================================================
*/
interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExtras: string[];
  onToggleExtra: (id: string) => void;
}

const ExtrasModal = ({ isOpen, onClose, selectedExtras, onToggleExtra }: ExtrasModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Wrench size={18} className="text-indigo-600" /> Accesorios y Mecanizados
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            {CATALOG_EXTRAS.map((extra) => {
              const isActive = selectedExtras.includes(extra.id);
              return (
                <div
                  key={extra.id}
                  onClick={() => onToggleExtra(extra.id)}
                  className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${
                    isActive ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isActive ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"
                      }`}>
                      {isActive && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{extra.name}</div>
                      <div className="text-xs text-gray-500">{extra.category}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-600">+{extra.price.toFixed(2)}€</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
          <button onClick={onClose} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 font-medium">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===========================================================================
  COMPONENTE PRINCIPAL
  ===========================================================================
*/

interface Row {
  id: number;
  type: string;
  modelId: string;
  finishId: string;
  edgeId: string;
  width: number;
  height: number;
  qty: number;
  extras: string[];
  notes: string;
}

export default function KitchenDoorModule() {
  const [defaultConfig, setDefaultConfig] = useState({
    modelId: "MOD_LISO",
    finishId: "F01",
    edgeId: "EDGE_AUTO", // Default edge setting
    grainDirection: "vertical",
    customerRef: "",
  });

  const [rows, setRows] = useState<Row[]>([
    {
      id: 1,
      type: "DOOR",
      modelId: "MOD_LISO",
      finishId: "F01",
      edgeId: "EDGE_AUTO",
      width: 600,
      height: 700,
      qty: 2,
      extras: ["DRILL_STD"],
      notes: "Bajo Fregadero",
    },
    {
      id: 2,
      type: "DRAWER",
      modelId: "MOD_LISO",
      finishId: "F03",
      edgeId: "EDGE_ALU", // Ejemplo: Cajón Gris con canto Aluminio
      width: 600,
      height: 180,
      qty: 1,
      extras: ["HANDLE_KNOB"],
      notes: "Cubertero Diseño",
    },
  ]);

  const [selectedRowId, setSelectedRowId] = useState(1);
  const [editingExtrasId, setEditingExtrasId] = useState<number | null>(null);

  // --- Helpers ---
  const activeRow = rows.find((r) => r.id === selectedRowId) || rows[0];
  const activeRowModel = CATALOG_MODELS.find((m) => m.id === activeRow.modelId) || CATALOG_MODELS[0];
  const activeRowFinish = FINISHES.find((f) => f.id === activeRow.finishId) || FINISHES[0];
  const activeRowEdge = CATALOG_EDGES.find((e) => e.id === activeRow.edgeId) || CATALOG_EDGES[0];

  const totalAmount = useMemo(() => {
    return rows.reduce((acc, row) => {
      const finish = FINISHES.find((f) => f.id === row.finishId);
      const price = PricingService.calculatePrice(row.width, row.height, finish?.group, row.edgeId, row.extras);
      return acc + price * row.qty;
    }, 0);
  }, [rows]);

  // --- Handlers ---
  const handleRowChange = (id: number, field: keyof Row, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) return { ...row, [field]: value };
        return row;
      })
    );
    if (id !== selectedRowId) setSelectedRowId(id);
  };

  const toggleExtraForRow = (rowId: number, extraId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const hasExtra = row.extras.includes(extraId);
          const newExtras = hasExtra ? row.extras.filter((e) => e !== extraId) : [...row.extras, extraId];
          return { ...row, extras: newExtras };
        }
        return row;
      })
    );
  };

  const addRow = () => {
    const newId = Math.max(...rows.map((r) => r.id), 0) + 1;
    setRows([
      ...rows,
      {
        id: newId,
        type: "DOOR",
        modelId: defaultConfig.modelId,
        finishId: defaultConfig.finishId,
        edgeId: defaultConfig.edgeId,
        width: 0,
        height: 0,
        qty: 1,
        extras: [],
        notes: "",
      },
    ]);
    setSelectedRowId(newId);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
      if (selectedRowId === id) setSelectedRowId(rows[0].id);
    }
  };

  const getUnitPrice = (row: Row) => {
    const finish = FINISHES.find((f) => f.id === row.finishId);
    return PricingService.calculatePrice(row.width, row.height, finish?.group, row.edgeId, row.extras);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      {/* HEADER: CONFIG DEFAULT */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Módulo de Puertas (Edición Cantos)</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Suite de Fabricación v2.3</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
            <span className="text-xs font-semibold text-yellow-800 flex items-center gap-1">
              <AlertTriangle size={12} /> Info:
            </span>
            <span className="text-xs text-yellow-700">Valores por defecto para NUEVAS líneas.</span>
          </div>
        </div>

        {/* Default Settings */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
          <div className="absolute -top-3 left-3 bg-slate-50 px-2 text-xs font-bold text-slate-400">VALORES POR DEFECTO</div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Modelo Base</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={defaultConfig.modelId}
              onChange={(e) => setDefaultConfig({ ...defaultConfig, modelId: e.target.value })}>
              {CATALOG_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Acabado Base</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={defaultConfig.finishId}
              onChange={(e) => setDefaultConfig({ ...defaultConfig, finishId: e.target.value })}>
              {FINISHES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Canto (Borde)</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={defaultConfig.edgeId}
              onChange={(e) => setDefaultConfig({ ...defaultConfig, edgeId: e.target.value })}>
              {CATALOG_EDGES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dirección Veta</label>
            <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setDefaultConfig({ ...defaultConfig, grainDirection: "vertical" })}
                className={`flex-1 py-2 text-xs font-medium flex justify-center items-center gap-2 ${
                  defaultConfig.grainDirection === "vertical" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <ArrowRightLeft className="rotate-90" size={14} /> Vert.
              </button>
              <div className="w-px bg-gray-300"></div>
              <button
                onClick={() => setDefaultConfig({ ...defaultConfig, grainDirection: "horizontal" })}
                className={`flex-1 py-2 text-xs font-medium flex justify-center items-center gap-2 ${
                  defaultConfig.grainDirection === "horizontal" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <ArrowRightLeft size={14} /> Horiz.
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ref. Cliente</label>
            <input
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={defaultConfig.customerRef}
              onChange={(e) => setDefaultConfig({ ...defaultConfig, customerRef: e.target.value })}
            />
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
          <div className="p-2 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
            <div className="flex gap-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileSpreadsheet size={16} /> Desglose
              </h3>
            </div>
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded shadow-sm transition-all">
              <Plus size={14} /> Añadir Fila
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-8 text-center">#</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-24">Tipo</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-32">Modelo</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-32">Acabado</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-32">Canto</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-20">Ancho</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-20">Alto</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-16">Cant.</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-20 text-center">Extras</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b text-right">Precio Ud.</th>
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const unitPrice = getUnitPrice(row);
                  const isSelected = selectedRowId === row.id;
                  const rowModel = CATALOG_MODELS.find((m) => m.id === row.modelId) || CATALOG_MODELS[0];
                  const isValid = row.width >= rowModel.minW && row.height >= rowModel.minH;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRowId(row.id)}
                      className={`
                        group border-b border-gray-100 text-sm transition-colors cursor-pointer
                        ${isSelected ? "bg-indigo-50 ring-1 ring-inset ring-indigo-300" : "hover:bg-gray-50"}
                        ${!isValid && row.width > 0 ? "bg-red-50" : ""}
                      `}>
                      <td className="py-1 px-2 text-center text-gray-400 font-mono text-xs">{index + 1}</td>
                      <td className="py-1 px-2">
                        <select
                          className="w-full bg-transparent border-none p-0 text-xs font-medium text-gray-700 focus:ring-0"
                          value={row.type}
                          onChange={(e) => handleRowChange(row.id, "type", e.target.value)}>
                          <option value="DOOR">Puerta</option>
                          <option value="DRAWER">F. Cajón</option>
                          <option value="FILLER">Regleta</option>
                        </select>
                      </td>
                      <td className="py-1 px-2">
                        <select
                          className="w-full bg-white/50 border border-gray-200 rounded px-1 py-0.5 text-xs text-gray-600 focus:ring-1 focus:ring-indigo-500"
                          value={row.modelId}
                          onChange={(e) => handleRowChange(row.id, "modelId", e.target.value)}>
                          {CATALOG_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1 px-2">
                        <select
                          className="w-full bg-white/50 border border-gray-200 rounded px-1 py-0.5 text-xs text-gray-600 focus:ring-1 focus:ring-indigo-500"
                          value={row.finishId}
                          onChange={(e) => handleRowChange(row.id, "finishId", e.target.value)}>
                          {FINISHES.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* NUEVA COLUMNA DE CANTOS EN GRID */}
                      <td className="py-1 px-2">
                        <select
                          className="w-full bg-white/50 border border-gray-200 rounded px-1 py-0.5 text-xs text-gray-600 focus:ring-1 focus:ring-indigo-500"
                          value={row.edgeId}
                          onChange={(e) => handleRowChange(row.id, "edgeId", e.target.value)}>
                          {CATALOG_EDGES.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-1 px-2">
                        <input
                          type="number"
                          className={`w-full bg-white border rounded px-2 py-1 text-right text-xs focus:ring-1 focus:ring-indigo-500 ${
                            !isValid ? "border-red-300 text-red-600" : "border-gray-200"
                          }`}
                          value={row.width}
                          onChange={(e) => handleRowChange(row.id, "width", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-right text-xs focus:ring-1 focus:ring-indigo-500"
                          value={row.height}
                          onChange={(e) => handleRowChange(row.id, "height", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-center text-xs focus:ring-1 focus:ring-indigo-500 font-bold"
                          value={row.qty}
                          onChange={(e) => handleRowChange(row.id, "qty", parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingExtrasId(row.id);
                          }}
                          className={`
                            px-2 py-1 rounded text-xs border flex items-center justify-center gap-1 w-full transition-all
                            ${
                              row.extras.length > 0
                                ? "bg-indigo-100 border-indigo-200 text-indigo-700"
                                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                            }
                          `}>
                          {row.extras.length > 0 ? <Wrench size={10} /> : <Plus size={10} />}
                        </button>
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-gray-700 text-xs">{unitPrice.toFixed(2)}€</td>
                      <td className="py-1 px-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRow(row.id);
                          }}
                          className="text-gray-300 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end items-center">
            <div className="text-right">
              <span className="block text-xs text-gray-500 uppercase">Base Imponible</span>
              <span className="text-2xl font-bold text-gray-900">{totalAmount.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* RIGHT: INSPECTOR TÉCNICO */}
        <div className="w-80 bg-slate-100 border-l border-gray-200 flex flex-col shadow-inner">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Inspector Técnico</h3>
            <div className="text-sm font-bold text-gray-800">{activeRowModel.name}</div>

            {/* Detalles Material y Canto */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Acabado:</span>
                <span className="font-medium text-gray-700">{activeRowFinish.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <ScanLine size={10} /> Canto:
                </span>
                <span className="font-medium text-gray-700 truncate max-w-[150px]">{activeRowEdge.name}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {activeRow.extras.map((eid) => {
                const ex = CATALOG_EXTRAS.find((e) => e.id === eid);
                return ex ? (
                  <span key={eid} className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 truncate max-w-full">
                    {ex.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          <div className="flex-1 p-4 flex justify-center items-center relative bg-slate-200/50 overflow-hidden">
            <div className="w-full h-full shadow-lg bg-white rounded-sm border border-gray-300 relative">
              {activeRow.width > 0 ? (
                <DoorPreview
                  width={activeRow.width}
                  height={activeRow.height}
                  modelType={activeRowModel.type}
                  color={activeRowFinish.color}
                  edgeColor={activeRowEdge.color} // Pasamos el color del canto al visualizador
                  grainDirection={defaultConfig.grainDirection}
                  extras={activeRow.extras}
                  frameWidth={activeRowModel.frameWidth}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">Sin dimensiones</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EXTRAS */}
      {editingExtrasId && (
        <ExtrasModal
          isOpen={!!editingExtrasId}
          onClose={() => setEditingExtrasId(null)}
          selectedExtras={rows.find((r) => r.id === editingExtrasId)?.extras || []}
          onToggleExtra={(extraId) => toggleExtraForRow(editingExtrasId, extraId)}
        />
      )}
    </div>
  );
}
