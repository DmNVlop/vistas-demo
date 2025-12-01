import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, Calculator, Layers, ChevronRight, Box, Circle, Scissors, FileText } from "lucide-react";
import * as PIXI from "pixi.js";

// ==========================================
// 1. DOMAIN LAYER (interfaces/cutting.ts)
// ==========================================

// Material Definition
interface Material {
  id: string;
  name: string;
  thickness: number;
  type: "melamine" | "mdf" | "plywood";
  color: string;
  pricePerBoard: number; // Coste compra
  width: number;
  height: number;
}

// Edge Definition (Cantos)
type EdgeType = "none" | "pvc_04" | "pvc_1" | "pvc_2";

interface EdgeConfig {
  top: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
  right: EdgeType;
}

// Machining Definition (Mecanizados)
type MachiningType = "hinge" | "minifix" | "rafix" | "groove";

interface Machining {
  id: string;
  type: MachiningType;
  x: number;
  y: number;
  face: "A" | "B";
  params: Record<string, any>; // Flexible params (depth, diameter)
}

// The Core "Piece" Entity
interface Piece {
  id: string;
  description: string;
  materialId: string;
  length: number;
  width: number;
  quantity: number;
  grain: boolean; // Veta
  edges: EdgeConfig;
  machinings: Machining[];
}

// Optimization Result (From External API Mock)
interface OptimizationResult {
  boardsUsed: number;
  wastePercentage: number;
  totalEdgeMeters: number;
  totalMachiningOps: number;
  cuttingLayouts: string[]; // Placeholder for images
}

// ==========================================
// 2. INFRASTRUCTURE LAYER (services/mockOptimizer.ts)
// ==========================================

const MOCK_MATERIALS: Material[] = [
  { id: "m1", name: "Blanco Soft 19mm", thickness: 19, type: "melamine", color: "#F0F0F0", pricePerBoard: 45.0, width: 2440, height: 1220 },
  { id: "m2", name: "Roble Kendal 19mm", thickness: 19, type: "melamine", color: "#D2B48C", pricePerBoard: 58.5, width: 2440, height: 1220 },
  { id: "m3", name: "Gris Antracita 19mm", thickness: 19, type: "melamine", color: "#374151", pricePerBoard: 52.0, width: 2440, height: 1220 },
];

class OptimizerService {
  static async optimize(pieces: Piece[]): Promise<OptimizationResult> {
    // Simulating API Latency
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock Logic: Rough calculation
        const totalArea = pieces.reduce((acc, p) => acc + p.length * p.width * p.quantity, 0);
        const boardArea = 2440 * 1220;
        const boardsRaw = totalArea / boardArea;
        const waste = 0.15; // 15% merma promedio

        resolve({
          boardsUsed: Math.ceil(boardsRaw * (1 + waste)),
          wastePercentage: 15.5,
          totalEdgeMeters: pieces.reduce((acc, p) => acc + ((p.length + p.width) * 2 * p.quantity) / 1000, 0),
          totalMachiningOps: pieces.reduce((acc, p) => acc + p.machinings.length * p.quantity, 0),
          cuttingLayouts: ["layout_a", "layout_b"],
        });
      }, 1500);
    });
  }
}

// ==========================================
// 3. UI ATOMS (components/atoms/*)
// ==========================================

const Button = ({ children, variant = "primary", onClick, className = "", disabled = false }: any) => {
  const base = "px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost: "text-gray-500 hover:bg-gray-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant as keyof typeof styles]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {children}
    </button>
  );
};

