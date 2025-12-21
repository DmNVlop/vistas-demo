import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, ShoppingCart, Settings, Layers, Maximize, Package, Check, X, Search } from "lucide-react";
import { COMPLEMENTS_CATALOG, FINISHES, MATERIALS } from "./data.mock";

// --- Tipos para TypeScript ---
interface DoorLine {
  id: string;
  height: number;
  width: number;
  qty: number;
  edges: {
    l1: boolean; // Arriba
    l2: boolean; // Abajo
    a1: boolean; // Izq
    a2: boolean; // Der
  };
  complements: SelectedComplement[];
}

interface DoorGroup {
  id: string;
  config: {
    material: string;
    finish: string;
    edgeType: "4-cantos" | "sin-cantos";
    pricePerM2: number;
  };
  lines: DoorLine[];
}

// Estructura de un complemento guardado dentro de una línea
interface SelectedComplement {
  catalogId: string;
  needsMachining: boolean;
}

// --- Estilos Comunes ---
// 94vw de ancho, tope en 1900px, mínimo 360px, centrado horizontalmente
const layoutContainer = "w-[94vw] max-w-[1900px] min-w-[360px] mx-auto";

const KitchenDoorV2Module = () => {
  // --- Estados ---
  // --- Estados Actualizados ---
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // --- Estado de Información del Proyecto ---
  const [projectInfo, setProjectInfo] = useState({
    reference: "",
    client: "",
  });

  // Estado del Modal
  // Guardamos el ID del grupo y de la línea que se está editando
  const [activeModal, setActiveModal] = useState<{ groupId: string; lineId: string } | null>(null);

  // Estado temporal para la configuración que estamos creando ahora mismo
  const [currentConfig, setCurrentConfig] = useState({
    material: MATERIALS[0].name,
    finish: FINISHES[0].name,
    edgeType: "4-cantos" as const,
    pricePerM2: 55,
  });

  // Estado principal: Array de Grupos (cada uno con sus líneas)
  const [groups, setGroups] = useState<DoorGroup[]>([]);

  // --- Estado para Auto-Focus ---
  // Guarda el ID de la línea recién creada para ponerle el foco
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  // Estado para el filtro de acabados
  const [finishSearch, setFinishSearch] = useState("");

  // --- Lógica de Negocio ---

  // Calcular precio de la configuración actual (Step 1)
  useEffect(() => {
    const matPrice = MATERIALS.find((m) => m.name === currentConfig.material)?.basePrice || 0;
    const finPrice = FINISHES.find((f) => f.name === currentConfig.finish)?.surcharge || 0;
    setCurrentConfig((prev) => ({ ...prev, pricePerM2: matPrice + finPrice }));
  }, [currentConfig.material, currentConfig.finish]);

  // Efecto: Cuando cambia autoFocusId, buscamos el input y le damos foco
  useEffect(() => {
    if (autoFocusId) {
      // Buscamos el input por su ID HTML (ej: "qty-1234")
      // NOTA: Si prefieres que el foco vaya al ALTO, cambia 'qty-' por 'height-' aquí
      const element = document.getElementById(`qty-${autoFocusId}`);
      if (element) {
        element.focus();
        (element as HTMLInputElement).select(); // Selecciona el texto (el "1")
      }
      setAutoFocusId(null); // Reseteamos para que no interfiera después
    }
  }, [autoFocusId, groups]); // Se ejecuta cuando groups se actualiza en el DOM

  // Seleccionar todo el texto al hacer click/focus en un input
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Finalizar Step 1 y crear el grupo
  // Finalizar Step 1 y crear o actualizar grupo
  const handleCreateGroup = () => {
    // 1. Buscamos si ya existe un grupo con EXACTAMENTE la misma configuración
    const existingGroupIndex = groups.findIndex((g) => g.config.material === currentConfig.material && g.config.finish === currentConfig.finish);

    // Definimos la nueva línea estándar (para usarla en ambos casos)
    const newLineTemplate: DoorLine = {
      id: crypto.randomUUID(),
      height: 700,
      width: 400,
      qty: 1,
      edges: { l1: true, l2: true, a1: true, a2: true },
      complements: [],
    };

    if (existingGroupIndex !== -1) {
      // CASO A: EL GRUPO YA EXISTE -> Añadimos una línea nueva a ese grupo
      const updatedGroups = [...groups];
      const existingGroup = updatedGroups[existingGroupIndex];

      // (Opcional) Si quieres copiar las medidas de la última línea de ese grupo en vez de usar template:
      //   const lastLine = existingGroup.lines[existingGroup.lines.length - 1];
      //   const lineToAdd = lastLine
      //     ? {
      //         ...newLineTemplate,
      //         height: lastLine.height,
      //         width: lastLine.width,
      //         edges: { ...lastLine.edges },
      //       }
      //     : newLineTemplate;

      // TRIGGER FOCUS
      // setAutoFocusId(lineToAdd.id);

      updatedGroups[existingGroupIndex] = {
        ...existingGroup,
        lines: [...existingGroup.lines],
        // lines: [...existingGroup.lines, lineToAdd],
      };

      setGroups(updatedGroups);

      // Feedback visual: Podríamos hacer scroll aquí, pero por ahora cambiamos de paso
    } else {
      // CASO B: EL GRUPO NO EXISTE -> Creamos uno nuevo
      const newGroup: DoorGroup = {
        id: crypto.randomUUID(),
        config: { ...currentConfig },
        lines: [newLineTemplate],
      };

      // TRIGGER FOCUS
      setAutoFocusId(newGroup.lines[0].id);

      setGroups([...groups, newGroup]);
    }

    setStep(2); // Volvemos a la lista
  };

  // Añadir línea a un grupo específico
  const addLineToGroup = (groupId: string) => {
    // Generamos el ID aquí para poder usarlo
    const newLineId = crypto.randomUUID();

    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const lastLine = g.lines[g.lines.length - 1];
        const newLine = {
          id: newLineId,
          height: lastLine ? lastLine.height : 700,
          width: lastLine ? lastLine.width : 400,
          qty: 1,
          edges: lastLine ? { ...lastLine.edges } : { l1: true, l2: true, a1: true, a2: true },
          complements: [],
        };
        return { ...g, lines: [...g.lines, newLine] };
      })
    );

    // TRIGGER FOCUS
    setAutoFocusId(newLineId);
  };

  const updateLine = (groupId: string, lineId: string, field: keyof DoorLine, value: number) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          lines: g.lines.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)),
        };
      })
    );
  };

  // Duplicar una línea específica dentro de su grupo
  const duplicateLine = (groupId: string, lineToCopy: DoorLine) => {
    const newLineId = crypto.randomUUID(); // Generamos ID

    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;

        // Creamos la copia con un ID nuevo
        const newLine = {
          ...lineToCopy,
          id: newLineId,
        };

        // Opción A: Añadirla al final de la lista del grupo
        // return { ...g, lines: [...g.lines, newLine] };

        // Opción B (Más pro): Insertarla justo debajo de la línea original
        const index = g.lines.findIndex((l) => l.id === lineToCopy.id);
        const newLines = [...g.lines];
        newLines.splice(index + 1, 0, newLine);
        return { ...g, lines: newLines };
      })
    );

    // TRIGGER FOCUS
    setAutoFocusId(newLineId);
  };

  const removeLine = (groupId: string, lineId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        // Si es la última línea, borramos el grupo entero? Por ahora dejamos 1 línea mínima o array vacío
        if (g.lines.length <= 1) return g;
        return { ...g, lines: g.lines.filter((l) => l.id !== lineId) };
      })
    );
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
    if (groups.length === 1) setStep(1); // Si borramos todo, volver al inicio
  };

  // Toggle de un canto individual
  const toggleEdge = (groupId: string, lineId: string, edge: keyof DoorLine["edges"]) => {
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          lines: g.lines.map((l) => {
            if (l.id !== lineId) return l;
            return { ...l, edges: { ...l.edges, [edge]: !l.edges[edge] } };
          }),
        };
      })
    );
  };

  // Checkbox Maestro: Activa o desactiva todos
  const toggleAllEdges = (groupId: string, lineId: string, currentStatus: boolean) => {
    const newState = !currentStatus; // Si estaba todo activo, apaga. Si no, enciende.
    setGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          lines: g.lines.map((l) => {
            if (l.id !== lineId) return l;
            return { ...l, edges: { l1: newState, l2: newState, a1: newState, a2: newState } };
          }),
        };
      })
    );
  };

  // --- Lógica de Complementos ---

  // Añadir o quitar un complemento a la línea activa
  const toggleComplement = (catalogId: string) => {
    if (!activeModal) return;

    setGroups(
      groups.map((g) => {
        if (g.id !== activeModal.groupId) return g;
        return {
          ...g,
          lines: g.lines.map((l) => {
            if (l.id !== activeModal.lineId) return l;

            const exists = l.complements.find((c) => c.catalogId === catalogId);
            let newComplements;

            if (exists) {
              // Si existe, lo quitamos
              newComplements = l.complements.filter((c) => c.catalogId !== catalogId);
            } else {
              // Si no existe, lo añadimos (sin mecanizado por defecto)
              newComplements = [...l.complements, { catalogId, needsMachining: false }];
            }
            return { ...l, complements: newComplements };
          }),
        };
      })
    );
  };

  // Checkbox de Mecanizado dentro del complemento
  const toggleMachining = (catalogId: string) => {
    if (!activeModal) return;

    setGroups(
      groups.map((g) => {
        if (g.id !== activeModal.groupId) return g;
        return {
          ...g,
          lines: g.lines.map((l) => {
            if (l.id !== activeModal.lineId) return l;
            return {
              ...l,
              complements: l.complements.map((c) => (c.catalogId === catalogId ? { ...c, needsMachining: !c.needsMachining } : c)),
            };
          }),
        };
      })
    );
  };

  // Cálculo TOTAL incluyendo complementos
  const grandTotal = groups.reduce((acc, group) => {
    const groupTotal = group.lines.reduce((lineAcc, l) => {
      // Precio base madera
      const woodPrice = ((l.height * l.width) / 1000000) * group.config.pricePerM2;

      // Precio complementos
      const complementsPrice = l.complements.reduce((compAcc, sel) => {
        const item = COMPLEMENTS_CATALOG.find((c) => c.id === sel.catalogId);
        if (!item) return compAcc;
        return compAcc + item.price + (sel.needsMachining ? item.machiningPrice : 0);
      }, 0);

      return lineAcc + (woodPrice + complementsPrice) * l.qty;
    }, 0);
    return acc + groupTotal;
  }, 0);

  const totalArea = groups.reduce((acc, group) => {
    return acc + group.lines.reduce((a, l) => a + (l.height * l.width * l.qty) / 1000000, 0);
  }, 0);

  // --- Validación del Formulario ---
  const isFormValid = groups.length > 0 && projectInfo.reference.trim() !== "" && projectInfo.client.trim() !== "";

  // STEP 3
  // Helper para mostrar cantos en texto
  const getEdgeSummary = (edges: DoorLine["edges"]) => {
    const all = edges.l1 && edges.l2 && edges.a1 && edges.a2;
    if (all) return "4 Cantos";
    if (!edges.l1 && !edges.l2 && !edges.a1 && !edges.a2) return "Sin Cantos";

    // Si es mixto, decimos cuáles
    let active = [];
    if (edges.l1) active.push("L1");
    if (edges.l2) active.push("L2");
    if (edges.a1) active.push("A1");
    if (edges.a2) active.push("A2");
    return active.join(" + ");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20">
      {/* HEADER: Contexto visual */}
      {/* HEADER: Contexto y Datos del Proyecto */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200 transition-all">
        <div className={`${layoutContainer} py-3 flex flex-col sm:flex-row items-center gap-4 sm:gap-0`}>
          {/* IZQUIERDA: Título y Resumen */}
          <div className="w-full sm:w-auto flex justify-between sm:block items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Cotizador Puertas de Cocina</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                {step === 1 ? "Configuración" : `${groups.length} Grupos • ${grandTotal.toFixed(0)}€`}
              </p>
            </div>
            {/* El botón de configuración se mueve aquí SOLO en móvil para ahorrar espacio vertical */}
            <div className="sm:hidden">
              <button onClick={() => setStep(step === 1 ? 2 : 1)} className="p-2 bg-slate-100 rounded-full text-slate-700">
                {step === 1 ? <ShoppingCart size={20} /> : <Settings size={20} />}
              </button>
            </div>
          </div>

          {/* CENTRO: Inputs de Referencia y Cliente */}
          <div className="flex-1 w-full sm:w-auto flex justify-center items-center px-0 sm:px-8">
            <div className="flex gap-2 w-full max-w-lg">
              <div className="relative w-1/3">
                <input
                  type="text"
                  placeholder="Ref."
                  value={projectInfo.reference}
                  onChange={(e) => setProjectInfo({ ...projectInfo, reference: e.target.value })}
                  onFocus={handleFocus}
                  className="w-full h-10 px-3 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg text-sm font-semibold outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="relative w-2/3">
                <input
                  type="text"
                  placeholder="Cliente / Comentario"
                  value={projectInfo.client}
                  onChange={(e) => setProjectInfo({ ...projectInfo, client: e.target.value })}
                  onFocus={handleFocus}
                  className="w-full h-10 px-3 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg text-sm font-semibold outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* DERECHA: Botón de Acción Principal (Oculto en móvil porque ya lo pusimos arriba a la izq) */}
          <div className="hidden sm:block w-auto">
            <button
              onClick={() => setStep(step === 1 ? 2 : 1)}
              className="p-2.5 bg-slate-50 border border-gray-200 rounded-full hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
              title={step === 1 ? "Ver Presupuesto" : "Configurar Precios"}>
              {step === 1 ? <ShoppingCart size={20} /> : <Settings size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className={`${layoutContainer} p-4`}>
        {/* STEP 1: CONFIGURACIÓN GLOBAL (Evita repetición) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* SELECCIÓN DE MATERIAL BASE (3 Columnas con Descripción) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="text-blue-600" size={20} /> Material Base
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MATERIALS.map((m) => {
                  const isSelected = currentConfig.material === m.name;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setCurrentConfig({ ...currentConfig, material: m.name })}
                      className={`
                        relative p-5 rounded-xl border-2 text-left transition-all duration-200 flex flex-col justify-between h-full group
                        ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500 ring-offset-2"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }
                      `}>
                      {/* Check Icon (Solo visible si seleccionado) */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-blue-600">
                          <div className="bg-blue-100 rounded-full p-1">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>
                      )}

                      <div>
                        <div className={`font-bold text-lg mb-2 ${isSelected ? "text-blue-900" : "text-slate-800"}`}>{m.name}</div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.description}</p>
                      </div>

                      <div
                        className={`text-sm font-semibold py-2 px-3 rounded-lg self-start ${
                          isSelected ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-slate-600 group-hover:bg-white"
                        }`}>
                        Base: {m.basePrice}€/m²
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELECCIÓN DE ACABADO (Flex Wrap Centrado) */}
            {/* SELECCIÓN DE ACABADO (Con Buscador Autocomplete) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              {/* CABECERA: Título + Buscador (Space-Between) */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Maximize className="text-indigo-600" size={20} /> Acabado Visual
                </h2>

                {/* Input de Búsqueda */}
                <div className="relative w-full sm:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={finishSearch}
                    onChange={(e) => setFinishSearch(e.target.value)}
                    placeholder="Buscar acabado..."
                    className="block w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-slate-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  />
                  {/* Botón borrar búsqueda */}
                  {finishSearch && (
                    <button
                      onClick={() => setFinishSearch("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Contenedor Flex Wrap Centrado (Con Filtrado) */}
              <div className="flex flex-wrap justify-center gap-4 min-h-[100px]">
                {FINISHES.filter((f) => f.name.toLowerCase().includes(finishSearch.toLowerCase())) // <--- FILTRO LÓGICO
                  .map((f) => {
                    const isSelected = currentConfig.finish === f.name;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setCurrentConfig({ ...currentConfig, finish: f.name })}
                        className={`
                        relative group overflow-hidden rounded-xl transition-all duration-300 text-left flex-shrink-0
                        w-full min-w-[200px] max-w-[250px] animate-in fade-in zoom-in-95 duration-300
                        ${isSelected ? "ring-4 ring-indigo-500 ring-offset-2 scale-[1.02] shadow-lg" : "hover:shadow-md hover:scale-[1.01]"}
                      `}>
                        {/* Imagen (Aspecto cuadrado) */}
                        <div className="aspect-square relative w-full overflow-hidden">
                          <img src={f.image} alt={f.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div
                            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity ${
                              isSelected ? "opacity-80" : "opacity-60 group-hover:opacity-50"
                            }`}
                          />

                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1 shadow-sm animate-in zoom-in duration-300 z-10">
                              <Check size={16} strokeWidth={3} />
                            </div>
                          )}

                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[14px] font-bold text-slate-800 shadow-sm z-10">
                            +{f.surcharge}€/m²
                          </div>

                          <div className="absolute bottom-0 left-0 w-full p-4 text-white z-20">
                            <div className="font-bold text-lg leading-tight shadow-black drop-shadow-md">
                              {/* Resaltar coincidencia (Opcional, simple por ahora) */}
                              {f.name}
                            </div>
                            {isSelected && <div className="text-xs text-indigo-300 mt-1 font-medium">Seleccionado</div>}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {/* Mensaje de "No hay resultados" */}
                {FINISHES.filter((f) => f.name.toLowerCase().includes(finishSearch.toLowerCase())).length === 0 && (
                  <div className="w-full flex flex-col items-center justify-center py-8 text-gray-400">
                    <Search size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No encontramos acabados con "{finishSearch}"</p>
                    <button onClick={() => setFinishSearch("")} className="text-indigo-600 text-sm font-bold mt-2 hover:underline">
                      Ver todos
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setStep(2);
                handleCreateGroup();
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform mb-8">
              Agregar Medidas
            </button>
          </div>
        )}

        {/* STEP 2: VISTA DE GRUPOS Y LÍNEAS */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Iteramos por cada Grupo/Material */}
            {groups.map((group, gIndex) => (
              <div key={group.id} className="relative">
                {/* Cabecera del Grupo */}
                <div className="flex justify-between items-end mb-2 px-2 border-b border-gray-200 pb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grupo {gIndex + 1}</span>
                    <h3 className="text-lg font-bold text-slate-800">{group.config.material}</h3>
                    <div className="text-sm text-blue-600 font-medium">
                      {group.config.finish} • {group.config.pricePerM2}€/m²
                    </div>
                  </div>
                  <button onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-600 text-xs font-semibold p-2">
                    ELIMINAR GRUPO
                  </button>
                </div>

                {/* Cabecera de columnas (Solo visible en desktop) */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 px-2 mb-2">
                  <div className="col-span-1">VISUAL</div>
                  <div className="col-span-1">CANT.</div>
                  <div className="col-span-2">ALTO (mm)</div>
                  <div className="col-span-2">ANCHO (mm)</div>
                  <div className="col-span-3 text-center">CANTOS (L1/L2 - A1/A2)</div>
                  <div className="col-span-1 text-center">EXTRAS</div>
                  <div className="col-span-2 text-right">ACCIONES</div>
                </div>

                <div className="space-y-3"></div>
                {group.lines.map((line) => (
                  <div
                    key={line.id}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:grid sm:grid-cols-12 gap-3 items-center relative group">
                    {/* Visual Preview (Proporción real) */}
                    <div className="col-span-1 hidden sm:flex justify-center items-center h-full relative">
                      <div
                        className={`border relative rounded-sm transition-all duration-300 ${
                          group.config.finish.includes("Blanco") ? "bg-gray-100 border-gray-300" : "bg-orange-100 border-orange-300"
                        }`}
                        style={{
                          height: "40px",
                          width: `${(line.width / line.height) * 40}px`,
                          maxWidth: "100%",
                        }}>
                        {/* Visualización sutil de cantos en el preview (opcional, puntos de color) */}
                        {line.edges.l1 && <div className="absolute top-[-1px] left-0 w-full h-[1px] bg-blue-500"></div>}
                        {line.edges.l2 && <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-blue-500"></div>}
                        {line.edges.a1 && <div className="absolute top-0 left-[-1px] h-full w-[1px] bg-blue-500"></div>}
                        {line.edges.a2 && <div className="absolute top-0 right-[-1px] h-full w-[1px] bg-blue-500"></div>}
                      </div>
                    </div>

                    {/* Cantidad (Reducido a col-span-1) */}
                    <div className="w-full sm:col-span-1">
                      <label className="text-xs text-gray-400 sm:hidden block mb-1">Cant.</label>
                      <input
                        id={`qty-${line.id}`}
                        type="number"
                        inputMode="numeric"
                        value={line.qty}
                        onChange={(e) => updateLine(group.id, line.id, "qty", Number(e.target.value))}
                        onFocus={handleFocus}
                        className="w-full h-10 bg-blue-50/50 border border-blue-100 text-blue-900 rounded-lg text-center font-bold outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Inputs: Touch Friendly (44px height min) */}
                    <div className="w-full sm:col-span-2">
                      <label className="text-xs text-gray-400 sm:hidden">Alto (mm)</label>
                      <input
                        id={`height-${line.id}`}
                        type="number"
                        inputMode="numeric"
                        value={line.height}
                        onChange={(e) => updateLine(group.id, line.id, "height", Number(e.target.value))}
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        onFocus={handleFocus}
                        placeholder="Alto"
                      />
                    </div>

                    <div className="w-full sm:col-span-2">
                      <label className="text-xs text-gray-400 sm:hidden">Ancho (mm)</label>
                      <input
                        id={`width-${line.id}`}
                        type="number"
                        inputMode="numeric"
                        value={line.width}
                        onChange={(e) => updateLine(group.id, line.id, "width", Number(e.target.value))}
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        onFocus={handleFocus}
                        placeholder="Ancho"
                      />
                    </div>

                    {/* --- SECCIÓN CANTOS (NUEVA) --- */}
                    <div className="w-full sm:col-span-3 flex flex-col sm:flex-row items-center justify-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                      {/* Checkbox Maestro */}
                      <label className="flex items-center gap-2 cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={line.edges.l1 && line.edges.l2 && line.edges.a1 && line.edges.a2}
                          onChange={() => toggleAllEdges(group.id, line.id, line.edges.l1 && line.edges.l2 && line.edges.a1 && line.edges.a2)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                          onFocus={handleFocus}
                        />
                        <span className="text-xs font-bold text-gray-400 sm:hidden">Todos</span>
                      </label>

                      {/* Grupo de Botones */}
                      <div className="flex gap-1 w-full sm:w-auto">
                        {[
                          { key: "l1", label: "L1", title: "Arriba" },
                          { key: "l2", label: "L2", title: "Abajo" },
                          { key: "a1", label: "A1", title: "Izquierda" },
                          { key: "a2", label: "A2", title: "Derecha" },
                        ].map((edge) => (
                          <button
                            key={edge.key}
                            onClick={() => toggleEdge(group.id, line.id, edge.key as any)}
                            title={edge.title}
                            className={`flex-1 sm:flex-none h-9 w-9 sm:w-10 rounded-md text-xs font-bold transition-all border ${
                              line.edges[edge.key as keyof typeof line.edges]
                                ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105"
                                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                            }`}>
                            {edge.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* --- BOTÓN COMPLEMENTOS --- */}
                    <div className="w-full sm:col-span-1 flex justify-center">
                      <button
                        onClick={() => setActiveModal({ groupId: group.id, lineId: line.id })}
                        className={`relative p-2 rounded-xl border-2 transition-all ${
                          line.complements.length > 0
                            ? "bg-indigo-100 border-indigo-400 text-indigo-700"
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
                        }`}
                        title="Añadir Complementos">
                        <Package size={20} />
                        {line.complements.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                            {line.complements.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="w-full sm:col-span-2 flex justify-end gap-2 mt-2 sm:mt-0">
                      {/* Botón DUPLICAR (Restaurado) */}
                      <button
                        onClick={() => duplicateLine(group.id, line)}
                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
                        title="Duplicar medida">
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => removeLine(group.id, line.id)}
                        className="flex-1 sm:flex-none p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 active:bg-red-200 disabled:opacity-50"
                        disabled={group?.lines?.length === 1}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Botón flotante para añadir (o al final de la lista) */}
                <button
                  onClick={() => addLineToGroup(group.id)}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold flex justify-center items-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95">
                  <Plus size={20} /> + Añadir medida a {group.config.material}
                </button>
              </div>
            ))}
            {/* BOTÓN MAGNO: Añadir Nuevo Grupo de Material */}
            <button
              onClick={() => setStep(1)}
              className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg hover:bg-slate-700 transition-all">
              <Plus size={20} /> Añadir Otro Material/Grupo
            </button>
            <div className="h-24"></div> {/* Espaciador para el footer */}
          </div>
        )}

        {/* STEP 3: RESUMEN DETALLADO (PRESUPUESTO) */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-10">
            {/* Cabecera del Documento */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Resumen de Presupuesto</h2>
                <p className="text-slate-500 text-sm mt-1">Revise los detalles antes de confirmar.</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Referencia</div>
                <div className="font-mono font-bold text-lg text-slate-800">{projectInfo.reference}</div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-2">Cliente</div>
                <div className="font-bold text-lg text-slate-800">{projectInfo.client}</div>
              </div>
            </div>

            {/* Iteración de Grupos / Partidas */}
            {groups.map((group, index) => {
              // Calcular subtotal del grupo para mostrarlo en cabecera
              const groupSubtotal = group.lines.reduce((acc, l) => {
                const wood = ((l.height * l.width) / 1000000) * group.config.pricePerM2;
                const comps = l.complements.reduce((cAcc, sel) => {
                  const item = COMPLEMENTS_CATALOG.find((c) => c.id === sel.catalogId);
                  return cAcc + (item ? item.price + (sel.needsMachining ? item.machiningPrice : 0) : 0);
                }, 0);
                return acc + (wood + comps) * l.qty;
              }, 0);

              return (
                <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Cabecera de Grupo */}
                  <div className="bg-slate-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-200 text-slate-600 w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs">{index + 1}</div>
                      <div>
                        <h3 className="font-bold text-slate-800">{group.config.material}</h3>
                        <p className="text-xs text-slate-500">
                          {group.config.finish} • {group.config.pricePerM2}€/m²
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold uppercase">Subtotal</div>
                      <div className="font-bold text-slate-900">{groupSubtotal.toFixed(2)}€</div>
                    </div>
                  </div>

                  {/* Tabla de Piezas */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Cant.</th>
                          <th className="px-6 py-3 font-semibold">Medidas</th>
                          <th className="px-6 py-3 font-semibold">Detalles (Cantos / Extras)</th>
                          <th className="px-6 py-3 font-semibold text-right">Precio Ud.</th>
                          <th className="px-6 py-3 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {group.lines.map((line) => {
                          // Calcular precio unitario de esta línea específica
                          const woodCost = ((line.height * line.width) / 1000000) * group.config.pricePerM2;
                          const extrasCost = line.complements.reduce((acc, c) => {
                            const item = COMPLEMENTS_CATALOG.find((i) => i.id === c.catalogId);
                            return acc + (item ? item.price + (c.needsMachining ? item.machiningPrice : 0) : 0);
                          }, 0);
                          const unitPrice = woodCost + extrasCost;

                          return (
                            <tr key={line.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-bold text-slate-900">{line.qty}</td>
                              <td className="px-6 py-4 text-slate-700 font-mono">
                                {line.height} x {line.width}
                              </td>
                              <td className="px-6 py-4">
                                {/* Cantos */}
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{getEdgeSummary(line.edges)}</span>
                                </div>
                                {/* Complementos */}
                                {line.complements.map((comp) => {
                                  const item = COMPLEMENTS_CATALOG.find((c) => c.id === comp.catalogId);
                                  return (
                                    <div key={comp.catalogId} className="text-xs text-indigo-600 flex items-center gap-1">
                                      <span>+ {item?.name}</span>
                                      {comp.needsMachining && <span className="text-[10px] bg-indigo-50 px-1 rounded border border-indigo-100">MEC</span>}
                                    </div>
                                  );
                                })}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500">{unitPrice.toFixed(2)}€</td>
                              <td className="px-6 py-4 text-right font-bold text-slate-800">{(unitPrice * line.qty).toFixed(2)}€</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Acciones Finales */}
            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
              <button
                onClick={() => setStep(2)} // Volver a editar
                className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all">
                ← Volver y Editar
              </button>

              <button
                onClick={() => alert("¡Presupuesto Aceptado! Aquí conectaríamos con la API de Pedidos.")}
                className="flex-[2] py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 hover:bg-green-500 active:scale-[0.99] transition-all flex justify-center items-center gap-2">
                <Check size={24} /> Aceptar Presupuesto ({grandTotal.toFixed(2)}€)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: Resumen de Presupuesto (Siempre visible) */}
      {step !== 3 && (
        <footer className="fixed bottom-0 w-full bg-slate-900 text-white pt-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-30 rounded-t-2xl transition-transform duration-300">
          <div className={`${layoutContainer} flex justify-between items-center px-4`}>
            {/* Resumen Precio */}
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Presupuesto</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight">{grandTotal.toFixed(2)}€</span>
                {totalArea > 0 && (
                  <span className="hidden sm:inline-block text-sm text-slate-500 bg-slate-800 px-2 py-1 rounded-md">{totalArea.toFixed(2)} m²</span>
                )}
              </div>
            </div>

            {/* Botón Tramitar con Validación */}
            <button
              disabled={!isFormValid}
              onClick={() => setStep(step === 2 && isFormValid ? 3 : 2)}
              className={`
              px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2
              ${
                isFormValid
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 active:translate-y-0.5 cursor-pointer"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
              }
            `}
              title={!isFormValid ? "Rellena referencia, cliente y añade piezas para continuar" : "Finalizar pedido"}>
              {/* Opcional: Icono de candado si está bloqueado */}
              {!isFormValid && <span className="text-xs uppercase mr-1">Completar Datos</span>}
              Presupuesto
            </button>
          </div>
        </footer>
      )}

      {/* --- MODAL DE COMPLEMENTOS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (Fondo oscuro borroso) */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>

          {/* Card del Modal */}
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Header Modal */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Seleccionar Complementos</h3>
                <p className="text-sm text-gray-500">Añade accesorios a esta medida específica</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto overflow-x-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {COMPLEMENTS_CATALOG.map((item) => {
                  // Buscamos si la línea activa tiene este complemento seleccionado
                  const activeLine = groups.find((g) => g.id === activeModal.groupId)?.lines.find((l) => l.id === activeModal.lineId);
                  const selection = activeLine?.complements.find((c) => c.catalogId === item.id);
                  const isSelected = !!selection;

                  return (
                    <div
                      key={item.id}
                      className={`flex gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer group ${
                        isSelected ? "border-indigo-500 bg-indigo-50/30" : "border-gray-100 hover:border-gray-300"
                      }`}
                      onClick={(e) => {
                        // Evitar que el click en el checkbox dispare el toggle del card entero
                        if ((e.target as HTMLElement).closest(".machining-control")) return;
                        toggleComplement(item.id);
                      }}>
                      {/* Foto */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800">{item.name}</h4>
                            {isSelected && <Check size={18} className="text-indigo-600" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          <span className="font-bold text-slate-900">{item.price.toFixed(2)}€</span>

                          {/* Control de Mecanizado (Solo visible si está seleccionado) */}
                          {isSelected && (
                            <label
                              className="machining-control flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-indigo-200 shadow-sm cursor-pointer hover:bg-indigo-50"
                              onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selection.needsMachining}
                                onChange={() => toggleMachining(item.id)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                onFocus={handleFocus}
                              />
                              <div className="flex flex-col leading-none">
                                <span className="text-[10px] font-bold text-indigo-900 uppercase">Mecanizado</span>
                                <span className="text-[10px] text-indigo-500">+{item.machiningPrice.toFixed(2)}€</span>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg w-full sm:w-auto">
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDoorV2Module;
