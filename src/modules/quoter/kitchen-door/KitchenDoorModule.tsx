import { useState, useEffect, useRef, useMemo } from "react";
import * as PIXI from "pixi.js";
import {
  Layers,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRightLeft,
  FileSpreadsheet,
  Wrench,
  X,
  ScanLine,
  Copy,
  Printer,
  MessageCircle,
  Mail,
  CheckSquare,
  ArrowLeft,
  FileSignature,
} from "lucide-react";

/* ===========================================================================
  CAPA DE DATOS & SERVICIOS MOCK
  ===========================================================================
*/

interface DoorModel {
  id: string;
  name: string;
  type: string;
  minW: number;
  minH: number;
  thickness: number;
  frameWidth?: number;
}

const CATALOG_MODELS: DoorModel[] = [
  { id: "MOD_LISO", name: "Serie Flat (Lisa)", type: "FLAT", minW: 100, minH: 100, thickness: 19 },
  { id: "MOD_J_PULL", name: "Serie Integra (Uñero J)", type: "J_PULL", minW: 150, minH: 100, thickness: 22 },
  { id: "MOD_SHAKER", name: "Serie Oxford (Enmarcada)", type: "SHAKER", minW: 250, minH: 250, frameWidth: 60, thickness: 22 },
];

interface Finish {
  id: string;
  name: string;
  group: string;
  color: number;
}

const FINISHES: Finish[] = [
  { id: "F01", name: "Blanco Mate", group: "G1", color: 0xf5f5f5 },
  { id: "F02", name: "Roble Nudos", group: "G2", color: 0xd2b48c },
  { id: "F03", name: "Gris Antracita", group: "G1", color: 0x374151 },
  { id: "F04", name: "Azul Noche (Laca)", group: "G3", color: 0x1e3a8a },
];

interface Edge {
  id: string;
  name: string;
  pricePerMeter: number;
  color: number | null;
}

const CATALOG_EDGES: Edge[] = [
  { id: "EDGE_AUTO", name: "Igual a Superficie (Estándar)", pricePerMeter: 1.5, color: null },
  { id: "EDGE_ALU", name: "PVC Efecto Aluminio", pricePerMeter: 2.8, color: 0xcccccc },
  { id: "EDGE_PLY", name: "PVC Efecto Contrachapado", pricePerMeter: 3.5, color: 0xeebb99 },
  { id: "EDGE_BLK", name: "PVC Negro Mate", pricePerMeter: 2.0, color: 0x222222 },
  { id: "EDGE_WHT", name: "PVC Blanco Brillo", pricePerMeter: 1.8, color: 0xffffff },
];

interface Extra {
  id: string;
  name: string;
  price: number;
  category: string;
}

const CATALOG_EXTRAS: Extra[] = [
  { id: "DRILL_STD", name: "Taladro Bisagra Std", price: 1.5, category: "Mecanizado" },
  { id: "HANDLE_GOLA", name: "Perfil Gola (Corte)", price: 4.0, category: "Mecanizado" },
  { id: "HANDLE_KNOB", name: "Tirador Pomo Negro", price: 3.2, category: "Herraje" },
  { id: "HINGE_SLOW", name: "Bisagra Cierre Suave", price: 5.5, category: "Herraje" },
  { id: "CUT_SPECIAL", name: "Corte en Inglete 45º", price: 8.0, category: "Mecanizado" },
];

const PRICING_MATRIX = { basePrice: 25 };

const PricingService = {
  calculatePrice: (w: number, h: number, finishGroup: string | undefined, edgeId: string, extrasIds: string[] = []): number => {
    if (!w || !h) return 0;
    const area = (w * h) / 1000000;
    let groupMultiplier = 1;
    if (finishGroup === "G2") groupMultiplier = 1.4;
    if (finishGroup === "G3") groupMultiplier = 2.2;
    const widthPremium = w > 600 ? 1.2 : 1;
    const heightPremium = h > 900 ? 1.1 : 1;

    let total = (PRICING_MATRIX.basePrice + area * 80) * groupMultiplier * widthPremium * heightPremium;

    const perimeterMeters = (w * 2 + h * 2) / 1000;
    const edgeObj = CATALOG_EDGES.find((e) => e.id === edgeId) || CATALOG_EDGES[0];
    total += perimeterMeters * edgeObj.pricePerMeter;

    extrasIds.forEach((id) => {
      const extra = CATALOG_EXTRAS.find((e) => e.id === id);
      if (extra) total += extra.price;
    });

    return Math.round(total * 100) / 100;
  },
};