const Input = ({ value, onChange, type = "text", className = "", ...props }: any) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${className}`}
    {...props}
  />
);

const Select = ({ value, onChange, options, className = "" }: any) => (
  <select
    value={value}
    onChange={onChange}
    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none ${className}`}>
    {options.map((opt: any) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ==========================================
// 4. UI MOLECULES (components/molecules/*)
// ==========================================

// El selector de cantos "Smart"
const EdgeSelector = ({ edges, onChange }: { edges: EdgeConfig; onChange: (e: EdgeConfig) => void }) => {
  const toggleEdge = (side: keyof EdgeConfig) => {
    const nextType: Record<EdgeType, EdgeType> = {
      none: "pvc_04",
      pvc_04: "pvc_1",
      pvc_1: "pvc_2",
      pvc_2: "none",
    };
    onChange({ ...edges, [side]: nextType[edges[side]] });
  };

  const getColor = (type: EdgeType) => {
    switch (type) {
      case "pvc_04":
        return "bg-blue-400";
      case "pvc_1":
        return "bg-green-500";
      case "pvc_2":
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 w-12 h-12 relative border rounded bg-gray-50">
      {/* Top */}
      <div
        onClick={() => toggleEdge("top")}
        className={`absolute top-0 w-8 h-1.5 cursor-pointer rounded-sm ${getColor(edges.top)} hover:opacity-80`}
        title="Superior"
      />
      {/* Bottom */}
      <div
        onClick={() => toggleEdge("bottom")}
        className={`absolute bottom-0 w-8 h-1.5 cursor-pointer rounded-sm ${getColor(edges.bottom)} hover:opacity-80`}
        title="Inferior"
      />
      {/* Left */}
      <div
        onClick={() => toggleEdge("left")}
        className={`absolute left-0 h-8 w-1.5 cursor-pointer rounded-sm ${getColor(edges.left)} hover:opacity-80`}
        title="Izquierdo"
      />
      {/* Right */}
      <div
        onClick={() => toggleEdge("right")}
        className={`absolute right-0 h-8 w-1.5 cursor-pointer rounded-sm ${getColor(edges.right)} hover:opacity-80`}
        title="Derecho"
      />

      <div className="text-[9px] text-gray-400 font-bold select-none">360º</div>
    </div>
  );
};

// ==========================================
// 5. VISUAL CORE (components/organisms/Visualizer.tsx)
// ==========================================

const PieceVisualizer = ({ piece, material }: { piece: Piece; material: Material }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // 1. Initialize Pixi App (PIXI v7 Compatible)
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 600;

    // Use v7 synchronous constructor with options object
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    // In v7, we access the canvas via .view
    // We cast to any because Typescript definitions might conflict between versions
    canvasRef.current.appendChild((app as any).view);
    appRef.current = app;

    return () => {
      // Cleanup: destroy(true) removes the view from DOM and cleans WebGL context
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };
  }, []); // Run once on mount

  // 2. Draw Logic
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // Reset stage
    app.stage.removeChildren();

    // Scale Logic
    const padding = 40;
    const availW = app.screen.width - padding * 2;
    const availH = app.screen.height - padding * 2;
    // Evitar división por cero
    const safeLen = piece.length || 1;
    const safeWid = piece.width || 1;
    const scale = Math.min(availW / safeLen, availH / safeWid);

    const drawW = piece.length * scale;
    const drawH = piece.width * scale;
    const startX = (app.screen.width - drawW) / 2;
    const startY = (app.screen.height - drawH) / 2;

    const graphics = new PIXI.Graphics();

    // 1. Base Material (v7 Syntax: beginFill, drawRect)
    const colorInt = parseInt(material.color.replace("#", ""), 16);
    graphics.lineStyle(2, 0x333333);
    graphics.beginFill(colorInt);
    graphics.drawRect(startX, startY, drawW, drawH);
    graphics.endFill();

    // 2. Grain Direction (Veta)
    // CORRECCIÓN: La veta "al largo" significa líneas paralelas a la medida Largo (Eje X)
    if (piece.grain) {
      graphics.lineStyle(1, 0x000000, 0.1);
      // Iteramos sobre la altura (Y) y dibujamos líneas horizontales
      for (let i = 10; i < drawH; i += 20) {
        graphics.moveTo(startX, startY + i);
        graphics.lineTo(startX + drawW, startY + i);
      }
    }

    // 3. Edges (Cantos)
    const drawEdge = (type: EdgeType, x1: number, y1: number, x2: number, y2: number) => {
      if (type === "none") return;
      let color = 0xcccccc;
      let thickness = 2;
      if (type === "pvc_04") {
        color = 0x60a5fa;
        thickness = 3;
      }
      if (type === "pvc_1") {
        color = 0x34d399;
        thickness = 5;
      }
      if (type === "pvc_2") {
        color = 0xef4444;
        thickness = 8;
      }

      graphics.lineStyle(thickness, color);
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
    };

    drawEdge(piece.edges.top, startX, startY, startX + drawW, startY);
    drawEdge(piece.edges.bottom, startX, startY + drawH, startX + drawW, startY + drawH);
    drawEdge(piece.edges.left, startX, startY, startX, startY + drawH);
    drawEdge(piece.edges.right, startX + drawW, startY, startX + drawW, startY + drawH);

    // 4. Machinings
    piece.machinings.forEach((mac) => {
      const mx = startX + mac.x * scale;
      const my = startY + mac.y * scale;

      graphics.lineStyle(1, 0x333333);

      if (mac.type === "hinge") {
        graphics.beginFill(0x999999);
        graphics.drawCircle(mx, my, (35 / 2) * scale);
        graphics.endFill();
      } else if (mac.type === "minifix") {
        graphics.beginFill(0xaaaaaa);
        graphics.drawCircle(mx, my, (15 / 2) * scale);
        graphics.endFill();
      }
    });

    // 5. Labels (v7 Syntax: new Text(string, style))
    const style = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 12, fill: "#666" });
    const textL = new PIXI.Text(`${piece.length} mm`, style);
    textL.x = startX + drawW / 2 - textL.width / 2;
    textL.y = startY - 20;

    const textW = new PIXI.Text(`${piece.width} mm`, style);
    textW.x = startX - 30;
    textW.y = startY + drawH / 2 - textW.height / 2;

    app.stage.addChild(graphics);
    app.stage.addChild(textL);
    app.stage.addChild(textW);
  }, [piece, material]);

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center">
      <div ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-mono">ESCALA: AUTO | VISOR PIXI.JS v7</div>
    </div>
  );
};

