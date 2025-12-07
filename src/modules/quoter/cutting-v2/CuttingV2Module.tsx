import React, { useState, useMemo } from "react";
import {
  Maximize2,
  Plus,
  Trash2,
  Save,
  Layers,
  Box,
  ArrowRightLeft,
  CheckSquare,
  Square,
  RefreshCw,
  Scissors,
  FileText,
  Hash,
  LayoutDashboard,
  X,
  Pencil,
  RotateCcw,
  ArrowRight,
  ArrowDown,
  Move,
  Ban,
} from "lucide-react";

// --- TIPO DE DATOS ---

interface Material {
  id: string;
  name: string;
  category: "Melamina" | "MDF" | "Aglom";
  thickness: number;
  color: string; // Hex fallback
  textureUrl?: string; // URL simulada para textura
  pricePerM2: number;
  defaultCantoId: string; // ID del canto sugerido por defecto
  hasGrain: boolean; // Nuevo: Indica si el material tiene veta visible
}

interface Canto {
  id: string;
  name: string;
  thickness: number; // 0.4, 1.0, 2.0 mm
  color: string;
  textureUrl?: string;
}

interface EdgeConfig {
  l1: boolean; // Largo 1
  l2: boolean; // Largo 2
  a1: boolean; // Ancho 1
  a2: boolean; // Ancho 2
  cantoId: string; // ID del canto seleccionado
}

interface Piece {
  id: string;
  materialId: string;
  length: number;
  width: number;
  quantity: number;
  edges: EdgeConfig;
  grain: "longitudinal" | "transversal" | "none"; // ACTUALIZADO: 3 Estados
  label?: string;
}

// --- DATOS MOCK (Simulación de Base de Datos) ---

const MOCK_CANTOS: Canto[] = [
  {
    id: "c1",
    name: "Canto Nogal 0.4mm",
    thickness: 0.4,
    color: "#5d4037",
    textureUrl: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=50",
  },
  { id: "c2", name: "Canto Blanco 1.0mm", thickness: 1.0, color: "#f5f5f5" },
  {
    id: "c3",
    name: "Canto Roble 0.4mm",
    thickness: 0.4,
    color: "#8d6e63",
    textureUrl: "https://images.unsplash.com/photo-1519757077978-5a4e3989c933?auto=format&fit=crop&q=80&w=50",
  },
  { id: "c4", name: "Canto PVC Grafito 2mm", thickness: 2.0, color: "#37474f" },
];

const MOCK_MATERIALS: Material[] = [
  {
    id: "m1",
    name: "Nogal Americano 18mm",
    category: "Melamina",
    thickness: 18,
    color: "#5d4037",
    pricePerM2: 25,
    textureUrl: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=200",
    defaultCantoId: "c1",
    hasGrain: true,
  },
  {
    id: "m2",
    name: "Blanco Alto Brillo 18mm",
    category: "Melamina",
    thickness: 18,
    color: "#f5f5f5",
    pricePerM2: 18,
    textureUrl: "https://images.unsplash.com/photo-1517646331032-9e8563c523a1?auto=format&fit=crop&q=80&w=200",
    defaultCantoId: "c2",
    hasGrain: false,
  },
  {
    id: "m3",
    name: "Roble Kendal 18mm",
    category: "Melamina",
    thickness: 18,
    color: "#8d6e63",
    pricePerM2: 22,
    textureUrl: "https://images.unsplash.com/photo-1519757077978-5a4e3989c933?auto=format&fit=crop&q=80&w=200",
    defaultCantoId: "c3",
    hasGrain: true,
  },
  {
    id: "m4",
    name: "Gris Grafito 18mm",
    category: "MDF",
    thickness: 18,
    color: "#37474f",
    pricePerM2: 30,
    textureUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=200",
    defaultCantoId: "c4",
    hasGrain: false,
  },
];