/* ===========================================================================
  VISUALIZADOR 2D (PixiJS)
  ===========================================================================
*/
interface DoorPreviewProps {
  width: number;
  height: number;
  modelType: string;
  color: number;
  edgeColor: number | null;
  grainDirection: "vertical" | "horizontal";
  extras: string[];
  frameWidth?: number;
}

const DoorPreview: React.FC<DoorPreviewProps> = ({ width, height, modelType, color, edgeColor, grainDirection, extras = [], frameWidth = 60 }) => {
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
    containerRef.current.appendChild(app.view as unknown as Node);
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

    const strokeThickness = edgeColor !== null ? 4 * scale : 1;
    const strokeColor = edgeColor !== null ? edgeColor : 0x000000;
    const strokeAlpha = edgeColor !== null ? 1 : 0.2;

    const door = new PIXI.Graphics();
    door.lineStyle(strokeThickness, strokeColor, strokeAlpha);
    door.beginFill(color);
    door.drawRect(0, 0, drawW, drawH);
    door.endFill();

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

    if (extras.some((e) => e !== "DRILL_STD")) {
      const icon = new PIXI.Text("⚙️", { fontSize: 24 * scale });
      icon.x = drawW - 30 * scale;
      icon.y = drawH - 30 * scale;
      door.addChild(icon);
    }

    door.x = startX;
    door.y = startY;
    app.stage.addChild(door);
  }, [width, height, modelType, color, edgeColor, grainDirection, extras, frameWidth]);

  return <div ref={containerRef} className="w-full h-full" />;
};

/* ===========================================================================
  SUB-COMPONENTES: MODALES Y VISTAS
  ===========================================================================
*/

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExtras: string[];
  onToggleExtra: (extraId: string) => void;
}