// ==========================================
// 6. ORGANISMS (components/organisms/*)
// ==========================================

const ResultsPanel = ({ result, pieces, onBack }: { result: OptimizationResult; pieces: Piece[]; onBack: () => void }) => {
  const totalPrice = result.boardsUsed * 45 + result.totalMachiningOps * 0.5 + result.totalEdgeMeters * 1.2;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" /> Presupuesto Final
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            Volver a Editar
          </Button>
          <Button>Exportar PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cost Summary */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 col-span-1 md:col-span-1">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Total Estimado</h3>
          <div className="text-4xl font-bold text-gray-900 mb-2">{totalPrice.toFixed(2)}€</div>
          <div className="text-sm text-green-600 mb-6 font-medium">+ IVA (21%) Incluido</div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Material ({result.boardsUsed} tableros)</span>
              <span className="font-medium">{(result.boardsUsed * 45).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cantos ({result.totalEdgeMeters.toFixed(1)}m)</span>
              <span className="font-medium">{(result.totalEdgeMeters * 1.2).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mecanizados ({result.totalMachiningOps} ops)</span>
              <span className="font-medium">{(result.totalMachiningOps * 0.5).toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Detalle de Optimización</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <div className="text-blue-600 text-sm font-medium">Aprovechamiento</div>
              <div className="text-2xl font-bold text-blue-800">{100 - result.wastePercentage}%</div>
              <div className="text-xs text-blue-400">Merma: {result.wastePercentage}%</div>
            </div>
            <div className="bg-orange-50 p-4 rounded border border-orange-100">
              <div className="text-orange-600 text-sm font-medium">Piezas Totales</div>
              <div className="text-2xl font-bold text-orange-800">{pieces.reduce((a, b) => a + b.quantity, 0)} u.</div>
            </div>
          </div>

          {/* Fake Layout Visualizer */}
          <div className="bg-gray-100 h-48 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Box className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <span className="text-gray-500 font-medium">Esquemas de Corte (Layouts)</span>
              <p className="text-xs text-gray-400">Generado por API Externa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. MAIN MODULE (App Entry)
// ==========================================

const CuttingModule = () => {
  // State Store
  const [pieces, setPieces] = useState<Piece[]>([
    {
      id: "1",
      description: "Costado Izquierdo",
      materialId: "m1",
      length: 2400,
      width: 600,
      quantity: 1,
      grain: true,
      edges: { top: "none", bottom: "none", left: "pvc_1", right: "none" },
      machinings: [{ id: "m1", type: "hinge", x: 37, y: 100, face: "A", params: {} }],
    },
  ]);
  const [selectedPieceId, setSelectedPieceId] = useState<string>("1");
  const [viewMode, setViewMode] = useState<"edit" | "calculating" | "results">("edit");
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // Derived State
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || pieces[0];
  const selectedMaterial = MOCK_MATERIALS.find((m) => m.id === selectedPiece.materialId) || MOCK_MATERIALS[0];

  // Handlers
  const updatePiece = (id: string, updates: Partial<Piece>) => {
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addPiece = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newPiece: Piece = {
      id: newId,
      description: "Nueva Pieza",
      materialId: "m1",
      length: 500,
      width: 300,
      quantity: 1,
      grain: true,
      edges: { top: "none", bottom: "none", left: "none", right: "none" },
      machinings: [],
    };
    setPieces([...pieces, newPiece]);
    setSelectedPieceId(newId);
  };

  const removePiece = (id: string) => {
    if (pieces.length > 1) {
      const newPieces = pieces.filter((p) => p.id !== id);
      setPieces(newPieces);
      if (selectedPieceId === id) setSelectedPieceId(newPieces[0].id);
    }
  };

  const addMachining = (type: MachiningType) => {
    if (!selectedPiece) return;
    const newOp: Machining = {
      id: Date.now().toString(),
      type,
      x: 50,
      y: 50,
      face: "A",
      params: {},
    };
    updatePiece(selectedPieceId, { machinings: [...selectedPiece.machinings, newOp] });
  };

  const handleCalculate = async () => {
    setViewMode("calculating");
    const result = await OptimizerService.optimize(pieces);
    setOptimizationResult(result);
    setViewMode("results");
  };

  // --- RENDER ---

  if (viewMode === "calculating") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Optimizando tableros...</h2>
        <p className="text-gray-500">Conectando con el motor de cálculo</p>
      </div>
    );
  }

  if (viewMode === "results" && optimizationResult) {
    return <ResultsPanel result={optimizationResult} pieces={pieces} onBack={() => setViewMode("edit")} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-600" />
          <h1 className="font-bold text-lg tracking-tight">
            Cutter<span className="text-blue-600">Pro</span> <span className="text-xs font-normal text-gray-400 ml-2">v0.1 DEMO</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-right mr-4 hidden md:block">
            <div className="font-medium">{pieces.length} Piezas</div>
            <div className="text-xs text-gray-400">Proyecto Sin Guardar</div>
          </div>
          <Button variant="primary" onClick={handleCalculate}>
            <Calculator className="w-4 h-4" /> Calcular Presupuesto
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Project Tree (Simplified) */}
        <aside className="w-64 bg-white border-r flex flex-col hidden md:flex">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Estructura</h3>
          </div>
          <div className="p-2 overflow-y-auto flex-1">
            <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-sm font-medium cursor-pointer">
              <Box className="w-4 h-4" /> Cocina Principal
            </div>
            <div className="pl-6 mt-1 space-y-1">
              <div className="text-sm text-gray-600 p-1 hover:bg-gray-50 rounded cursor-pointer flex items-center gap-2">
                <ChevronRight className="w-3 h-3" /> Mueble Bajo
              </div>
            </div>
          </div>
        </aside>

        {/* Center: The Smart Grid */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-2 border-b flex justify-between items-center bg-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase pl-2">Listado de Piezas</h3>
            <Button variant="ghost" className="h-8 text-xs" onClick={addPiece}>
              <Plus className="w-3 h-3 mr-1" /> Añadir Pieza
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10 text-xs text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3 border-b w-10">#</th>
                  <th className="p-3 border-b">Descripción</th>
                  <th className="p-3 border-b w-40">Material</th>
                  <th className="p-3 border-b w-24">Largo</th>
                  <th className="p-3 border-b w-24">Ancho</th>
                  <th className="p-3 border-b w-16">Cant.</th>
                  <th className="p-3 border-b w-16 text-center">Veta</th>
                  <th className="p-3 border-b w-20 text-center">Cantos</th>
                  <th className="p-3 border-b w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {pieces.map((p, idx) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPieceId(p.id)}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                      selectedPieceId === p.id ? "bg-blue-50/80 ring-1 ring-inset ring-blue-200" : ""
                    }`}>
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3">
                      <Input
                        value={p.description}
                        onChange={(e: any) => updatePiece(p.id, { description: e.target.value })}
                        className="bg-transparent border-transparent focus:bg-white focus:border-blue-300"
                      />
                    </td>
                    <td className="p-3">
                      <Select
                        value={p.materialId}
                        onChange={(e: any) => updatePiece(p.id, { materialId: e.target.value })}
                        options={MOCK_MATERIALS.map((m) => ({ value: m.id, label: m.name }))}
                        className="bg-transparent border-transparent focus:bg-white focus:border-blue-300"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={p.length}
                        onChange={(e: any) => updatePiece(p.id, { length: Number(e.target.value) })}
                        className="w-20 text-right bg-transparent border-transparent focus:bg-white focus:border-blue-300"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={p.width}
                        onChange={(e: any) => updatePiece(p.id, { width: Number(e.target.value) })}
                        className="w-20 text-right bg-transparent border-transparent focus:bg-white focus:border-blue-300"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={p.quantity}
                        onChange={(e: any) => updatePiece(p.id, { quantity: Number(e.target.value) })}
                        className="w-16 text-center bg-transparent border-transparent focus:bg-white focus:border-blue-300"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.grain}
                        onChange={(e) => updatePiece(p.id, { grain: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3 flex justify-center">
                      <EdgeSelector edges={p.edges} onChange={(e) => updatePiece(p.id, { edges: e })} />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePiece(p.id);
                        }}
                        className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Right: The Inspector (Visualizer) */}
        <aside className="w-80 bg-gray-50 border-l flex flex-col shadow-xl z-20">
          <div className="h-1/2 border-b relative bg-white">
            {/* Toolbar */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-2 bg-white/90 p-1 rounded shadow border backdrop-blur-sm">
              <button onClick={() => addMachining("hinge")} className="p-2 hover:bg-blue-100 rounded text-gray-600" title="Añadir Bisagra">
                <Circle className="w-4 h-4" />
              </button>
              <button onClick={() => addMachining("minifix")} className="p-2 hover:bg-blue-100 rounded text-gray-600" title="Añadir Minifix">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-blue-100 rounded text-gray-600" title="Herramienta Corte">
                <Scissors className="w-4 h-4" />
              </button>
            </div>

            {selectedPiece ? (
              <PieceVisualizer piece={selectedPiece} material={selectedMaterial} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Selecciona una pieza</div>
            )}
          </div>

          {/* Machining List / Properties */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Mecanizados en Pieza Activa</h3>

            {selectedPiece.machinings.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic">Arrastra herramientas o usa la barra flotante para añadir mecanizados.</div>
            )}

            <div className="space-y-2">
              {selectedPiece.machinings.map((mac, i) => (
                <div key={mac.id} className="bg-white p-2 rounded border shadow-sm text-sm flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</div>
                    <div>
                      <div className="font-medium text-gray-700 capitalize">{mac.type}</div>
                      <div className="text-xs text-gray-400">
                        X: {mac.x}mm | Y: {mac.y}mm
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="number"
                      className="w-12 h-6 border rounded text-xs text-right px-1"
                      value={mac.x}
                      onChange={(e) => {
                        const newMacs = [...selectedPiece.machinings];
                        newMacs[i].x = Number(e.target.value);
                        updatePiece(selectedPieceId, { machinings: newMacs });
                      }}
                    />
                    <button
                      onClick={() => {
                        const newMacs = selectedPiece.machinings.filter((m) => m.id !== mac.id);
                        updatePiece(selectedPieceId, { machinings: newMacs });
                      }}
                      className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CuttingModule;
