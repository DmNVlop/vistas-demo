import type { Order, ProductionPart, Station } from "../domain/types";

export const INITIAL_ORDERS: Order[] = [
  { id: "ORD-2024-001", client: "Muebles García", deadline: "2024-11-30", status: "in_progress", totalParts: 150, completedParts: 45 },
  { id: "ORD-2024-002", client: "Hotel Riu Reforma", deadline: "2024-12-05", status: "pending", totalParts: 1200, completedParts: 0 },
  { id: "ORD-2024-003", client: "Cocinas Premium", deadline: "2024-11-28", status: "delayed", totalParts: 300, completedParts: 280 },
];

export const mockStations: Station[] = [
  { id: "cut_01", name: "Seccionadora S-100", type: "cutting" },
  { id: "edge_01", name: "Canteadora K-500", type: "edge_banding" },
  { id: "cnc_01", name: "CNC Vertical V-200", type: "cnc" },
  { id: "assembly_01", name: "Banco Armado A1", type: "assembly" },
];

export const generateMockParts = (orders: Order[]): ProductionPart[] => {
  const parts: ProductionPart[] = [];
  orders.forEach((o) => {
    // Generamos solo 10 partes por orden para no saturar la demo visual
    for (let i = 0; i < 10; i++) {
      parts.push({
        _id: `${o.id}-P${String(i).padStart(3, "0")}`,
        orderId: o.id,
        name: `Pieza Test ${i}`,
        material: "Melamina 19mm",
        dimensions: "800x400",
        route: [{ stationType: "cutting", status: "pending" }], // Ruta simplificada
        status: "pending",
      });
    }
  });
  return parts;
};