// --- COMPONENTES UI ---

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) => {
  if (!isOpen) return null;
  const sizeClasses = size === "lg" ? "max-w-4xl" : "max-w-2xl";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses} max-h-[90vh] overflow-hidden flex flex-col transform transition-all`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CuttingV2Module() {
  // --- ESTADO ---
  const [pieces, setPieces] = useState<Piece[]>([]);

  // Estado para Edición
  const [editingPieceId, setEditingPieceId] = useState<string | null>(null);

  // Cabecera de Pedido
  const [orderId, setOrderId] = useState("PED-001");
  const [reference, setReference] = useState("Cocina Residencia Norte");

  // Estado del formulario actual
  const [currentMaterialId, setCurrentMaterialId] = useState<string>("m1");
  const [length, setLength] = useState<number>(2400);
  const [width, setWidth] = useState<number>(600);
  const [quantity, setQuantity] = useState<number>(1);
  const [grain, setGrain] = useState<"longitudinal" | "transversal" | "none">("longitudinal"); // Default

  // Estado de cantos (Edges)
  const [edges, setEdges] = useState<EdgeConfig>({
    l1: true,
    l2: true,
    a1: true,
    a2: true,
    cantoId: "c1",
  });

  // Modales
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);
  const [isCantoModalOpen, setCantoModalOpen] = useState(false);
  const [isOptimizationModalOpen, setOptimizationModalOpen] = useState(false);

  // --- LÓGICA COMPUTADA ---

  const currentMaterial = useMemo(() => MOCK_MATERIALS.find((m) => m.id === currentMaterialId) || MOCK_MATERIALS[0], [currentMaterialId]);
  const currentCanto = useMemo(() => MOCK_CANTOS.find((c) => c.id === edges.cantoId) || MOCK_CANTOS[0], [edges.cantoId]);

  const totalArea = useMemo(() => {
    return pieces.reduce((acc, p) => acc + (p.length * p.width * p.quantity) / 1000000, 0);
  }, [pieces]);

  const totalPieces = useMemo(() => {
    return pieces.reduce((acc, p) => acc + p.quantity, 0);
  }, [pieces]);

  const allEdgesActive = edges.l1 && edges.l2 && edges.a1 && edges.a2;
  const isEditing = editingPieceId !== null;

  // --- HANDLERS ---

  const handleToggleAllEdges = () => {
    const newState = !allEdgesActive;
    setEdges((prev) => ({
      ...prev,
      l1: newState,
      l2: newState,
      a1: newState,
      a2: newState,
    }));
  };

  const handleToggleGrain = () => {
    // Ciclo: Longitudinal -> Transversal -> None -> Longitudinal
    setGrain((prev) => {
      if (prev === "longitudinal") return "transversal";
      if (prev === "transversal") return "none";
      return "longitudinal";
    });
  };

  const handleSavePiece = () => {
    if (isEditing) {
      // ACTUALIZAR PIEZA EXISTENTE
      setPieces(
        pieces.map((p) =>
          p.id === editingPieceId
            ? {
                ...p,
                materialId: currentMaterialId,
                length,
                width,
                quantity,
                edges: { ...edges },
                grain,
              }
            : p
        )
      );
      setEditingPieceId(null);
      setQuantity(1);
    } else {
      // CREAR NUEVA PIEZA
      const newPiece: Piece = {
        id: crypto.randomUUID(),
        materialId: currentMaterialId,
        length,
        width,
        quantity,
        edges: { ...edges },
        grain,
      };
      setPieces([newPiece, ...pieces]);
      setQuantity(1);
    }
  };

  const handleEditPiece = (piece: Piece) => {
    setEditingPieceId(piece.id);
    setCurrentMaterialId(piece.materialId);
    setLength(piece.length);
    setWidth(piece.width);
    setQuantity(piece.quantity);
    setEdges({ ...piece.edges });
    setGrain(piece.grain);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingPieceId(null);
    setQuantity(1);
    // Resetear grain al default del material actual
    setGrain(currentMaterial.hasGrain ? "longitudinal" : "none");
  };

  const handleDeletePiece = (id: string) => {
    setPieces(pieces.filter((p) => p.id !== id));
    if (editingPieceId === id) {
      handleCancelEdit();
    }
  };

  const handleSelectMaterial = (mat: Material) => {
    setCurrentMaterialId(mat.id);
    setEdges((prev) => ({ ...prev, cantoId: mat.defaultCantoId }));
    // Si el material tiene veta, default a longitudinal. Si no, forzar none.
    setGrain(mat.hasGrain ? "longitudinal" : "none");
    setMaterialModalOpen(false);
  };

  const handleSelectCanto = (canto: Canto) => {
    setEdges((prev) => ({ ...prev, cantoId: canto.id }));
    setCantoModalOpen(false);
  };

  // --- RENDERIZADO DEL PREVIEW DE PIEZA ---
  const PiecePreview = () => {
    const aspectRatio = length / width;
    const isHorizontal = aspectRatio >= 1;

    // Rotación de textura para preview
    // Si es None, la mostramos standard (0) pero quizás con un overlay
    const textureRotation = grain === "transversal" ? "90deg" : "0deg";

    const containerStyle = {
      backgroundColor: currentMaterial.color,
    };

    const edgeColor = "#3b82f6"; // blue-500
    const edgeWidth = "6px";

    return (
      <div
        className={`w-full h-64 bg-slate-100 rounded-xl border-2 border-dashed flex items-center justify-center p-8 relative overflow-hidden group transition-colors ${
          isEditing ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
        }`}>
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(#64748b 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>

        {isEditing && (
          <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-amber-200 z-10">
            Editando
          </div>
        )}

        <div
          className="relative shadow-2xl transition-all duration-300 ease-out transform group-hover:scale-105 overflow-hidden"
          style={{
            ...containerStyle,
            width: isHorizontal ? "80%" : `${80 / aspectRatio}%`,
            height: isHorizontal ? `${80 / aspectRatio}%` : "80%",
            maxHeight: "100%",
            maxWidth: "100%",
            borderTop: edges.l1 ? `${edgeWidth} solid ${edgeColor}` : "1px solid rgba(0,0,0,0.1)",
            borderBottom: edges.l2 ? `${edgeWidth} solid ${edgeColor}` : "1px solid rgba(0,0,0,0.1)",
            borderLeft: edges.a1 ? `${edgeWidth} solid ${edgeColor}` : "1px solid rgba(0,0,0,0.1)",
            borderRight: edges.a2 ? `${edgeWidth} solid ${edgeColor}` : "1px solid rgba(0,0,0,0.1)",
          }}>
          {/* Capa de Textura Rotable */}
          {currentMaterial.textureUrl && (
            <div
              className="absolute inset-[-50%] w-[200%] h-[200%]"
              style={{
                backgroundImage: `url(${currentMaterial.textureUrl})`,
                backgroundSize: "200px",
                transform: `rotate(${textureRotation})`,
                opacity: 0.9,
                transition: "transform 0.3s ease",
              }}
            />
          )}

          {/* Flecha indicadora de Veta (Overlay) */}
          {grain !== "none" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              {grain === "longitudinal" ? (
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-12 h-12 text-white drop-shadow-md" />
                  <span className="text-[10px] text-white font-bold uppercase drop-shadow-md">Veta</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ArrowDown className="w-12 h-12 text-white drop-shadow-md" />
                  <span className="text-[10px] text-white font-bold uppercase drop-shadow-md">Veta</span>
                </div>
              )}
            </div>
          )}

          {grain === "none" && currentMaterial.hasGrain && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="flex flex-col items-center">
                <Ban className="w-12 h-12 text-white drop-shadow-md" />
                <span className="text-[10px] text-white font-bold uppercase drop-shadow-md">Sin Veta</span>
              </div>
            </div>
          )}

          {/* Etiquetas */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 font-bold bg-white/90 px-1.5 rounded border border-slate-200">
            {length}
          </div>
          <div className="absolute top-1/2 -left-8 -translate-y-1/2 -rotate-90 text-[10px] font-mono text-slate-500 font-bold bg-white/90 px-1.5 rounded border border-slate-200">
            {width}
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
              {currentMaterial.name}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24 md:pb-0">
      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col md:flex-row items-center justify-between gap-4 py-2 md:py-0">
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 leading-none">SmartCut</h1>
              <span className="text-xs text-indigo-400 font-medium tracking-wider">INDUSTRIAL v3.0</span>
            </div>
          </div>

          {/* Campos de Referencia en Header */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 w-full md:w-auto">
              <div className="px-3 text-slate-400">
                <Hash size={16} />
              </div>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 w-24"
                placeholder="ID Pedido"
              />
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 w-full md:w-64">
              <div className="px-3 text-slate-400">
                <FileText size={16} />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 w-full"
                placeholder="Referencia / Cliente"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: CONFIGURADOR + LISTA (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Panel de Configuración */}
            <div
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
                isEditing ? "border-amber-400 ring-4 ring-amber-50" : "border-slate-200"
              }`}>
              <div
                className={`p-4 border-b flex items-center justify-between ${isEditing ? "bg-amber-50 border-amber-100" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  {isEditing ? <Pencil className="text-amber-600 w-5 h-5" /> : <Scissors className="text-indigo-600 w-5 h-5" />}
                  <h2 className={`font-bold text-sm uppercase tracking-wide ${isEditing ? "text-amber-800" : "text-slate-700"}`}>
                    {isEditing ? "Editando Pieza Seleccionada" : "Nueva Pieza"}
                  </h2>
                </div>
                <div className="text-xs text-slate-400 font-mono">{isEditing ? "Modo: Edición" : "Modo: Inserción"}</div>
              </div>

              <div className="p-5 space-y-6">
                {/* 1. SELECCIÓN DE MATERIAL */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Material Base</label>
                    <button
                      onClick={() => setMaterialModalOpen(true)}
                      className="w-full group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 hover:border-indigo-400 hover:shadow-md transition-all text-left relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-slate-100 to-transparent -mr-4 -mt-4 rounded-bl-3xl opacity-50 group-hover:from-indigo-50"></div>
                      <div
                        className="w-12 h-12 rounded-lg shadow-sm border border-slate-200 flex-shrink-0"
                        style={{
                          backgroundImage: currentMaterial.textureUrl ? `url(${currentMaterial.textureUrl})` : "none",
                          backgroundColor: currentMaterial.color,
                          backgroundSize: "cover",
                        }}
                      />
                      <div className="flex-1 min-w-0 z-10">
                        <div className="font-bold text-slate-800 truncate text-sm">{currentMaterial.name}</div>
                        <div className="text-xs text-slate-500">
                          {currentMaterial.category} • {currentMaterial.thickness}mm
                        </div>
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 z-10" />
                    </button>
                  </div>

                  {/* Configuración de Canto Global */}
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Canto (Auto-asignado)</label>
                    <button
                      onClick={() => setCantoModalOpen(true)}
                      className="w-full group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 hover:bg-slate-50 transition-all text-left h-[70px]">
                      <div
                        className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: currentCanto.color }}>
                        <span className="text-[10px] font-bold text-slate-600 mix-blend-hard-light">{currentCanto.thickness}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-700 truncate">{currentCanto.name}</div>
                        <div className="text-[10px] text-indigo-500 font-medium">Clic para cambiar</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. SELECTOR DE CANTOS + DIMENSIONES + VETA */}
                <div className={`p-5 rounded-xl border transition-colors ${isEditing ? "bg-amber-50/50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Definición Geométrica</label>

                  <div className="flex flex-col gap-6">
                    {/* Fila de Dimensiones */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-1 font-bold">Largo (mm)</label>
                        <input
                          type="number"
                          value={length}
                          onChange={(e) => setLength(Number(e.target.value))}
                          className="w-full text-lg font-bold p-2.5 rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-1 font-bold">Ancho (mm)</label>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(Number(e.target.value))}
                          className="w-full text-lg font-bold p-2.5 rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-1 font-bold">Cant.</label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-full text-lg font-bold p-2.5 rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-center bg-white"
                        />
                      </div>
                    </div>

                    {/* Fila de Control de Veta y Cantos */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Control de Veta */}
                      <div className="sm:w-1/3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-500 font-bold">Dirección Veta</span>
                        </div>
                        <button
                          onClick={handleToggleGrain}
                          disabled={!currentMaterial.hasGrain}
                          className={`
                                        w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all border
                                        ${
                                          !currentMaterial.hasGrain
                                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                            : grain === "longitudinal"
                                            ? "bg-white border-slate-300 text-slate-600 hover:border-indigo-300"
                                            : grain === "transversal"
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                                            : "bg-red-50 border-red-200 text-red-500 shadow-sm"
                                        }
                                    `}
                          title={!currentMaterial.hasGrain ? "Material sin veta" : "Clic para cambiar dirección"}>
                          {grain === "longitudinal" && <Move className="w-4 h-4" />}
                          {grain === "transversal" && <Move className="w-4 h-4 rotate-90" />}
                          {grain === "none" && <Ban className="w-4 h-4" />}

                          <span>{grain === "longitudinal" ? "Longitudinal" : grain === "transversal" ? "Transversal" : "Sin Veta"}</span>
                        </button>
                        {!currentMaterial.hasGrain && <div className="text-[9px] text-slate-400 mt-1 text-center">No aplica para este material</div>}
                      </div>

                      {/* Control de Cantos */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-500 font-bold">Enchapado de Bordes</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleToggleAllEdges}
                            className={`
                                        h-10 w-12 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border
                                        ${
                                          allEdgesActive
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-slate-200 text-slate-400 hover:bg-slate-100"
                                        }
                                        `}>
                            {allEdgesActive ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <div className="h-10 w-px bg-slate-200 mx-1"></div>
                          {["l1", "l2", "a1", "a2"].map((side) => (
                            <button
                              key={side}
                              onClick={() => setEdges((prev) => ({ ...prev, [side]: !prev[side as keyof EdgeConfig] }))}
                              className={`
                                            flex-1 h-10 rounded-lg flex items-center justify-center border text-xs font-bold transition-all
                                            ${
                                              edges[side as keyof EdgeConfig]
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                                            }
                                        `}>
                              {side.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botonera de Acción */}
                <div className="flex gap-3">
                  {isEditing && (
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2">
                      <RotateCcw className="w-5 h-5" />
                      <span>Cancelar</span>
                    </button>
                  )}

                  <button
                    onClick={handleSavePiece}
                    className={`flex-[2] py-4 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold text-lg transition-all active:scale-[0.98] ${
                      isEditing ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-slate-900 hover:bg-black"
                    }`}>
                    {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    <span>{isEditing ? "Guardar Cambios" : "Añadir Pieza a Lista"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Piezas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <Layers size={16} className="text-slate-400" /> Desglose ({pieces.length})
                </h3>
                {pieces.length > 0 && (
                  <button
                    onClick={() => setPieces([])}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                    Limpiar Lista
                  </button>
                )}
              </div>

              {pieces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Box className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium text-slate-500">Sin piezas en el pedido</p>
                  <p className="text-xs">Usa el panel superior para agregar cortes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Material</th>
                        <th className="px-5 py-3 text-center">Cant.</th>
                        <th className="px-5 py-3">Medidas</th>
                        <th className="px-5 py-3">Veta</th>
                        <th className="px-5 py-3">Cantos</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pieces.map((p) => {
                        const mat = MOCK_MATERIALS.find((m) => m.id === p.materialId);
                        const isBeingEdited = editingPieceId === p.id;
                        return (
                          <tr key={p.id} className={`transition-colors group ${isBeingEdited ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-md shadow-sm border border-slate-200"
                                  style={{
                                    backgroundImage: mat?.textureUrl ? `url(${mat.textureUrl})` : "none",
                                    backgroundColor: mat?.color,
                                    backgroundSize: "cover",
                                  }}></div>
                                <div className="flex flex-col">
                                  <span className={`font-bold ${isBeingEdited ? "text-amber-800" : "text-slate-700"}`}>{mat?.name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {mat?.category} {mat?.thickness}mm
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className={`font-bold px-2 py-1 rounded-md ${isBeingEdited ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
                                {p.quantity}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-slate-600 font-medium">
                              {p.length} x {p.width}
                            </td>
                            <td className="px-5 py-3">
                              {p.grain === "none" ? (
                                <span className="text-slate-300 text-xs flex items-center gap-1">
                                  <Ban size={12} /> Sin Veta
                                </span>
                              ) : p.grain === "longitudinal" ? (
                                <span title="Longitudinal">
                                  <ArrowRight size={16} className="text-slate-400 rotate-0" />
                                </span>
                              ) : (
                                <span title="Transversal">
                                  <ArrowRight size={16} className="text-indigo-500 rotate-90" />
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-1">
                                {["L1", "L2", "A1", "A2"].map((l, i) => {
                                  const keys = ["l1", "l2", "a1", "a2"];
                                  const isActive = p.edges[keys[i] as keyof EdgeConfig];
                                  return (
                                    <span
                                      key={l}
                                      className={`text-[10px] w-5 h-5 flex items-center justify-center rounded ${
                                        isActive ? "bg-indigo-600 text-white font-bold" : "bg-slate-100 text-slate-300"
                                      }`}>
                                      {isActive ? l[0] : "-"}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-1 opacity-100">
                                <button
                                  onClick={() => handleEditPiece(p)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isBeingEdited ? "text-amber-600 bg-amber-100" : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-50"
                                  }`}
                                  title="Editar Pieza">
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePiece(p.id)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar Pieza">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN + PREVIEW (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Tarjeta Resumen Principal (Azul) */}
            <div className="bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h2 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Pedido</h2>
                  <div className="text-3xl font-bold tracking-tight">
                    {totalArea.toFixed(2)} <span className="text-lg text-indigo-300 font-normal">m²</span>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Piezas</h2>
                  <div className="text-3xl font-bold tracking-tight">{totalPieces}</div>
                </div>
              </div>

              <div className="mt-8 relative z-10">
                <button
                  onClick={() => setOptimizationModalOpen(true)}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Calcular Optimización
                </button>
              </div>
            </div>

            {/* 2. PREVIEW VISUAL (Movido aquí según instrucción) */}
            <div
              className={`bg-white rounded-2xl shadow-sm border p-4 transition-colors ${
                isEditing ? "border-amber-200 ring-2 ring-amber-50" : "border-slate-200"
              }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isEditing ? "text-amber-600" : "text-slate-500"}`}>Vista Previa (Pieza Actual)</h3>
                <Maximize2 size={14} className="text-slate-400" />
              </div>
              <PiecePreview />
              <div className="mt-3 text-center text-[10px] text-slate-400">
                {isEditing ? "Visualizando cambios pendientes..." : "Flecha blanca indica dirección de veta."}
              </div>
            </div>

            {/* 3. Acciones Secundarias */}
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                Borrador
              </button>
              <button className="py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                <ArrowRightLeft className="w-4 h-4" />
                Procesar
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL MATERIALES --- */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setMaterialModalOpen(false)} title="Catálogo de Materiales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {MOCK_MATERIALS.map((mat) => (
            <button
              key={mat.id}
              onClick={() => handleSelectMaterial(mat)}
              className={`
                flex items-center gap-4 p-4 rounded-xl border transition-all text-left group
                ${
                  currentMaterialId === mat.id
                    ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                    : "border-slate-100 hover:border-indigo-300 hover:bg-white hover:shadow-md"
                }
              `}>
              <div
                className="w-20 h-20 rounded-lg shadow-sm flex-shrink-0 bg-slate-200 border border-slate-100"
                style={{
                  backgroundImage: mat.textureUrl ? `url(${mat.textureUrl})` : "none",
                  backgroundColor: mat.color,
                  backgroundSize: "cover",
                }}
              />
              <div>
                <div className="font-bold text-slate-800 text-lg group-hover:text-indigo-700">{mat.name}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {mat.category} • {mat.thickness}mm
                </div>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">Stock Disponible</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* --- MODAL CANTOS --- */}
      <Modal isOpen={isCantoModalOpen} onClose={() => setCantoModalOpen(false)} title="Seleccionar Canto">
        <div className="p-4 space-y-3">
          {MOCK_CANTOS.map((canto) => (
            <button
              key={canto.id}
              onClick={() => handleSelectCanto(canto)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                ${
                  edges.cantoId === canto.id
                    ? "border-indigo-600 bg-indigo-50 shadow-sm"
                    : "border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-sm"
                }
              `}>
              <div className="w-12 h-12 rounded-full border-4 border-white shadow-md flex-shrink-0" style={{ backgroundColor: canto.color }}></div>
              <div className="flex-1">
                <div className="font-bold text-slate-800">{canto.name}</div>
                <div className="text-sm text-slate-500">Espesor: {canto.thickness}mm</div>
              </div>
              {edges.cantoId === canto.id && (
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                  <CheckSquare size={14} />
                </div>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* --- MODAL OPTIMIZACIÓN --- */}
      <Modal isOpen={isOptimizationModalOpen} onClose={() => setOptimizationModalOpen(false)} title="Resumen de Optimización" size="lg">
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
            <div className="text-yellow-600 mt-0.5">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h4 className="font-bold text-yellow-800">Simulación de Corte</h4>
              <p className="text-sm text-yellow-700 mt-1">
                A continuación se muestra el resumen agrupado por material. Estos datos serán enviados a Ardis para el cálculo de patrones de corte óptimos.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Agrupar piezas por material */}
            {MOCK_MATERIALS.filter((m) => pieces.some((p) => p.materialId === m.id)).map((mat) => {
              const materialPieces = pieces.filter((p) => p.materialId === mat.id);
              const matArea = materialPieces.reduce((acc, p) => acc + (p.length * p.width * p.quantity) / 1000000, 0);
              const matCount = materialPieces.reduce((acc, p) => acc + p.quantity, 0);

              return (
                <div key={mat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-slate-300" style={{ backgroundColor: mat.color }}></div>
                      <span className="font-bold text-slate-800">{mat.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">{matArea.toFixed(2)} m²</div>
                      <div className="text-xs text-slate-500">{matCount} piezas</div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-white text-slate-400 text-xs uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2 font-medium text-left">Dimensión</th>
                        <th className="px-4 py-2 font-medium text-center">Cant</th>
                        <th className="px-4 py-2 font-medium text-left">Veta</th>
                        <th className="px-4 py-2 font-medium text-left">Cantos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {materialPieces.map((p, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-2 font-mono text-slate-600">
                            {p.length} x {p.width}
                          </td>
                          <td className="px-4 py-2 text-center font-bold">{p.quantity}</td>
                          <td className="px-4 py-2 text-xs">
                            {p.grain === "longitudinal" && "Largo"}
                            {p.grain === "transversal" && "Ancho"}
                            {p.grain === "none" && <span className="text-slate-400 italic">Sin veta</span>}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-400">
                            {Object.entries(p.edges)
                              .filter(([k, v]) => v === true && k !== "cantoId")
                              .map(([k]) => k.toUpperCase())
                              .join(", ") || "Sin cantos"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {pieces.length === 0 && <div className="text-center py-10 text-slate-400">No hay datos para optimizar.</div>}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => setOptimizationModalOpen(false)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">
              Confirmar y Enviar a Ardis
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