const ExtrasModal: React.FC<ExtrasModalProps> = ({ isOpen, onClose, selectedExtras, onToggleExtra }) => {
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

// VISTA DE PRESUPUESTO (La "Hoja de Menta")
interface QuoteViewProps {
  rows: Row[];
  customerRef: string;
  onBack: () => void;
  onProceedToAccept: () => void;
}

const QuoteView: React.FC<QuoteViewProps> = ({ rows, customerRef, onBack, onProceedToAccept }) => {
  const subtotal = useMemo(
    () =>
      rows.reduce((acc, row) => {
        const finish = FINISHES.find((f) => f.id === row.finishId);
        const unitPrice = PricingService.calculatePrice(row.width, row.height, finish?.group, row.edgeId, row.extras);
        return acc + unitPrice * row.qty;
      }, 0),
    [rows]
  );

  const iva = subtotal * 0.21;
  const total = subtotal + iva;
  const today = new Date().toLocaleDateString("es-ES");

  const shareText = `Hola, envío presupuesto para ${customerRef || "Cocina"}. Total: ${total.toFixed(2)}€. Por favor, confirmar.`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const mailLink = `mailto:?subject=Presupuesto ${customerRef}&body=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full bg-white shadow-xl rounded-sm overflow-hidden flex flex-col min-h-[800px]">
        {/* Header Documento */}
        <div className="p-8 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">PRESUPUESTO</h1>
            <p className="text-sm text-gray-500">Ref: {customerRef || "SIN-REF"}</p>
            <p className="text-sm text-gray-500">Fecha: {today}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-indigo-700">FABRICA MUEBLES S.A.</div>
            <p className="text-xs text-gray-400">Polígono Industrial Sur, Nave 4</p>
            <p className="text-xs text-gray-400">Valencia, España</p>
          </div>
        </div>

        {/* Cuerpo Documento */}
        <div className="flex-1 p-8">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-gray-800 text-gray-600 uppercase text-xs">
              <tr>
                <th className="py-2">Descripción</th>
                <th className="py-2 text-center">Medidas</th>
                <th className="py-2 text-center">Cant.</th>
                <th className="py-2 text-right">Precio Ud.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => {
                const model = CATALOG_MODELS.find((m) => m.id === row.modelId) || CATALOG_MODELS[0];
                const finish = FINISHES.find((f) => f.id === row.finishId) || FINISHES[0];
                const unitPrice = PricingService.calculatePrice(row.width, row.height, finish?.group, row.edgeId, row.extras);

                return (
                  <tr key={idx} className="group hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-gray-800">
                        {row.type === "DOOR" ? "Puerta" : row.type === "DRAWER" ? "Frente" : "Regleta"} {model.name}
                      </div>
                      <div className="text-xs text-gray-500">{finish.name}</div>
                      {row.extras.length > 0 && (
                        <div className="text-xs text-indigo-600 mt-1 flex flex-wrap gap-1">
                          {row.extras.map((e) => CATALOG_EXTRAS.find((ex) => ex.id === e)?.name).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono text-gray-600">
                      {row.width} x {row.height}
                    </td>
                    <td className="py-3 text-center font-bold text-gray-800">{row.qty}</td>
                    <td className="py-3 text-right text-gray-600">{unitPrice.toFixed(2)}€</td>
                    <td className="py-3 text-right font-bold text-gray-800">{(unitPrice * row.qty).toFixed(2)}€</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Económico */}
        <div className="bg-gray-50 p-8 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (21%)</span>
                <span>{iva.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-300">
                <span>TOTAL</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-400 text-center">
            <p>Validez de la oferta: 15 días. Las medidas son responsabilidad del cliente. El material se fabrica bajo pedido.</p>
          </div>
        </div>
      </div>

      {/* Barra de Acciones Flotante */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 border border-gray-200 z-50">
        <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors" title="Volver a Editar">
          <ArrowLeft size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
          title="Compartir WhatsApp">
          <MessageCircle size={20} />
        </a>
        <a href={mailLink} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Enviar Email">
          <Mail size={20} />
        </a>
        <button onClick={() => window.print()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Imprimir / PDF">
          <Printer size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button
          onClick={onProceedToAccept}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-colors shadow-md">
          <CheckCircle2 size={18} /> Aceptar Presupuesto
        </button>
      </div>
    </div>
  );
};

// MODAL DE ACEPTACIÓN
interface AcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { comments: string; signature: string }) => void;
}

const AcceptanceModal: React.FC<AcceptanceModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [comments, setComments] = useState("");
  const [signature, setSignature] = useState("");

  if (!isOpen) return null;

  const canConfirm = acceptedTerms && signature.length > 3;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-[500px] max-w-full overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSignature /> Confirmar Pedido
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Este paso inicia la fabricación. No hay vuelta atrás.</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones Finales</label>
            <textarea
              className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
              placeholder="Ej: Entregar por las mañanas. Llamar antes..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Firma (Nombre Completo)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-serif italic text-lg"
              placeholder="Escribe tu nombre para firmar"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="text-xs text-gray-700 leading-tight">
                Certifico que he revisado las medidas, acabados y cantos. Entiendo que al ser un producto a medida no se admiten devoluciones salvo defecto de
                fabricación. Acepto los términos y condiciones.
              </span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({ comments, signature })}
            disabled={!canConfirm}
            className={`px-6 py-2 rounded text-sm font-bold text-white transition-all ${
              canConfirm ? "bg-green-600 hover:bg-green-700 shadow-lg" : "bg-gray-300 cursor-not-allowed"
            }`}>
            CONFIRMAR Y FABRICAR
          </button>
        </div>
      </div>
    </div>
  );
};

// PANTALLA DE ÉXITO
interface SuccessViewProps {
  onReset: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ onReset }) => (
  <div className="flex flex-col items-center justify-center h-full bg-white text-center p-8">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
      <CheckCircle2 size={48} className="text-green-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
    <p className="text-gray-500 max-w-md mb-8">
      La orden ha sido enviada a fábrica (Sistema MES). Recibirás un correo con el seguimiento de producción en breve.
    </p>
    <button onClick={onReset} className="text-indigo-600 font-medium hover:underline">
      Volver al inicio
    </button>
  </div>
);

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

interface DefaultConfig {
  modelId: string;
  finishId: string;
  edgeId: string;
  grainDirection: "vertical" | "horizontal";
  customerRef: string;
}

export default function KitchenDoorModule() {
  const [viewMode, setViewMode] = useState<"EDIT" | "QUOTE" | "SUCCESS">("EDIT"); // 'EDIT', 'QUOTE', 'SUCCESS'
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const [defaultConfig, setDefaultConfig] = useState<DefaultConfig>({
    modelId: "MOD_LISO",
    finishId: "F01",
    edgeId: "EDGE_AUTO",
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
      edgeId: "EDGE_ALU",
      width: 600,
      height: 180,
      qty: 1,
      extras: ["HANDLE_KNOB"],
      notes: "Cubertero Diseño",
    },
  ]);

  const [selectedRowId, setSelectedRowId] = useState<number>(1);
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
  const handleRowChange = <K extends keyof Row>(id: number, field: K, value: Row[K]) => {
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

  const duplicateRow = (id: number) => {
    const rowToClone = rows.find((r) => r.id === id);
    if (rowToClone) {
      const newId = Math.max(...rows.map((r) => r.id), 0) + 1;
      setRows([...rows, { ...rowToClone, id: newId, extras: [...rowToClone.extras] }]);
      setSelectedRowId(newId);
    }
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

  // --- Render Conditional ---
  if (viewMode === "SUCCESS") {
    return <SuccessView onReset={() => setViewMode("EDIT")} />;
  }

  if (viewMode === "QUOTE") {
    return (
      <>
        <QuoteView rows={rows} customerRef={defaultConfig.customerRef} onBack={() => setViewMode("EDIT")} onProceedToAccept={() => setShowAcceptModal(true)} />
        <AcceptanceModal
          isOpen={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          onConfirm={(data) => {
            console.log("Pedido confirmado:", data);
            setShowAcceptModal(false);
            setViewMode("SUCCESS");
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Módulo de Puertas (Edición)</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Suite de Fabricación v2.4</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("QUOTE")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm">
              <CheckSquare size={18} />
              <span>Ver Presupuesto</span>
            </button>
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

      {/* GRID & INSPECTOR */}
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
                  <th className="py-2 px-2 text-xs font-semibold text-gray-500 border-b w-14"></th>
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
                      className={`group border-b border-gray-100 text-sm transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-50 ring-1 ring-inset ring-indigo-300" : "hover:bg-gray-50"
                      } ${!isValid && row.width > 0 ? "bg-red-50" : ""}`}>
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
                          className={`px-2 py-1 rounded text-xs border flex items-center justify-center gap-1 w-full transition-all ${
                            row.extras.length > 0
                              ? "bg-indigo-100 border-indigo-200 text-indigo-700"
                              : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                          }`}>
                          {row.extras.length > 0 ? <Wrench size={10} /> : <Plus size={10} />}
                        </button>
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-gray-700 text-xs">{unitPrice.toFixed(2)}€</td>
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateRow(row.id);
                            }}
                            className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Duplicar">
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRow(row.id);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
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

        {/* RIGHT: INSPECTOR */}
        <div className="w-80 bg-slate-100 border-l border-gray-200 flex flex-col shadow-inner">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Inspector Técnico</h3>
            <div className="text-sm font-bold text-gray-800">{activeRowModel.name}</div>
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
                  edgeColor={activeRowEdge.color}
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
