// Domain Types específicos del MES

export type StationType = "cutting" | "edge_banding" | "cnc" | "assembly";

export type PartStatus = "pending" | "in_progress" | "done" | "delayed" | "waiting_next" | "scrap";

export type OrderStatus = "pending" | "in_progress" | "done" | "delayed";

export interface Station {
  id: string;
  name: string;
  type: StationType;
  capacity?: number;
}

export interface RouteStep {
  stationType: StationType;
  status: "pending" | "active" | "done" | "scrap";
  estimatedTime?: number;
  realTime?: number;
}

export interface ProductionPart {
  _id: string;
  orderId: string;
  name: string;
  material: string;
  dimensions: string; // Format "LxWxH"
  route: RouteStep[];
  currentStep?: number;
  status: PartStatus;
}

export interface Order {
  id: string;
  client: string;
  deadline: string;
  status: OrderStatus;
  totalParts: number;
  completedParts: number;
}
