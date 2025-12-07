import { Factory, Scissors, Grid, DoorOpen, Layers, Archive, Square, type LucideIcon } from "lucide-react";

export const APP_NAME = "Suite Industrial de Fabricación";
export const APP_ENTERPRISE_NAME = "OkAnd Soluciones";
export const APP_VERSION = "0.1.0";
export const APP_DESCRIPTION = "Plataforma de gestión de fábrica. Presupuestador y Producción.";
export const APP_COPYRIGHT = "© 2025 OkAnd Soluciones. Todos los derechos reservados.";

export interface SuiteProduct {
  id: string;
  name: string;
  category: "Producción" | "Presupuestador" | "Error";
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
}

export const SUITE_PRODUCTS: SuiteProduct[] = [
  {
    id: "mes-aps",
    name: "MES & APS Pro",
    category: "Producción",
    description: "Control integral de fábrica. Planificación y trazabilidad.",
    icon: Factory,
    color: "blue",
    path: "/apps/mes",
  },
  {
    id: "quoter-cut",
    name: "Optimización y Corte",
    category: "Presupuestador",
    description: "Cálculo de tableros y mecanizado.",
    icon: Scissors,
    color: "emerald",
    path: "/apps/quoter/cutting",
  },
  {
    id: "quoter-cut-v2",
    name: "Optimización y Corte- V2",
    category: "Presupuestador",
    description: "Cálculo de piezas, tableros y cantos.",
    icon: Scissors,
    color: "emerald",
    path: "/apps/quoter/cutting-v2",
  },
  {
    id: "quoter-kitchen",
    name: "Puertas de Cocinas",
    category: "Presupuestador",
    description: "Configurador de puertas de cocinas.",
    icon: Grid,
    color: "orange",
    path: "/apps/quoter/kitchen-door",
  },
  {
    id: "quoter-doors",
    name: "Puertas de Paso",
    category: "Presupuestador",
    description: "Gestión de block y manillería.",
    icon: DoorOpen,
    color: "amber",
    path: "/apps/quoter/quoter-doors",
  },
  {
    id: "quoter-countertops",
    name: "Encimeras",
    category: "Presupuestador",
    description: "Cálculo lineal y por m2.",
    icon: Layers,
    color: "stone",
    path: "/apps/quoter/quoter-countertops",
  },
  {
    id: "quoter-closets",
    name: "Armarios Empotrados",
    category: "Presupuestador",
    description: "Diseño interior y frentes.",
    icon: Archive,
    color: "violet",
    path: "/apps/quoter/quoter-closets",
  },
  {
    id: "quoter-shelves",
    name: "Estanterías",
    category: "Presupuestador",
    description: "Configurador paramétrico.",
    icon: Square,
    color: "cyan",
    path: "/apps/quoter/quoter-shelves",
  },
];
