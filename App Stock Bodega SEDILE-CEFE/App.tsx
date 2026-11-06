import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Lock, Unlock, Clipboard, Image as ImageIcon, Plus, Trash2,
  RefreshCw, Check, X, AlertTriangle, AlertCircle, ShieldAlert,
  Database, Wifi, WifiOff, PlusCircle, LogIn, LogOut, CheckCircle, HelpCircle, Eye, EyeOff, History, MoreVertical, Edit3,
  TrendingUp, ArrowUpDown, Clock, Users, FileText, Copy, Calendar, ChevronDown, Heart, SlidersHorizontal, Settings
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LabelList, LineChart, Line, AreaChart, Area, CartesianGrid
} from 'recharts';
import { supabase, isConfigured } from './services/supabase';
import { Toast, ToastType } from './components/Toast';

// Interfaces locales para robustez
const PEG_SERVICES = ['Lactantes', 'II infancia', 'Cirugia', 'Timped', 'Uciped', 'Oncoped'] as const;

const PEG_SERVICE_COLORS: Record<string, string> = {
  'Lactantes': 'bg-purple-50 text-purple-700 border-purple-100',
  'II infancia': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Cirugia': 'bg-blue-50 text-blue-700 border-blue-100',
  'Timped': 'bg-amber-50 text-amber-700 border-amber-100',
  'Uciped': 'bg-rose-50 text-rose-700 border-rose-100',
  'Oncoped': 'bg-teal-50 text-teal-700 border-teal-100'
};

export interface PegDelivery {
  id: string;
  paciente_cama: string;
  cantidad_entregada: number; // en cantidad de sobres
  dosis_gramos_dia: number;   // dosis regular en gramos
  dosis_inicio_gramos: number; // dosis del primer día en gramos
  fecha_entrega: string;
  fecha_inicio_uso: string;
  status: 'active' | 'discharged' | 'paused' | 'sos';
  servicio: typeof PEG_SERVICES[number];
  leftover_sobres?: number;
  discharge_date?: string;
  created_at?: string;
}

export interface StockItem {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  stock_sedile: number;
  uso_diario: number;
  stock_total: number;
  categoria: string;
  created_at?: string;
  updated_at?: string;
  oculto?: boolean;
  factor_empaque?: string;
  area?: string;
  stock_bodega_leches?: number;
  licitacion_contrato?: string;
  ubicacion?: string;
}

export interface WorkloadRecord {
  id: string;
  fecha: string;
  turno: 'Día' | 'Noche';
  area: string;
  categoria: string;
  producto_unidad: string;
  cantidad: number;
  tiempo_total_min: number;
  tiempo_extra_min: number;
  observaciones: string;
  created_at?: string;
  
  // Nuevos campos del registro consolidado por turno
  is_consolidado?: boolean;
  dotacion_teorica?: number;
  dotacion_real?: number;
  motivos_ausencia?: string[];
  litros_lacteos?: number;
  litros_enterales?: number;
  pacientes_atendidos?: number;
  productos_entregados?: number;
  incidentes_detectados?: string[];
}

export interface MermaRecord {
  id: string;
  fecha: string;
  seccion: 'Enterales' | 'Pediatría' | 'Neonatología' | string;
  motivo: string;
  producto_unidad: 'Mamaderas' | 'Vasos con suplemento' | 'Vasos con productos especiales' | 'Jeringas' | 'Botellines' | 'Jugos en caja' | string;
  cantidad: number;
  created_at?: string;
}

const CATEGORIES = ['Todos', 'Lácteos/Polvos', 'RTH (Enteral)', 'Espesantes/Módulos', 'Insumos', 'Suplementos Botellin'];

const EXTRA_DATA_MAP: Record<string, { factor_empaque: string; area: string; stock_bodega_leches: number }> = {
  'Abintra': { factor_empaque: 'CAJA 30 UD', area: 'clinica', stock_bodega_leches: 990 },
  'Aceite MCT': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Aceite vegetal': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Adaptador enfit': { factor_empaque: 'CAJA 30 UD', area: 'CEFE', stock_bodega_leches: 6000 },
  'Agua Mineral': { factor_empaque: 'DISPLAY 12 UD', area: 'clinica', stock_bodega_leches: 899 },
  'Alfamino': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Alprem': { factor_empaque: 'CAJA 32 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Ascenda': { factor_empaque: 'DISPLAY 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Avena': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Azúcar': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Bajada Amika': { factor_empaque: 'CAJA 30 UD', area: 'CEFE', stock_bodega_leches: 2340 },
  'Blemil plus elemental': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 0 },
  'Blemil plus hidrolizada': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 0 },
  'Bolsa hidratación': { factor_empaque: 'CAJA 30 UD', area: 'SEDILE', stock_bodega_leches: 0 },
  'Chuño': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Colado manzana': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Ensure Clinical': { factor_empaque: 'CAJA 30 UD', area: 'clinica', stock_bodega_leches: 120 },
  'Ensure Compact': { factor_empaque: 'CAJA 24 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Ensure polvo': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 60 },
  'Espesante': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 12 },
  'Formula infantil sin lactosa': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Fortificante Materno': { factor_empaque: 'CAJA 72 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Frebini energy drink': { factor_empaque: 'CAJA 4 UD', area: 'clinica', stock_bodega_leches: 24 },
  'Fresubin 2 Kcal crema capuchino': { factor_empaque: 'CAJA 4 UD', area: 'clinica', stock_bodega_leches: 24 },
  'Fresubin Hepa drink': { factor_empaque: 'CAJA 4 UD', area: 'clinica', stock_bodega_leches: 24 },
  'Fresubin renal capuccino': { factor_empaque: 'CAJA 4 UD', area: 'clinica', stock_bodega_leches: 24 },
  'Glucerna Triple Care Liquido': { factor_empaque: 'DISPLAY 32 UD', area: 'clinica', stock_bodega_leches: 168 },
  'Glutapak-R': { factor_empaque: 'CAJA 50 UD', area: 'clinica', stock_bodega_leches: 150 },
  'Hepatic NM': { factor_empaque: 'CAJA 15 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Jugos (DONACION)': { factor_empaque: 'DISPLAY 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Lacsure': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 0 },
  'Lecha Althera': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Leche 12% MG': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Leche 26% MG': { factor_empaque: '1 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Leche Nido etapa +1': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Monogen': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nan optipro liquida': { factor_empaque: 'CAJA 48 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nan 3 L Confortis': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nan expert pro comfort': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nan I': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nan prematuro': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nat 100 diabetico': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 112 },
  'Nat 100 fibra': { factor_empaque: 'CAJA 8 UD', area: 'clinica', stock_bodega_leches: 4 },
  'Neocate': { factor_empaque: 'CAJA 4 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Nepro AP': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 24 },
  'Nessucar': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 108 },
  'Nutren Senior': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 0 },
  'Nutrilon Pepti Junior': { factor_empaque: 'CAJA 24 UD', area: 'clinica', stock_bodega_leches: 25 },
  'Pediasure Drink sabor vainilla': { factor_empaque: 'CAJA 24 UD', area: 'clinica', stock_bodega_leches: 783 },
  'Pediasure polvo': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 132 },
  'Proteinex': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 369 },
  'similac 1': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Similac Neosure': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Similac Rice (DONACION)': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Similac special Care liquido': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Similac total comfort': { factor_empaque: 'CAJA 12 UD', area: 'clinica', stock_bodega_leches: 12 },
  'Supportan Drink': { factor_empaque: 'CAJA 4 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Vasos 10 oz': { factor_empaque: 'CAJA 1000 UD', area: 'SEDILE', stock_bodega_leches: 0 },
  'Vasos 12 oz': { factor_empaque: 'CAJA 1000 UD', area: 'SEDILE', stock_bodega_leches: 0 },
  'Vasos 8 oz': { factor_empaque: 'CAJA 1000 UD', area: 'SEDILE', stock_bodega_leches: 0 },
  'VIV362386229V2': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 0 },
  'Vivalite gold (Fomula para Diabeticos)': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 112 },
  'Vivalite Healing': { factor_empaque: '', area: 'clinica', stock_bodega_leches: 0 },
  'Vivalite UP con HMB y FOS': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Vivalite Whey Protein': { factor_empaque: 'CAJA 6 UD', area: 'clinica', stock_bodega_leches: 0 },
  'Diben 1,5 500 ML': { factor_empaque: 'CAJA 15 UD', area: 'RTH', stock_bodega_leches: 510 },
  'Diben 1,5 1000 ML': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 544 },
  'Ensure Clinical RTH': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 232 },
  'Frebini original': { factor_empaque: 'CAJA 15 UD', area: 'RTH', stock_bodega_leches: 0 },
  'Fresubin 2 Kcal': { factor_empaque: 'CAJA 15 UD', area: 'RTH', stock_bodega_leches: 1365 },
  'Fresubin HP ENERGY': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 16 },
  'Fresubin Intensive': { factor_empaque: 'CAJA 15 UD', area: 'RTH', stock_bodega_leches: 300 },
  'Fresubin Original': { factor_empaque: 'CAJA 15 UD', area: 'RTH', stock_bodega_leches: 24 },
  'Glucerna 1.5': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 0 },
  'Jevity': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 80 },
  'Osmolite': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 144 },
  'SURVIMED 500 ML': { factor_empaque: 'CAJA 15 UD', area: 'RTH', stock_bodega_leches: 30 },
  'SURVIMED 1000 ML': { factor_empaque: 'CAJA 8 UD', area: 'RTH', stock_bodega_leches: 0 }
};

const BASE_PRODUCTS = [
  { id: '1', codigo: '035-0355', nombre: 'Abintra', unidad: 'SOBRE 27 G', stock_sedile: 6, uso_diario: 6, stock_total: 996, categoria: 'Lácteos/Polvos' },
  { id: '2', codigo: '035-0271', nombre: 'Aceite MCT', unidad: '500 ml', stock_sedile: 4, uso_diario: 0.2, stock_total: 4, categoria: 'Espesantes/Módulos' },
  { id: '3', codigo: '035-0001', nombre: 'Aceite vegetal', unidad: '900 ml', stock_sedile: 1, uso_diario: 0.1, stock_total: 1, categoria: 'Espesantes/Módulos' },
  { id: '4', codigo: '225-0229', nombre: 'Adaptador enfit', unidad: '1 UD', stock_sedile: 6175, uso_diario: 90, stock_total: 12175, categoria: 'Insumos' },
  { id: '5', codigo: '035-0342', nombre: 'Agua Mineral', unidad: 'BOTELLA 500 cc', stock_sedile: 376, uso_diario: 45, stock_total: 1275, categoria: 'Insumos' },
  { id: '6', codigo: '035-0274', nombre: 'Alfamino', unidad: 'TARRO 400 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '7', codigo: '035-0005', nombre: 'Alprem', unidad: 'FRASCOS 70 ml', stock_sedile: 49, uso_diario: 10, stock_total: 49, categoria: 'Lácteos/Polvos' },
  { id: '8', codigo: '035-0461', nombre: 'Ascenda', unidad: 'TARRO 800 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '9', codigo: '035-0008', nombre: 'Avena', unidad: 'BOLSA 500 G', stock_sedile: 8, uso_diario: 0.2, stock_total: 8, categoria: 'Insumos' },
  { id: '10', codigo: '035-0006', nombre: 'Azúcar', unidad: '1000 g', stock_sedile: 9, uso_diario: 0.2, stock_total: 9, categoria: 'Insumos' },
  { id: '11', codigo: '225-0185', nombre: 'Bajada Amika', unidad: '1 UD', stock_sedile: 1380, uso_diario: 90, stock_total: 3720, categoria: 'Insumos' },
  { id: '12', codigo: 'N/A', nombre: 'Blemil plus elemental', unidad: 'TARRO 400 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '13', codigo: 'N/A', nombre: 'Blemil plus hidrolizada', unidad: 'TARROS 400 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '14', codigo: '042-1267', nombre: 'Bolsa hidratación', unidad: '1 UD', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Insumos' },
  { id: '15', codigo: '035-0019', nombre: 'Chuño', unidad: 'PAQUETE 500 grs.', stock_sedile: 1, uso_diario: 0.1, stock_total: 1, categoria: 'Insumos' },
  { id: '16', codigo: '035-0024', nombre: 'Colado manzana', unidad: 'POTE 113 G', stock_sedile: 22, uso_diario: 0.2, stock_total: 22, categoria: 'Lácteos/Polvos' },
  { id: '17', codigo: '035-0381', nombre: 'Ensure Clinical', unidad: 'BOTELLIN 220 ML', stock_sedile: 349, uso_diario: 25, stock_total: 469, categoria: 'Lácteos/Polvos' },
  { id: '18', codigo: '035-0410', nombre: 'Ensure Compact', unidad: 'BOTELLIN 125 ML', stock_sedile: 177, uso_diario: 10, stock_total: 177, categoria: 'Lácteos/Polvos' },
  { id: '19', codigo: '035-0134', nombre: 'Ensure polvo', unidad: 'TARRO 850 G', stock_sedile: 24, uso_diario: 3, stock_total: 84, categoria: 'Lácteos/Polvos' },
  { id: '20', codigo: '035-0244', nombre: 'Espesante', unidad: 'TARRO 300 G', stock_sedile: 0, uso_diario: 1, stock_total: 12, categoria: 'Espesantes/Módulos' },
  { id: '21', codigo: '035-0166', nombre: 'Formula infantil sin lactosa', unidad: 'TARRO 400 G', stock_sedile: 10, uso_diario: 0.3, stock_total: 10, categoria: 'Lácteos/Polvos' },
  { id: '22', codigo: '035-0182', nombre: 'Fortificante Materno', unidad: 'SOBRE 1 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '23', codigo: '035-0320', nombre: 'Frebini energy drink', unidad: '200 ML', stock_sedile: 0, uso_diario: 1, stock_total: 24, categoria: 'Lácteos/Polvos' },
  { id: '24', codigo: '035-0498', nombre: 'Fresubin 2 Kcal crema capuchino', unidad: '125 G', stock_sedile: 0, uso_diario: 1, stock_total: 24, categoria: 'Lácteos/Polvos' },
  { id: '25', codigo: '035-0499', nombre: 'Fresubin Hepa drink', unidad: '200 ML', stock_sedile: 0, uso_diario: 1, stock_total: 24, categoria: 'Lácteos/Polvos' },
  { id: '26', codigo: '035-0315', nombre: 'Fresubin renal capuccino', unidad: '200 ML', stock_sedile: 0, uso_diario: 1, stock_total: 24, categoria: 'Lácteos/Polvos' },
  { id: '27', codigo: '035-0380', nombre: 'Glucerna Triple Care Liquido', unidad: 'BOTELLIN 237 ML', stock_sedile: 468, uso_diario: 5, stock_total: 636, categoria: 'Lácteos/Polvos' },
  { id: '28', codigo: '035-0353', nombre: 'Glutapak-R', unidad: 'SOBRE', stock_sedile: 146, uso_diario: 2, stock_total: 296, categoria: 'Lácteos/Polvos' },
  { id: '29', codigo: 'N/A', nombre: 'Hepatic NM', unidad: 'SOBRE 100 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '30', codigo: '035-0385', nombre: 'Jugos (DONACION)', unidad: 'CAJA 200 cc', stock_sedile: 161, uso_diario: 12, stock_total: 161, categoria: 'Lácteos/Polvos' },
  { id: '31', codigo: '035-0134', nombre: 'Lacsure', unidad: 'TARRO', stock_sedile: 0, uso_diario: 3, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '32', codigo: '036-0029', nombre: 'Lecha Althera', unidad: 'TARROS 400 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '33', codigo: '035-0173', nombre: 'Leche 12% MG', unidad: 'BOLSA 1000 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '34', codigo: '035-0121', nombre: 'Leche 26% MG', unidad: 'BOLSA 1000 G', stock_sedile: 11, uso_diario: 0.5, stock_total: 11, categoria: 'Lácteos/Polvos' },
  { id: '35', codigo: '035-0452', nombre: 'Leche Nido etapa +1', unidad: 'TARRO 1350 G', stock_sedile: 5, uso_diario: 0.5, stock_total: 5, categoria: 'Lácteos/Polvos' },
  { id: '36', codigo: '035-0328', nombre: 'Monogen', unidad: 'TARRO 400 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '37', codigo: '035-0073', nombre: 'Nan optipro liquida', unidad: 'frasco 70 ml', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '38', codigo: '035-0391', nombre: 'Nan 3 L Confortis', unidad: 'TARRO 800 G', stock_sedile: 0, uso_diario: 0.5, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '39', codigo: '035-0357', nombre: 'Nan expert pro comfort', unidad: 'TARRO 800 G', stock_sedile: 12, uso_diario: 1, stock_total: 12, categoria: 'Lácteos/Polvos' },
  { id: '40', codigo: '035-0048', nombre: 'Nan I', unidad: 'TARRO 800 G', stock_sedile: 42, uso_diario: 2, stock_total: 42, categoria: 'Lácteos/Polvos' },
  { id: '41', codigo: '035-0107', nombre: 'Nan prematuro', unidad: 'TARRO 400 G', stock_sedile: 0, uso_diario: 3, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '42', codigo: '035-0140', nombre: 'Nat 100 diabetico', unidad: 'TARRO 900 G', stock_sedile: 73, uso_diario: 3, stock_total: 185, categoria: 'Lácteos/Polvos' },
  { id: '43', codigo: '035-0359', nombre: 'Nat 100 fibra', unidad: 'TARRO 900 G', stock_sedile: 12, uso_diario: 1, stock_total: 16, categoria: 'Lácteos/Polvos' },
  { id: '44', codigo: '035-0432', nombre: 'Neocate', unidad: 'TARRO 400 G', stock_sedile: 43, uso_diario: 0.1, stock_total: 43, categoria: 'Lácteos/Polvos' },
  { id: '45', codigo: '035-0038', nombre: 'Nepro AP', unidad: '237 ML', stock_sedile: 0, uso_diario: 1, stock_total: 24, categoria: 'Lácteos/Polvos' },
  { id: '46', codigo: '035-0058', nombre: 'Nessucar', unidad: 'TARRO 500 G', stock_sedile: 71, uso_diario: 1, stock_total: 179, categoria: 'Espesantes/Módulos' },
  { id: '47', codigo: '035-0454', nombre: 'Nutren Senior', unidad: 'TARRO', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '48', codigo: '035-0433', nombre: 'Nutrilon Pepti Junior', unidad: 'TARRO 400 G', stock_sedile: 58, uso_diario: 2, stock_total: 83, categoria: 'Lácteos/Polvos' },
  { id: '49', codigo: '035-0091', nombre: 'Pediasure Drink sabor vainilla', unidad: 'BOTELLIN 220 ML', stock_sedile: 282, uso_diario: 3, stock_total: 1065, categoria: 'Lácteos/Polvos' },
  { id: '50', codigo: '035-0035', nombre: 'Pediasure polvo', unidad: 'TARRO 900 G', stock_sedile: 51, uso_diario: 3.5, stock_total: 183, categoria: 'Lácteos/Polvos' },
  { id: '51', codigo: '035-0273', nombre: 'Proteinex', unidad: 'TARRO 300 G', stock_sedile: 32, uso_diario: 3, stock_total: 401, categoria: 'Espesantes/Módulos' },
  { id: '52', codigo: '035-0135', nombre: 'similac 1', unidad: '400 g', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '53', codigo: '035-0107', nombre: 'Similac Neosure', unidad: 'TARRO 400 G', stock_sedile: 0, uso_diario: 3, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '54', codigo: '035-0453', nombre: 'Similac Rice (DONACION)', unidad: 'TARRO 200 G', stock_sedile: 1, uso_diario: 0.1, stock_total: 1, categoria: 'Lácteos/Polvos' },
  { id: '55', codigo: '035-0351', nombre: 'Similac special Care liquido', unidad: 'BOTELLIN 59 ml', stock_sedile: 206, uso_diario: 5, stock_total: 206, categoria: 'Lácteos/Polvos' },
  { id: '56', codigo: '035-0377', nombre: 'Similac total comfort', unidad: 'TARRO 820 G', stock_sedile: 0, uso_diario: 1, stock_total: 12, categoria: 'Lácteos/Polvos' },
  { id: '57', codigo: '035-0348', nombre: 'Supportan Drink', unidad: 'BOTELLIN 200 ml', stock_sedile: 242, uso_diario: 22, stock_total: 242, categoria: 'Lácteos/Polvos' },
  { id: '58', codigo: '042-0668', nombre: 'Vasos 10 oz', unidad: 'Unidad', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Insumos' },
  { id: '59', codigo: '041-0042', nombre: 'Vasos 12 oz', unidad: 'Unidad', stock_sedile: 0, uso_diario: 200, stock_total: 0, categoria: 'Insumos' },
  { id: '60', codigo: '042-0669', nombre: 'Vasos 8 oz', unidad: 'Unidad', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Insumos' },
  { id: '61', codigo: '035-0353', nombre: 'VIV362386229V2', unidad: 'SOBRE 15 G', stock_sedile: 0, uso_diario: 2, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '62', codigo: '035-0140', nombre: 'Vivalite gold (Fomula para Diabeticos)', unidad: 'TARRO 850 G', stock_sedile: 73, uso_diario: 2, stock_total: 185, categoria: 'Lácteos/Polvos' },
  { id: '63', codigo: '035-0355', nombre: 'Vivalite Healing', unidad: 'SOBRE', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Lácteos/Polvos' },
  { id: '64', codigo: '035-0350', nombre: 'Vivalite UP con HMB y FOS', unidad: 'TARRO 900 G', stock_sedile: 15, uso_diario: 0.1, stock_total: 15, categoria: 'Lácteos/Polvos' },
  { id: '65', codigo: '035-0133', nombre: 'Vivalite Whey Protein', unidad: 'TARRO 300 G', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'Espesantes/Módulos' },
  { id: '66', codigo: '035-0084', nombre: 'Diben 1,5 500 ML', unidad: '500 ML', stock_sedile: 240, uso_diario: 15, stock_total: 750, categoria: 'RTH (Enteral)' },
  { id: '67', codigo: '035-0394', nombre: 'Diben 1,5 1000 ML', unidad: '1000ML', stock_sedile: 0, uso_diario: 0.1, stock_total: 544, categoria: 'RTH (Enteral)' },
  { id: '68', codigo: '035-0420', nombre: 'Ensure Clinical RTH', unidad: '500 ML', stock_sedile: 448, uso_diario: 11, stock_total: 680, categoria: 'RTH (Enteral)' },
  { id: '69', codigo: '035-0259', nombre: 'Frebini original', unidad: '500 ML', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'RTH (Enteral)' },
  { id: '70', codigo: '035-0313', nombre: 'Fresubin 2 Kcal', unidad: '500 ML', stock_sedile: 375, uso_diario: 25, stock_total: 1740, categoria: 'RTH (Enteral)' },
  { id: '71', codigo: '035-0232', nombre: 'Fresubin HP ENERGY', unidad: '1000 ML', stock_sedile: 0, uso_diario: 0.1, stock_total: 16, categoria: 'RTH (Enteral)' },
  { id: '72', codigo: '035-0387', nombre: 'Fresubin Intensive', unidad: '500 ML', stock_sedile: 195, uso_diario: 11, stock_total: 495, categoria: 'RTH (Enteral)' },
  { id: '73', codigo: '035-0137', nombre: 'Fresubin Original', unidad: '1000 ML', stock_sedile: 0, uso_diario: 0.1, stock_total: 24, categoria: 'RTH (Enteral)' },
  { id: '74', codigo: '035-0344', nombre: 'Glucerna 1.5', unidad: '1000 ML', stock_sedile: 88, uso_diario: 16, stock_total: 88, categoria: 'RTH (Enteral)' },
  { id: '75', codigo: '035-0039', nombre: 'Jevity', unidad: '1000 ML', stock_sedile: 80, uso_diario: 4, stock_total: 160, categoria: 'RTH (Enteral)' },
  { id: '76', codigo: '035-0138', nombre: 'Osmolite', unidad: '500 ML', stock_sedile: 112, uso_diario: 4, stock_total: 256, categoria: 'RTH (Enteral)' },
  { id: '77', codigo: '035-0302', nombre: 'SURVIMED', unidad: '500 ML', stock_sedile: 0, uso_diario: 0.1, stock_total: 30, categoria: 'RTH (Enteral)' },
  { id: '78', codigo: '035-0496', nombre: 'SURVIMED', unidad: '1000 ML', stock_sedile: 0, uso_diario: 0.1, stock_total: 0, categoria: 'RTH (Enteral)' }
];

const DEFAULT_PRODUCTS: StockItem[] = BASE_PRODUCTS.map(p => {
  const lookupKey = p.nombre === 'SURVIMED' ? `SURVIMED ${p.unidad}` : p.nombre;
  const extra = EXTRA_DATA_MAP[lookupKey];
  const stockBodega = extra ? extra.stock_bodega_leches : 0;
  return {
    ...p,
    factor_empaque: extra ? extra.factor_empaque : '',
    area: extra ? extra.area : 'clinica',
    stock_bodega_leches: stockBodega,
    stock_total: p.stock_sedile + stockBodega
  };
});

const getMonthYearKey = (dateStr: string) => {
  if (!dateStr) return 'Fecha Desconocida';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const monthName = date.toLocaleString('es-CL', { month: 'long' });
    const year = date.getFullYear();
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  } catch (e) {
    return 'Fecha Inválida';
  }
};

const formatFriendlyDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const str = date.toLocaleDateString('es-CL', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch (e) {
    return dateStr;
  }
};

const getPatientFinishedDate = (item: any) => {
  if (item.status === 'discharged' && item.discharge_date) {
    return item.discharge_date;
  }
  try {
    const { startHour, schedules } = parsePegPatientData(item);
    const tStart = new Date(`${item.fecha_inicio_uso}T${startHour}:00`);
    const totalGrams = item.cantidad_entregada * 17;
    const regularDose = item.dosis_gramos_dia || 0;
    
    const totalDosesNeeded = regularDose > 0 ? Math.ceil(totalGrams / regularDose) : 30;
    
    let dosesCount = 0;
    const tempDate = new Date(tStart);
    tempDate.setHours(0, 0, 0, 0);
    
    let finishedDateStr = item.fecha_inicio_uso;
    let found = false;
    
    for (let d = 0; d < 365 && !found; d++) {
      const dateStr = tempDate.toISOString().split('T')[0];
      
      for (let s = 0; s < schedules.length; s++) {
        const schedHour = schedules[s].trim();
        if (/^\d{2}:\d{2}$/.test(schedHour)) {
          const schedDateTime = new Date(`${dateStr}T${schedHour}:00`);
          if (schedDateTime >= tStart) {
            dosesCount++;
            if (dosesCount >= totalDosesNeeded) {
              finishedDateStr = dateStr;
              found = true;
              break;
            }
          }
        }
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return finishedDateStr;
  } catch (e) {
    return item.fecha_inicio_uso;
  }
};

const parseMermaRecord = (r: any) => {
  let rawSec = r.seccion || '';
  let rawMotivo = r.motivo || '';
  let rawProdUnidad = r.producto_unidad || '';
  
  // Detectar metadatos codificados en producto_unidad para compatibilidad con bases de datos antiguas
  const tagMatch = String(rawProdUnidad).match(/^\[SEC:(.*?)\|MOT:(.*?)\]\s*(.*)$/);
  if (tagMatch) {
    rawSec = tagMatch[1];
    rawMotivo = tagMatch[2];
    rawProdUnidad = tagMatch[3];
  } else {
    const legacyTagMatch = String(rawProdUnidad).match(/^\[(.*?)\]\s*(.*)$/);
    if (legacyTagMatch) {
      rawSec = legacyTagMatch[1];
      rawProdUnidad = legacyTagMatch[2];
    }
  }
  
  const sec = rawSec;
  let baseSection = 'Neonatología';
  let subServicio = sec;
  
  const enteralFloors = ['2°piso', '3°piso UCO', '4°piso', '5°piso', '6°piso', '7°piso', '8°piso', '2° piso UCI Y TIM', '3°er piso CORO', '4to piso', '5to piso', '6to piso', '7mo piso', '8vo piso'];
  const pediatricServices = ['Lactantes', 'II infancia', 'Cirugia', 'Timped', 'Uciped', 'Oncoped'];
  
  if (enteralFloors.includes(sec) || sec === 'Enterales') {
    baseSection = 'Enterales';
  } else if (pediatricServices.includes(sec) || sec === 'Pediatría') {
    baseSection = 'Pediatría';
  }
  
  const containerType = rawProdUnidad ? rawProdUnidad.split(' - ')[0] : '';
  const supplementName = (rawProdUnidad && rawProdUnidad.includes(' - ')) ? rawProdUnidad.split(' - ')[1] : '';
  
  const isLiquid = ['Mamaderas', 'Vasos con suplemento', 'Vasos con productos especiales', 'Jeringa BIC', 'Jeringa Gavage', 'Botellines', 'Jugos en caja'].includes(containerType) || containerType.includes('Jeringa');
  
  let equivQty = r.cantidad || 0;
  if (isLiquid) {
    const stdVolumes: Record<string, number> = {
      "Mamaderas": 100,
      "Vasos con suplemento": 200,
      "Vasos con productos especiales": 200,
      "Jeringa BIC": 50,
      "Jeringa Gavage": 50,
      "Jeringas": 50,
      "Botellines": 200,
      "Jugos en caja": 200
    };
    const stdVol = stdVolumes[containerType] || 100;
    equivQty = r.cantidad / stdVol;
  }

  return {
    baseSection,
    subServicio,
    cleanSeccion: rawSec,
    cleanMotivo: rawMotivo,
    cleanProductoUnidad: rawProdUnidad,
    containerType,
    supplementName,
    isLiquid,
    equivQty
  };
};

export type FormulaFormat = 'polvo_400g' | 'polvo_800g' | 'polvo_1kg' | 'botellin_200ml' | 'rth_1000ml' | 'rth_500ml';

export const FORMULA_FORMAT_DATA: Record<FormulaFormat, { label: string; ml: number; isPowder: boolean; defaultDil: number }> = {
  'polvo_400g': { label: 'Tarro Polvo 400g', ml: 2857, isPowder: true, defaultDil: 14 },
  'polvo_800g': { label: 'Tarro Polvo 800g', ml: 5714, isPowder: true, defaultDil: 14 },
  'polvo_1kg': { label: 'Bolsa/Tarro 1 kg', ml: 9000, isPowder: true, defaultDil: 11 },
  'botellin_200ml': { label: 'Botellín / Caja 200 ml', ml: 200, isPowder: false, defaultDil: 100 },
  'rth_1000ml': { label: 'Bolsa RTH 1.000 ml', ml: 1000, isPowder: false, defaultDil: 100 },
  'rth_500ml': { label: 'Bolsa RTH 500 ml', ml: 500, isPowder: false, defaultDil: 100 }
};

export const detectFormulaFormat = (name: string, unidad?: string): FormulaFormat => {
  const lower = (name || '').toLowerCase();
  const uLower = (unidad || '').toLowerCase();
  if (lower.includes('1000') || lower.includes('1 lt') || lower.includes('1lt') || lower.includes('rth 1000') || uLower.includes('1000ml')) return 'rth_1000ml';
  if (lower.includes('500') || lower.includes('rth 500') || uLower.includes('500ml')) return 'rth_500ml';
  if (lower.includes('800g') || lower.includes('800 g') || lower.includes('800') || uLower.includes('800g')) return 'polvo_800g';
  if (lower.includes('1kg') || lower.includes('1 kg') || lower.includes('1000g') || uLower.includes('1kg')) return 'polvo_1kg';
  if (lower.includes('botell') || lower.includes('200ml') || lower.includes('200 ml') || lower.includes('237') || lower.includes('tetra') || lower.includes('caja') || uLower.includes('botell')) return 'botellin_200ml';
  return 'polvo_400g';
};

export const calculateFormulaYieldMl = (pricing: { formato?: FormulaFormat; dilucion_pct?: number; ml_por_tarro?: number }) => {
  const fmtKey = (pricing.formato || 'polvo_400g') as FormulaFormat;
  const isPowder = fmtKey.startsWith('polvo');
  const dil = Number(pricing.dilucion_pct) || (fmtKey === 'polvo_1kg' ? 11 : 14);

  if (fmtKey === 'polvo_400g') {
    return Math.round(400 / (dil / 100));
  }
  if (fmtKey === 'polvo_800g') {
    return Math.round(800 / (dil / 100));
  }
  if (fmtKey === 'polvo_1kg') {
    return Math.round(1000 / (dil / 100));
  }
  if (fmtKey === 'rth_1000ml') return 1000;
  if (fmtKey === 'rth_500ml') return 500;
  if (fmtKey === 'botellin_200ml') return 200;
  return pricing.ml_por_tarro || 2857;
};

export interface FormulaPricing {
  precio_tarro: number;
  formato?: FormulaFormat;
  dilucion_pct?: number;
  ml_por_tarro?: number;
}

const getMermaCost = (r: any, formulaPricings: Record<string, FormulaPricing> | Record<string, any>) => {
  const parsed = parseMermaRecord(r);
  const formulaName = (parsed.supplementName || '').trim();
  const containerType = (parsed.containerType || '').trim();
  
  let pricing: { precio_tarro: number; ml_por_tarro?: number; formato?: FormulaFormat; dilucion_pct?: number } | undefined = undefined;
  
  if (formulaName) {
    if (formulaPricings[formulaName]) {
      const p = formulaPricings[formulaName];
      pricing = typeof p === 'number' ? { precio_tarro: p, ml_por_tarro: 2857, dilucion_pct: 14 } : p;
    } else {
      const matchKey = Object.keys(formulaPricings).find(k => 
        formulaName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(formulaName.toLowerCase())
      );
      if (matchKey) {
        const p = formulaPricings[matchKey];
        pricing = typeof p === 'number' ? { precio_tarro: p, ml_por_tarro: 2857, dilucion_pct: 14 } : p;
      }
    }
  }
  
  if (!pricing && containerType && formulaPricings[containerType]) {
    const p = formulaPricings[containerType];
    pricing = typeof p === 'number' ? { precio_tarro: p, ml_por_tarro: 2857, dilucion_pct: 14 } : p;
  }
  
  if (!pricing) {
    pricing = { precio_tarro: 8500, ml_por_tarro: 2857, formato: 'polvo_400g', dilucion_pct: 14 };
  }
  
  const totalMlYield = calculateFormulaYieldMl(pricing);
  
  const volMl = parsed.isLiquid ? (r.cantidad || 0) : ((r.cantidad || 0) * 100);
  const costPerMl = (pricing.precio_tarro || 0) / Math.max(1, totalMlYield);
  return Math.round(volMl * costPerMl);
};

export interface ScheduleDoseDetail {
  hour: string;
  doseGrams: number;
}

const parsePegPatientData = (item: any) => {
  const raw = item.paciente_cama || '';
  let cleanName = raw;
  let startHour = '06:00';
  let rawSchedules: string[] = ['06:00', '16:00', '18:00'];
  const defaultDose = Number(item.dosis_gramos_dia) || 0;
  
  const lastBracketIndex = raw.lastIndexOf(' [');
  if (lastBracketIndex !== -1 && raw.endsWith(']')) {
    cleanName = raw.substring(0, lastBracketIndex).trim();
    const bracketsContent = raw.substring(lastBracketIndex + 2, raw.length - 1);
    if (bracketsContent.includes(' | ')) {
      const parts = bracketsContent.split(' | ');
      startHour = parts[0].trim();
      rawSchedules = parts[1].split(',');
    } else {
      rawSchedules = bracketsContent.split(',');
    }
  }

  const scheduleDetails: ScheduleDoseDetail[] = [];
  const schedules: string[] = [];

  rawSchedules.forEach(s => {
    const trimmed = s.trim();
    if (!trimmed) return;
    if (trimmed.includes('@')) {
      const [h, dStr] = trimmed.split('@');
      const dVal = parseFloat(dStr);
      const doseGrams = isNaN(dVal) ? defaultDose : dVal;
      schedules.push(h.trim());
      scheduleDetails.push({ hour: h.trim(), doseGrams });
    } else {
      schedules.push(trimmed);
      scheduleDetails.push({ hour: trimmed, doseGrams: defaultDose });
    }
  });

  const hasCustomDoses = scheduleDetails.some(d => Math.abs(d.doseGrams - defaultDose) > 0.01);
  const totalDailyGrams = scheduleDetails.reduce((acc, d) => acc + d.doseGrams, 0);

  return {
    cleanName,
    startHour,
    schedules,
    scheduleDetails,
    hasCustomDoses,
    totalDailyGrams
  };
};

const calculateConsumedGrams = (item: any, isPaused: boolean = false) => {
  if (isPaused || item?.status === 'paused' || item?.status === 'sos' || Number(item?.dosis_gramos_dia) === 0) {
    return { consumedGrams: 0, dosesPassed: 0 };
  }
  
  const { startHour, scheduleDetails, totalDailyGrams } = parsePegPatientData(item);
  const startDateStr = item.fecha_inicio_uso;
  if (!startDateStr || !startHour || totalDailyGrams === 0) {
    return { consumedGrams: 0, dosesPassed: 0 };
  }

  const now = new Date();
  const startDateTime = new Date(`${startDateStr}T${startHour}:00`);
  if (now < startDateTime) return { consumedGrams: 0, dosesPassed: 0 };

  let consumedGrams = 0;
  let dosesPassed = 0;

  const tempDate = new Date(startDateTime);
  tempDate.setHours(0, 0, 0, 0);

  const endDateTime = new Date(now);

  while (tempDate <= endDateTime) {
    const yyyy = tempDate.getFullYear();
    const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
    const dd = String(tempDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    scheduleDetails.forEach(detail => {
      const cleanHour = detail.hour.trim();
      if (/^\d{2}:\d{2}$/.test(cleanHour)) {
        const schedDateTime = new Date(`${dateStr}T${cleanHour}:00`);
        // NON-RETROACTIVE: Only count doses that are >= startDateTime (and <= now) AND detail.doseGrams > 0
        if (schedDateTime >= startDateTime && schedDateTime <= endDateTime) {
          if (detail.doseGrams > 0) {
            consumedGrams += detail.doseGrams;
            dosesPassed++;
          }
        }
      }
    });
    tempDate.setDate(tempDate.getDate() + 1);
  }

  return { consumedGrams, dosesPassed };
};

const calculateAdministeredDoses = (startDateStr: string, startHourStr: string, schedules: string[], isPaused: boolean = false) => {
  if (isPaused) return 0;
  const dummyItem = { paciente_cama: `dummy [${startHourStr} | ${schedules.join(',')}]`, fecha_inicio_uso: startDateStr, dosis_gramos_dia: 1 };
  return calculateConsumedGrams(dummyItem, isPaused).dosesPassed;
};

const MOTIVO_COLORS: Record<string, string> = {
  'No se entrega': '#64748b',
  'Paciente no está': '#f97316',
  'Ya tiene producto': '#06b6d4',
  'Rechaza/no toma': '#8b5cf6',
  'Leche materna': '#ec4899',
  'Suspendido': '#ef4444',
  'R0 no informado': '#f59e0b',
  'En ayuno': '#eab308',
  'Aislamiento': '#6366f1',
  'Pab/Examen': '#3b82f6',
  'Trasladado': '#14b8a6',
  'Alta no informado': '#d97706',
  'Paciente grave': '#dc2626',
  'Fallecido': '#334155',
  'Otro': '#a855f7',
  'Acumulación': '#3b82f6',
  'Alta informada': '#10b981',
  'Deceso': '#dc2626',
  'Rechazo de suplemento': '#8b5cf6',
  'Devolución para reutilizar': '#10b981'
};

const getMotivoColor = (mot: string) => {
  if (MOTIVO_COLORS[mot]) return MOTIVO_COLORS[mot];
  if (mot && mot.startsWith('Otro')) return MOTIVO_COLORS['Otro'] || '#a855f7';
  let hash = 0;
  for (let i = 0; i < (mot || '').length; i++) hash = mot.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function App() {
  // --- Estados Principales ---
  const [items, setItems] = useState<StockItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_categories');
    return saved ? JSON.parse(saved) : [];
  });

  // Harvest categories from DB items to make them automatically available to everyone
  const defaultCategoriesList = ['Lácteos/Polvos', 'RTH (Enteral)', 'Espesantes/Módulos', 'Insumos', 'Suplementos Botellin'];
  const harvestedCategories = items.map(it => it.categoria).filter(Boolean);
  const allCategories = ['Todos', ...new Set([...defaultCategoriesList, ...harvestedCategories, ...customCategories])];
  const formCategories = allCategories.filter(cat => cat !== 'Todos');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'analytics' | 'workload'>('table');
  const [plannerDays, setPlannerDays] = useState(30);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // --- Estudio de Carga Laboral SEDILE-CEFE ---
  const [workloadRecords, setWorkloadRecords] = useState<WorkloadRecord[]>([]);
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [workloadStaffCount, setWorkloadStaffCount] = useState(2); // técnicos por turno
  const [workloadDaysLimit, setWorkloadDaysLimit] = useState(14); // días de estudio (7 a 14)
  const [showOriginalLog, setShowOriginalLog] = useState(false);
  const [newWorkload, setNewWorkload] = useState<Partial<WorkloadRecord>>({
    fecha: new Date().toISOString().split('T')[0],
    turno: 'Día',
    area: 'Consolidado',
    categoria: 'Operatividad y Dotación',
    producto_unidad: 'Resumen Turno',
    cantidad: 10,
    tiempo_total_min: 720,
    tiempo_extra_min: 0,
    observaciones: '',
    is_consolidado: true,
    dotacion_teorica: 10,
    dotacion_real: 10,
    motivos_ausencia: [],
    litros_lacteos: 0,
    litros_enterales: 0,
    pacientes_atendidos: 0,
    productos_entregados: 0,
    incidentes_detectados: []
  });

  // --- Registro de Mermas ---
  const [mermasRecords, setMermasRecords] = useState<MermaRecord[]>([]);
  const [loadingMermas, setLoadingMermas] = useState(false);
  const [newMerma, setNewMerma] = useState<Partial<MermaRecord>>({
    fecha: new Date().toLocaleDateString('en-CA'),
    seccion: '2°piso',
    motivo: 'No se entrega',
    producto_unidad: 'Mamaderas',
    cantidad: 0
  });

  const [mermaSuplemento, setMermaSuplemento] = useState<string>('');
  const [otroMotivoText, setOtroMotivoText] = useState<string>('');

  // --- Estados de Costos Financieros ---
  const [showMermasCostModal, setShowMermasCostModal] = useState(false);
  const [showMermasMonthModal, setShowMermasMonthModal] = useState(false);
  const [mermasCostTab, setMermasCostTab] = useState<'metricas' | 'precios'>('metricas');
  const [costAnalysisMonth, setCostAnalysisMonth] = useState<string>('all');
  const [expandedPriceSettings, setExpandedPriceSettings] = useState<Record<string, boolean>>({});
  const [priceCatalogCategory, setPriceCatalogCategory] = useState<string>('Todos');
  const [priceCatalogSearch, setPriceCatalogSearch] = useState<string>('');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // --- Estados de Entrega de PEG - Pediatría ---
  const [pegDeliveries, setPegDeliveries] = useState<PegDelivery[]>([]);
  const [loadingPeg, setLoadingPeg] = useState(false);
  const [showPegModal, setShowPegModal] = useState(false);
  const [showPegPinModal, setShowPegPinModal] = useState(false);
  const [pegPin, setPegPin] = useState('');
  const [editingPeg, setEditingPeg] = useState<PegDelivery | null>(null);
  const [showPegHelp, setShowPegHelp] = useState(false);
  
  // Pozo de excedentes de PEG calculado dinámicamente en tiempo real
  const pegSurplusPool = React.useMemo(() => {
    const sum = pegDeliveries.reduce((acc, item) => {
      if (item.status === 'discharged') {
        return acc + (item.leftover_sobres || 0);
      }
      return acc;
    }, 0);
    return Math.round(sum * 2) / 2;
  }, [pegDeliveries]);



  const [newPegForm, setNewPegForm] = useState<Omit<PegDelivery, 'id' | 'status'>>({
    paciente_cama: '',
    cantidad_entregada: 0,
    dosis_gramos_dia: 0,
    dosis_inicio_gramos: 0,
    fecha_entrega: new Date().toISOString().split('T')[0],
    fecha_inicio_uso: new Date().toISOString().split('T')[0],
    servicio: 'Lactantes'
  });

  const [selectedPegServiceFilter, setSelectedPegServiceFilter] = useState<string>('Todos');
  const [expandedPegHistDates, setExpandedPegHistDates] = useState<Record<string, boolean>>({});
  const [pegHistSearchQuery, setPegHistSearchQuery] = useState('');
  const [expandedPegHistMonths, setExpandedPegHistMonths] = useState<Record<string, boolean>>({});
  const [pegStartHour, setPegStartHour] = useState<string>('');
  const [pegSchedulesStr, setPegSchedulesStr] = useState<string>('');
  const [useCustomScheduleDoses, setUseCustomScheduleDoses] = useState<boolean>(false);
  const [customScheduleDoses, setCustomScheduleDoses] = useState<Record<string, number>>({});

  // --- Bitácora de Auditoría de Movimientos por Paciente ---
  const [pegAuditLogs, setPegAuditLogs] = useState<{
    id: string;
    delivery_id: string;
    fecha_hora: string;
    tipo: 'inicial' | 'recarga' | 'reg_cero' | 'sos' | 'activo' | 'edicion' | 'alta' | 'reactivacion';
    titulo: string;
    detalle: string;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('peg_audit_logs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedPegAuditPatient, setSelectedPegAuditPatient] = useState<PegDelivery | null>(null);
  const [showPegAuditModal, setShowPegAuditModal] = useState<boolean>(false);

  const addPegAuditLog = (deliveryId: string, tipo: 'inicial' | 'recarga' | 'reg_cero' | 'sos' | 'activo' | 'edicion' | 'alta' | 'reactivacion', titulo: string, detalle: string) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const fechaHoraStr = `${dd}/${mm}/${yyyy} - ${hh}:${min} hrs`;

    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      delivery_id: deliveryId,
      fecha_hora: fechaHoraStr,
      tipo,
      titulo,
      detalle
    };

    setPegAuditLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem('peg_audit_logs_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };



  const handleVerifyPegPin = () => {
    if (pegPin === '0000') {
      setShowPegPinModal(false);
      setPegPin('');
      setShowPegModal(true);
      showToast("Acceso de Pediatría autorizado", "success");
    } else {
      showToast("Clave incorrecta. Acceso denegado.", "error");
      setPegPin('');
    }
  };

  const fetchPegDeliveries = async (showLoading = true) => {
    if (showLoading) setLoadingPeg(true);
    let success = false;
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('peg_pediatria')
          .select('*')
          .order('fecha_entrega', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Filtrar el registro virtual especial de la lista de entregas
          const actualData = data.filter((r: any) => r.id !== '00000000-0000-0000-0000-000000000000' && r.paciente_cama !== 'SISTEMA_POZO_EXCEDENTES');

          const cacheStr = localStorage.getItem('peg_deliveries_cache');
          const localOnly = cacheStr ? JSON.parse(cacheStr).filter((r: any) => String(r.id).startsWith('local-') && r.paciente_cama !== 'SISTEMA_POZO_EXCEDENTES') : [];
          const merged = [...localOnly, ...actualData];
          setPegDeliveries(merged);
          localStorage.setItem('peg_deliveries_cache', JSON.stringify(merged));
          success = true;
        } else {
          console.error("Error al obtener PEG de Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al obtener PEG de Supabase:", err);
      }
    }

    if (!success) {
      const cache = localStorage.getItem('peg_deliveries_cache');
      if (cache) {
        const parsed = JSON.parse(cache).filter((r: any) => r.id !== '00000000-0000-0000-0000-000000000000' && r.paciente_cama !== 'SISTEMA_POZO_EXCEDENTES');
        setPegDeliveries(parsed);
      }
    }
    if (showLoading) setLoadingPeg(false);
  };

  const handleAddPegDelivery = async (recordToAdd: Omit<PegDelivery, 'id' | 'status'>) => {
    setLoadingPeg(true);
    let success = false;
    const tempId = 'local-' + Date.now();
    const fullRecord = { ...recordToAdd, status: 'active' as const };

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('peg_pediatria')
          .insert([fullRecord])
          .select();

        if (!error && data && data.length > 0) {
          showToast("Entrega de PEG registrada con éxito", "success");
          success = true;
        } else {
          console.error("Error al guardar PEG en Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al guardar PEG en Supabase:", err);
      }
    }

    if (!success) {
      const recordWithId = { ...fullRecord, id: tempId, created_at: new Date().toISOString() } as PegDelivery;
      const updatedList = [recordWithId, ...pegDeliveries];
      setPegDeliveries(updatedList);
      localStorage.setItem('peg_deliveries_cache', JSON.stringify(updatedList));
      showToast("Entrega de PEG guardada localmente (Offline)", "success");
    } else {
      await fetchPegDeliveries(false);
    }

    setLoadingPeg(false);
    return true;
  };

  const handleUpdatePegDelivery = async (recordToUpdate: PegDelivery) => {
    setLoadingPeg(true);
    let success = false;

    if (isConfigured && !recordToUpdate.id.startsWith('local-')) {
      try {
        const { id, ...supabaseData } = recordToUpdate;
        const { error } = await supabase
          .from('peg_pediatria')
          .update(supabaseData)
          .eq('id', id);

        if (!error) {
          showToast("Entrega de PEG actualizada con éxito", "success");
          success = true;
        } else {
          console.error("Error al actualizar PEG en Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al actualizar PEG en Supabase:", err);
      }
    }

    if (!success) {
      const updatedList = pegDeliveries.map(r => r.id === recordToUpdate.id ? recordToUpdate : r);
      setPegDeliveries(updatedList);
      localStorage.setItem('peg_deliveries_cache', JSON.stringify(updatedList));
      showToast("Entrega de PEG actualizada localmente (Offline)", "success");
    } else {
      await fetchPegDeliveries(false);
    }
    setLoadingPeg(false);
  };

  const handleDeletePegDelivery = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro de entrega de PEG?")) return;

    setLoadingPeg(true);
    let success = false;

    if (isConfigured && !id.startsWith('local-')) {
      try {
        const { error } = await supabase
          .from('peg_pediatria')
          .delete()
          .eq('id', id);

        if (!error) {
          showToast("Entrega de PEG eliminada con éxito", "success");
          success = true;
        } else {
          console.error("Error al eliminar PEG en Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al eliminar PEG en Supabase:", err);
      }
    }

    if (!success) {
      const updatedList = pegDeliveries.filter(r => r.id !== id);
      setPegDeliveries(updatedList);
      localStorage.setItem('peg_deliveries_cache', JSON.stringify(updatedList));
      showToast("Entrega de PEG eliminada localmente", "success");
    } else {
      await fetchPegDeliveries(false);
    }
    setLoadingPeg(false);
  };

  const handleQuickAddSobres = async (item: PegDelivery) => {
    const parsed = parsePegPatientData(item);
    const input = window.prompt("¿Cuántos sobres nuevos de PEG deseas entregar al paciente " + parsed.cleanName + "?\n\n(Se sumarán a su stock disponible a partir de este momento)");
    if (input === null) return;
    
    const qty = parseFloat(input);
    if (isNaN(qty) || qty <= 0) {
      showToast("Por favor, ingrese un número válido mayor a 0.", "error");
      return;
    }

    setLoadingPeg(true);
    
    const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || Number(item.dosis_gramos_dia) === 0;
    const { consumedGrams, dosesPassed } = calculateConsumedGrams(item, isPausedOrSos);
    const totalGrams = item.cantidad_entregada * 17;
    const remainingGrams = Math.max(0, totalGrams - consumedGrams);
    const remainingSobres = Math.round((remainingGrams / 17) * 2) / 2;
    
    const newTotalSobres = Number((remainingSobres + qty).toFixed(1));
    const now = new Date();
    const hourStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    // Preservar tomas pasadas acumuladas y horarios diferenciados
    const customSchedulesCombined = parsed.scheduleDetails.map(d => `${d.hour}@${d.doseGrams}`).join(',');
    const schedulesToSave = parsed.hasCustomDoses ? customSchedulesCombined : parsed.schedules.join(',');
    const combinedPacienteCama = `${parsed.cleanName} [${hourStr} | ${schedulesToSave}${dosesPassed > 0 ? ` #${dosesPassed}` : ''}]`;

    const updatedRecord: PegDelivery = {
      ...item,
      paciente_cama: combinedPacienteCama,
      cantidad_entregada: newTotalSobres,
      fecha_inicio_uso: now.toISOString().split('T')[0],
      fecha_entrega: now.toISOString().split('T')[0],
      status: item.status === 'discharged' ? 'active' : item.status,
      discharge_date: null as any,
      leftover_sobres: null as any
    };

    await handleUpdatePegDelivery(updatedRecord);
    addPegAuditLog(
      item.id,
      'recarga',
      'Recarga Rápida de Sobres (➕ PEG)',
      `Se entregaron +${qty} sobres nuevos. Stock disponible resultante: ${newTotalSobres} sobres (Tomas acumuladas preservadas: ${dosesPassed} tomas).`
    );
    showToast("Se agregaron " + qty + " sobres con éxito. Stock disponible: " + newTotalSobres + " sobres.", "success");
  };

  const handleDischargePegPatient = async (item: PegDelivery, remainingSobres: number) => {
    const roundedLeftovers = Math.round(remainingSobres * 2) / 2;
    if (!window.confirm("¿Está seguro de dar de alta a este paciente? Se sumarán " + roundedLeftovers.toFixed(1) + " sobres al pozo de excedentes.")) return;

    setLoadingPeg(true);
    
    const updatedRecord: PegDelivery = {
      ...item,
      status: 'discharged',
      leftover_sobres: roundedLeftovers,
      discharge_date: new Date().toISOString().split('T')[0]
    };

    await handleUpdatePegDelivery(updatedRecord);
    addPegAuditLog(
      item.id,
      'alta',
      'Alta Médica del Paciente',
      `Alta registrada en sistema. Se calcularon y devolvieron ${roundedLeftovers.toFixed(1)} sobres sobrantes al pozo de excedentes de bodega.`
    );
  };

  const handleReactivatePegPatient = async (item: PegDelivery) => {
    const parsed = parsePegPatientData(item);
    const defaultQty = (item.leftover_sobres && item.leftover_sobres > 0) ? item.leftover_sobres : 1;
    const inputStr = window.prompt(
      `Reactivar a ${parsed.cleanName}.\nIngrese la cantidad de sobres a entregar para esta nueva estadía (o presione Aceptar para usar ${defaultQty} sobres):`,
      String(defaultQty)
    );
    
    if (inputStr === null) return;
    
    const qty = parseFloat(inputStr);
    if (isNaN(qty) || qty <= 0) {
      showToast("Por favor ingrese una cantidad de sobres válida.", "error");
      return;
    }

    setLoadingPeg(true);
    const now = new Date();
    const hourStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const customSchedulesCombined = parsed.scheduleDetails.map(d => `${d.hour}@${d.doseGrams}`).join(',');
    const schedulesToSave = parsed.hasCustomDoses ? customSchedulesCombined : parsed.schedules.join(',');
    const combinedPacienteCama = `${parsed.cleanName} [${hourStr} | ${schedulesToSave}]`;

    const updatedRecord: PegDelivery = {
      ...item,
      status: 'active',
      paciente_cama: combinedPacienteCama,
      cantidad_entregada: qty,
      fecha_inicio_uso: now.toISOString().split('T')[0],
      fecha_entrega: now.toISOString().split('T')[0],
      leftover_sobres: null as any,
      discharge_date: null as any
    };

    await handleUpdatePegDelivery(updatedRecord);
    addPegAuditLog(
      item.id,
      'reactivacion',
      'Reactivación de Paciente',
      `Paciente reactivado desde el historial de altas con ${qty} sobres entregados para su nueva estadía hospitalaria.`
    );
    showToast(`Paciente ${parsed.cleanName} reactivado con éxito (${qty} sobres).`, "success");
  };

  const handlePausePegPatient = async (item: PegDelivery, remainingSobres: number) => {
    if (!window.confirm("¿Deseas colocar a este paciente en Régimen Cero (Reg Cero)? Se pausará el descuento automático de stock con " + remainingSobres.toFixed(1) + " sobres restantes.")) return;
    
    setLoadingPeg(true);
    const parsed = parsePegPatientData(item);
    const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || Number(item.dosis_gramos_dia) === 0;
    const { dosesPassed } = calculateConsumedGrams(item, isPausedOrSos);
    const now = new Date();
    const hourStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const combinedPacienteCama = `${parsed.cleanName} [${hourStr} | ${parsed.schedules.join(',')} #${dosesPassed}]`;

    const updatedRecord: PegDelivery = {
      ...item,
      status: 'paused',
      paciente_cama: combinedPacienteCama,
      cantidad_entregada: Number(remainingSobres.toFixed(1)),
      fecha_inicio_uso: now.toISOString().split('T')[0]
    };
    
    await handleUpdatePegDelivery(updatedRecord);
    addPegAuditLog(
      item.id,
      'reg_cero',
      'Pausado a Régimen Cero',
      `El paciente entró en Régimen Cero. Conteo automático pausado con ${remainingSobres.toFixed(1)} sobres restantes (${dosesPassed} tomas administradas acumuladas).`
    );
  };

  const handleSosPegPatient = async (item: PegDelivery, remainingSobres: number) => {
    if (!window.confirm("¿Deseas cambiar a este paciente a modalidad SOS (A Pedido)? No se descontará stock automáticamente por horario.")) return;
    
    setLoadingPeg(true);
    const parsed = parsePegPatientData(item);
    const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || Number(item.dosis_gramos_dia) === 0;
    const { dosesPassed } = calculateConsumedGrams(item, isPausedOrSos);
    const now = new Date();
    const hourStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const combinedPacienteCama = `${parsed.cleanName} [${hourStr} | ${parsed.schedules.join(',')} #${dosesPassed}]`;

    const updatedRecord: PegDelivery = {
      ...item,
      status: 'sos',
      paciente_cama: combinedPacienteCama,
      cantidad_entregada: Number(remainingSobres.toFixed(1)),
      fecha_inicio_uso: now.toISOString().split('T')[0]
    };
    
    await handleUpdatePegDelivery(updatedRecord);
    addPegAuditLog(
      item.id,
      'sos',
      'Modalidad SOS (A Pedido)',
      `Cambiado a modalidad SOS / A Pedido. Conteo automático por horario pausado con ${remainingSobres.toFixed(1)} sobres restantes.`
    );
  };

  const handleResumePegPatient = async (item: PegDelivery) => {
    if (!window.confirm("¿Deseas reactivar la alimentación de este paciente (Realimentar / Activo)? El descuento de stock se reanudará desde este momento.")) return;
    
    setLoadingPeg(true);
    const now = new Date();
    const hourStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    const parsed = parsePegPatientData(item);
    const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || Number(item.dosis_gramos_dia) === 0;
    const { dosesPassed } = calculateConsumedGrams(item, isPausedOrSos);
    const combinedPacienteCama = `${parsed.cleanName} [${hourStr} | ${parsed.schedules.join(',')} #${dosesPassed}]`;
    
    const updatedRecord: PegDelivery = {
      ...item,
      status: 'active',
      paciente_cama: combinedPacienteCama,
      fecha_inicio_uso: now.toISOString().split('T')[0]
    };
    
    await handleUpdatePegDelivery(updatedRecord);
    addPegAuditLog(
      item.id,
      'activo',
      'Realimentar / Conteo Activo',
      `Alimentación reanudada a las ${hourStr} hrs. Se reanuda el descuento de stock con ${item.cantidad_entregada} sobres disponibles.`
    );
  };

  useEffect(() => {
    if (mermasRecords.length === 0) return;
    const sorted = [...mermasRecords].sort((a, b) => b.fecha.localeCompare(a.fecha));
    const latestDate = sorted[0].fecha;
    const latestMonth = getMonthYearKey(latestDate);

    setExpandedMonths(prev => {
      if (Object.keys(prev).length > 0) return prev;
      return { [latestMonth]: true };
    });

    setExpandedDates(prev => {
      if (Object.keys(prev).length > 0) return prev;
      return { [latestDate]: true };
    });
  }, [mermasRecords]);
  
  // Costo y rendimiento por fórmula láctea / suplemento
  const [formulaPricings, setFormulaPricings] = useState<Record<string, FormulaPricing>>(() => {
    const saved = localStorage.getItem('formula_pricings_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      "Neocate": { precio_tarro: 55000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Puramino": { precio_tarro: 38000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Alfamino": { precio_tarro: 42000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Frebini": { precio_tarro: 14000, formato: 'rth_1000ml', ml_por_tarro: 1000 },
      "Nan Optipro": { precio_tarro: 8900, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Ensure": { precio_tarro: 14500, formato: 'polvo_800g', ml_por_tarro: 5714 },
      "Nutren Junior": { precio_tarro: 15000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Pediasure": { precio_tarro: 16000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Alprem": { precio_tarro: 9500, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Similac": { precio_tarro: 9000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Leche Purita": { precio_tarro: 3200, formato: 'polvo_1kg', ml_por_tarro: 9000 },
      "Botellines": { precio_tarro: 2500, formato: 'botellin_200ml', ml_por_tarro: 200 },
      "Jugos en caja": { precio_tarro: 800, formato: 'botellin_200ml', ml_por_tarro: 200 },
      "Mamaderas (Genérico)": { precio_tarro: 8000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Vasos con suplemento (Genérico)": { precio_tarro: 12000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Vasos con productos especiales (Genérico)": { precio_tarro: 25000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Jeringa BIC (Genérico)": { precio_tarro: 8000, formato: 'polvo_400g', ml_por_tarro: 2857 },
      "Jeringa Gavage (Genérico)": { precio_tarro: 8000, formato: 'polvo_400g', ml_por_tarro: 2857 }
    };
  });

  const [formulaSearchTerm, setFormulaSearchTerm] = useState('');
  const [newFormulaInput, setNewFormulaInput] = useState('');

  // Precios de tarros (inventario)
  const [productPrices, setProductPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('product_prices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Sincronizar precios de fórmulas con la nube (config_sedile) para que coincidan en todos los dispositivos
  const fetchFormulaPricingsCloud = async () => {
    if (!isConfigured) return;
    try {
      const { data, error } = await supabase
        .from('config_sedile')
        .select('value')
        .eq('key', 'formula_pricings_v2')
        .maybeSingle();

      if (!error && data?.value && Object.keys(data.value).length > 0) {
        setFormulaPricings(data.value);
        localStorage.setItem('formula_pricings_v2', JSON.stringify(data.value));
      }
    } catch (err) {
      // Fallback silencioso si la tabla aún no existe
    }
  };

  // Guardar en localStorage y en Supabase al cambiar
  useEffect(() => {
    localStorage.setItem('formula_pricings_v2', JSON.stringify(formulaPricings));
    if (isConfigured) {
      supabase
        .from('config_sedile')
        .upsert({ key: 'formula_pricings_v2', value: formulaPricings, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn("Aviso al sincronizar config_sedile en Supabase:", error.message);
        });
    }
  }, [formulaPricings]);

  useEffect(() => {
    localStorage.setItem('product_prices', JSON.stringify(productPrices));
  }, [productPrices]);

  // --- Meses disponibles con estadísticas para reportes de mermas ---
  const availableMermasMonths = useMemo(() => {
    const groups: Record<string, {
      monthKey: string;
      firstDate: string;
      recordCount: number;
      mermasQty: number;
      mermasCost: number;
    }> = {};

    mermasRecords.forEach(r => {
      const mKey = getMonthYearKey(r.fecha);
      if (!groups[mKey]) {
        groups[mKey] = {
          monthKey: mKey,
          firstDate: r.fecha || '',
          recordCount: 0,
          mermasQty: 0,
          mermasCost: 0,
        };
      }
      if (r.fecha && r.fecha > groups[mKey].firstDate) {
        groups[mKey].firstDate = r.fecha;
      }
      groups[mKey].recordCount += 1;
      if (r.motivo !== 'Devolución para reutilizar') {
        const parsed = parseMermaRecord(r);
        groups[mKey].mermasQty += parsed.isLiquid ? 0 : (r.cantidad || 0);
        groups[mKey].mermasCost += getMermaCost(r, formulaPricings);
      }
    });

    return Object.values(groups).sort((a, b) => b.firstDate.localeCompare(a.firstDate));
  }, [mermasRecords, formulaPricings]);

  // --- Estado Gráfico Estadísticas Admin ---
  const [statsChartType, setStatsChartType] = useState<'consumo' | 'autonomia' | 'stock'>('consumo');
  const [statsViewMode, setStatsViewMode] = useState<'chart' | 'list'>('chart');
  const [showStockInfoCloud, setShowStockInfoCloud] = useState(false);

  // --- Filtros y Búsqueda ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Todos']);
  const [filterCritical, setFilterCritical] = useState(false); // disponibilidad < 7 días
  const [filterOutOfStock, setFilterOutOfStock] = useState(false); // ver solo stock en 0
  const [stockRiskFilter, setStockRiskFilter] = useState<'all' | 'out_of_stock' | 'critical' | 'warning'>('all'); // filtro rápido interactivo por nivel de riesgo
  const [showHidden, setShowHidden] = useState(false); // Para mostrar/ocultar productos ocultos en vista admin
  const [sortByLicitacion, setSortByLicitacion] = useState(false); // ordenar por licitación/contrato
  
  // --- Historial ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<StockHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // --- Borradores de Cambios Pendientes ---
  const [pendingChanges, setPendingChanges] = useState<Record<string, { stock_sedile?: number | ''; uso_diario?: number | ''; stock_bodega_leches?: number | '' }>>({});

  // --- Visibilidad de Columnas ---
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('stock_sedile_columns_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      codigo: true,
      licitacion_contrato: true,
      factor_empaque: true,
      ubicacion: true,
      area: true,
      nombre: true,
      unidad: true,
      categoria: true,
      stock_sedile: true,
      uso_diario: true,
      stock_bodega_leches: true,
      stock_total: true,
      disp_sedile: true,
      disp_hospital: true
    };
  });

  useEffect(() => {
    localStorage.setItem('stock_sedile_columns_v2', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // --- Estado DB Conexión ---
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // --- Nuevo Producto Form (Inline & Floating) ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<StockItem>>({
    codigo: '',
    nombre: '',
    unidad: 'Tarro',
    stock_sedile: 0,
    uso_diario: 0,
    stock_bodega_leches: 0,
    stock_total: 0,
    categoria: 'Lácteos/Polvos',
    factor_empaque: '',
    licitacion_contrato: '',
    ubicacion: '',
    area: 'clinica'
  });

  // --- Edición Masiva (Global) ---
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const [globalEdits, setGlobalEdits] = useState<Record<string, Partial<StockItem>>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Cerrar menú interactivo al hacer clic fuera de él
  useEffect(() => {
    if (activeMenuId === null) return;
    
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setActiveMenuId(null);
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeMenuId]);

  // --- Toasts (Alertas del sistema) ---
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  // --- Inicialización y Carga de Datos ---
  useEffect(() => {
    fetchStockData();
    fetchHistory();
    fetchWorkloadRecords();
    fetchMermasRecords();
    fetchPegDeliveries();
    fetchFormulaPricingsCloud();
    checkAdminSession();
    
    // Configurar suscripción Supabase Realtime si está configurado
    if (isConfigured) {
      console.log("Configurando suscripción Supabase Realtime...");
      const channel = supabase
        .channel('realtime:stock_sedile')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stock_sedile' },
          (payload) => {
            console.log('Cambio detectado en tiempo real:', payload);
            fetchStockData(false); // refresh sin loading spinner para no interrumpir
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'carga_laboral_sedile' },
          (payload) => {
            console.log('Cambio detectado en tiempo real (carga laboral):', payload);
            fetchWorkloadRecords(false); // refresh silencioso
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mermas_sedile' },
          (payload) => {
            console.log('Cambio detectado en tiempo real (mermas):', payload);
            fetchMermasRecords(false); // refresh silencioso
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'peg_pediatria' },
          (payload) => {
            console.log('Cambio detectado en tiempo real (PEG Pediatría):', payload);
            fetchPegDeliveries(false); // refresh silencioso
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'config_sedile' },
          (payload) => {
            console.log('Cambio detectado en tiempo real (configuración):', payload);
            fetchFormulaPricingsCloud();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);
  // Prevenir scroll del body en el fondo cuando el modal de PEG está abierto
  useEffect(() => {
    if (showPegModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPegModal]);

  // Verificar si hay sesión de administrador guardada
  const checkAdminSession = () => {
    const adminSession = localStorage.getItem('stock_sedile_admin');
    if (adminSession === 'true') {
      setIsAdmin(true);
    }
  };

  // Fetch de Datos
  const fetchStockData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    let success = false;
    
    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('stock_sedile')
          .select('*')
          .order('categoria', { ascending: true })
          .order('nombre', { ascending: true });
          
        if (!error && data) {
          // Si la tabla está vacía, inicializarla con la caché o los productos por defecto
          if (data.length === 0) {
            console.log("Base de datos vacía, intentando poblar desde caché o por defecto...");
            const populateSuccess = await populateDefaultDatabase();
            if (!populateSuccess) {
              // Si falla la población (ej: por permisos), al menos mostramos la caché local
              setIsDbConnected(false);
              const cache = localStorage.getItem('stock_sedile_cache');
              if (cache) {
                setItems(JSON.parse(cache));
              } else {
                setItems(DEFAULT_PRODUCTS);
              }
            }
            success = true;
          } else {
            const formatted = data.map(d => {
              const stockSedile = Number(d.stock_sedile) || 0;
              const stockBodega = Number(d.stock_bodega_leches) || 0;
              return {
                id: d.id,
                codigo: d.codigo || '',
                nombre: d.nombre,
                unidad: d.unidad || '',
                stock_sedile: stockSedile,
                uso_diario: Number(d.uso_diario) || 0,
                stock_bodega_leches: stockBodega,
                stock_total: stockSedile + stockBodega, // sum dynamically
                categoria: d.categoria || 'Lácteos/Polvos',
                factor_empaque: d.factor_empaque || '',
                licitacion_contrato: d.licitacion_contrato || '',
                ubicacion: d.ubicacion || '',
                area: d.area || 'clinica',
                oculto: !!d.oculto,
                updated_at: d.updated_at
              };
            });
            setItems(formatted);
            localStorage.setItem('stock_sedile_cache', JSON.stringify(formatted));
            setIsDbConnected(true);
            success = true;
            fetchHistory(false); // silent update
          }
        } else {
          console.error("Error cargando de Supabase, usando cache:", error);
        }
      } catch (err) {
        console.error("Error de conexión, usando cache:", err);
      }
    }

    if (!success) {
      // Fallback a LocalStorage o por defecto
      setIsDbConnected(false);
      const cache = localStorage.getItem('stock_sedile_cache');
      if (cache) {
        setItems(JSON.parse(cache));
      } else {
        setItems(DEFAULT_PRODUCTS);
        localStorage.setItem('stock_sedile_cache', JSON.stringify(DEFAULT_PRODUCTS));
      }
    }
    
    if (showLoading) setLoading(false);
  };

  // Inicializar DB con datos por defecto o caché
  const populateDefaultDatabase = async (): Promise<boolean> => {
    try {
      const cache = localStorage.getItem('stock_sedile_cache');
      let productsToInsert = DEFAULT_PRODUCTS;
      
      if (cache) {
        const parsedCache = JSON.parse(cache);
        if (parsedCache && parsedCache.length > 0) {
           productsToInsert = parsedCache;
        }
      }

      // Remover el id local para que Supabase genere UUIDs
      const formattedForInsert = productsToInsert.map(({ id, ...rest }) => rest);
      const { error } = await supabase
        .from('stock_sedile')
        .insert(formattedForInsert);
        
      if (!error) {
        console.log("Datos iniciales insertados con éxito en la nube");
        fetchStockData(false);
        return true;
      } else {
        console.error("Error insertando datos (posible RLS):", error);
        return false;
      }
    } catch (err) {
      console.error("Error populate:", err);
      return false;
    }
  };

  // --- Acciones de Administrador ---

  // Login de Administrador con PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '2026') {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
      localStorage.setItem('stock_sedile_admin', 'true');
      showToast("Modo Administrador activado con éxito", "success");
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Cierre de Sesión
  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('stock_sedile_admin');
    showToast("Sesión cerrada. Modo público reactivado", "success");
    setEditingId(null);
  };

  // Modificar borradores en memoria (Draft Flow)
  const handleInlineChange = (id: string, field: 'stock_sedile' | 'uso_diario' | 'stock_bodega_leches', val: number | '') => {
    const originalItem = items.find(item => item.id === id);
    if (!originalItem) return;
    
    const numVal = val === '' ? '' : Math.max(0, val || 0);
    
    setPendingChanges(prev => {
      const current = prev[id] || {};
      const updated = { ...current, [field]: numVal };
      
      const isSedileUnchanged = updated.stock_sedile === undefined || updated.stock_sedile === originalItem.stock_sedile;
      const isUsoUnchanged = updated.uso_diario === undefined || updated.uso_diario === originalItem.uso_diario;
      const isBodegaUnchanged = updated.stock_bodega_leches === undefined || updated.stock_bodega_leches === (originalItem.stock_bodega_leches || 0);
      
      const newPending = { ...prev };
      
      if (isSedileUnchanged && isUsoUnchanged && isBodegaUnchanged) {
        delete newPending[id];
      } else {
        newPending[id] = updated;
      }
      
      return newPending;
    });
  };

  // Guardar Cambios en Lote (Confirmar Actualización de Stock)
  const commitPendingChanges = async () => {
    setSyncing(true);
    let successCount = 0;
    const failures: string[] = [];
    
    let updatedList = [...items];
    const entries = Object.entries(pendingChanges);
    
    for (const [id, changes] of entries) {
      const originalItem = items.find(item => item.id === id);
      if (!originalItem) continue;
      
      const newSedile = changes.stock_sedile !== undefined 
        ? (changes.stock_sedile === '' ? 0 : Number(changes.stock_sedile)) 
        : originalItem.stock_sedile;
      const newBodega = changes.stock_bodega_leches !== undefined 
        ? (changes.stock_bodega_leches === '' ? 0 : Number(changes.stock_bodega_leches)) 
        : (originalItem.stock_bodega_leches || 0);
      const newUso = changes.uso_diario !== undefined 
        ? (changes.uso_diario === '' ? 0 : Number(changes.uso_diario)) 
        : originalItem.uso_diario;
      const newTotal = newSedile + newBodega;
      
      let success = false;
      
      if (isConfigured && !id.startsWith('local-')) {
        try {
          const { error } = await supabase
            .from('stock_sedile')
            .update({
              stock_sedile: newSedile,
              stock_bodega_leches: newBodega,
              uso_diario: newUso,
              stock_total: newTotal
            })
            .eq('id', id);
            
          if (!error) {
            success = true;
            successCount++;
          } else {
            console.error(`Error en DB al guardar ${id}:`, error);
            failures.push(originalItem.nombre);
          }
        } catch (err) {
          console.error(`Excepción al guardar ${id}:`, err);
          failures.push(originalItem.nombre);
        }
      }
      
      if (!success) {
        updatedList = updatedList.map(item => 
          item.id === id 
            ? { 
                ...item, 
                stock_sedile: newSedile, 
                stock_bodega_leches: newBodega, 
                uso_diario: newUso,
                stock_total: newTotal
              } 
            : item
        );
      }
    }
    
    if (failures.length === 0) {
      showToast(`¡Se actualizaron ${successCount} productos con éxito!`, "success");
      setPendingChanges({});
      if (!isConfigured) {
        setItems(updatedList);
        localStorage.setItem('stock_sedile_cache', JSON.stringify(updatedList));
      } else {
        await fetchStockData(false);
      }
    } else {
      showToast(`Actualizado parcialmente. Falló en: ${failures.join(', ')}`, "error");
      setPendingChanges(prev => {
        const next = { ...prev };
        entries.forEach(([id]) => {
          const originalItem = items.find(item => item.id === id);
          if (originalItem && !failures.includes(originalItem.nombre)) {
            delete next[id];
          }
        });
        return next;
      });
      if (!isConfigured) {
        setItems(updatedList);
        localStorage.setItem('stock_sedile_cache', JSON.stringify(updatedList));
      } else {
        await fetchStockData(false);
      }
    }
    
    setSyncing(false);
  };

  // Agregar Producto
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.nombre) {
      showToast("El nombre del producto es obligatorio", "error");
      return;
    }

    setSyncing(true);
    const stockSedile = Number(newItem.stock_sedile) || 0;
    const stockBodega = Number(newItem.stock_bodega_leches) || 0;
    const itemToAdd: StockItem = {
      id: isConfigured ? '' : 'local-' + Date.now(),
      codigo: newItem.codigo || 'GEN-' + Math.floor(100 + Math.random() * 900),
      nombre: newItem.nombre,
      unidad: newItem.unidad || 'Tarro',
      stock_sedile: stockSedile,
      uso_diario: Number(newItem.uso_diario) || 0,
      stock_bodega_leches: stockBodega,
      stock_total: stockSedile + stockBodega, // dynamic sum
      categoria: newItem.categoria || 'Lácteos/Polvos',
      factor_empaque: newItem.factor_empaque || '',
      area: newItem.area || 'clinica',
      oculto: false
    };

    let success = false;
    
    if (isConfigured) {
      try {
        const { id, ...supabaseData } = itemToAdd;
        const { data, error } = await supabase
          .from('stock_sedile')
          .insert([supabaseData])
          .select();

        if (!error && data) {
          showToast("Producto agregado a la nube con éxito", "success");
          success = true;
        } else {
          console.error("Error insertando:", error);
        }
      } catch (err) {
        console.error("Excepción insertando:", err);
      }
    }

    if (!success) {
      // Local addition
      const updatedList = [itemToAdd, ...items];
      setItems(updatedList);
      localStorage.setItem('stock_sedile_cache', JSON.stringify(updatedList));
      showToast("Producto agregado localmente (Modo Offline)", "success");
    }

    setShowAddForm(false);
    setNewItem({
      codigo: '',
      nombre: '',
      unidad: 'Tarro',
      stock_sedile: 0,
      uso_diario: 0,
      stock_bodega_leches: 0,
      stock_total: 0,
      categoria: 'Lácteos/Polvos',
      factor_empaque: '',
      area: 'clinica'
    });
    setSyncing(false);
    fetchStockData(false);
  };

  // Eliminar Producto
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Â¿Está seguro de que desea eliminar este producto del stock?")) return;
    
    setSyncing(true);
    let success = false;

    if (isConfigured && !id.startsWith('local-')) {
      try {
        const { error } = await supabase
          .from('stock_sedile')
          .delete()
          .eq('id', id);

        if (!error) {
          showToast("Producto eliminado de la base de datos", "success");
          success = true;
        } else {
          console.error("Error al eliminar:", error);
        }
      } catch (err) {
        console.error("Excepción al eliminar:", err);
      }
    }

    if (!success) {
      const updatedList = items.filter(item => item.id !== id);
      setItems(updatedList);
      localStorage.setItem('stock_sedile_cache', JSON.stringify(updatedList));
      showToast("Producto eliminado localmente (Modo Offline)", "success");
    }

    setSyncing(false);
    fetchStockData(false);
  };

  // Guardar Datos Masivos
  const saveGlobalEdits = async () => {
    if (Object.keys(globalEdits).length === 0) {
      setIsGlobalEditMode(false);
      return;
    }
    setSyncing(true);
    let updatedList = [...items];
    const updates = [];

    // Actualización optimista local
    for (const [id, changes] of Object.entries(globalEdits)) {
      const originalIndex = updatedList.findIndex(item => item.id === id);
      if (originalIndex !== -1) {
        updatedList[originalIndex] = { ...updatedList[originalIndex], ...changes };
        // preparar para supabase
        const it = updatedList[originalIndex];
        updates.push({
          id: it.id,
          codigo: it.codigo,
          nombre: it.nombre,
          unidad: it.unidad,
          stock_sedile: it.stock_sedile,
          stock_bodega_leches: it.stock_bodega_leches,
          uso_diario: it.uso_diario,
          stock_total: it.stock_total,
          categoria: it.categoria,
          factor_empaque: it.factor_empaque || '',
          licitacion_contrato: it.licitacion_contrato || '',
          ubicacion: it.ubicacion || '',
          area: it.area || 'clinica'
        });
      }
    }

    setItems(updatedList);
    setGlobalEdits({});
    setIsGlobalEditMode(false);

    if (isConfigured) {
      try {
        const { error } = await supabase.from('stock_sedile').upsert(updates);
        if (!error) {
          showToast("Datos actualizados correctamente", "success");
        } else {
          console.error("Error guardando edición masiva:", error);
          showToast("Error al guardar datos masivos", "error");
          fetchStockData(false);
        }
      } catch (err) {
        console.error("Excepción en guardado masivo:", err);
        fetchStockData(false);
      }
    } else {
      localStorage.setItem('stock_sedile_cache', JSON.stringify(updatedList));
      showToast("Datos guardados localmente", "success");
    }
    setSyncing(false);
  };

  // Helper para manejar cambios en la cuadrícula global
  const handleGlobalEdit = (id: string, field: string, value: string) => {
    setGlobalEdits(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  // Cambiar visibilidad (Ocultar / Mostrar producto)
  const toggleVisibility = async (id: string, currentOculto: boolean | undefined) => {
    setSyncing(true);
    const newOculto = !currentOculto;
    let success = false;

    if (isConfigured && !id.startsWith('local-')) {
      try {
        const { error } = await supabase
          .from('stock_sedile')
          .update({
            oculto: newOculto
          })
          .eq('id', id);

        if (!error) {
          showToast(newOculto ? "Producto ocultado con éxito" : "Producto mostrado con éxito", "success");
          success = true;
        } else {
          console.error("Error al cambiar visibilidad en DB:", error);
        }
      } catch (err) {
        console.error("Excepción al cambiar visibilidad en DB:", err);
      }
    }

    if (!success) {
      // Si falla o está offline, actualizamos localmente
      const updatedList = items.map(item => 
        item.id === id ? { ...item, oculto: newOculto } : item
      );
      setItems(updatedList);
      localStorage.setItem('stock_sedile_cache', JSON.stringify(updatedList));
      showToast(newOculto ? "Producto ocultado localmente (Modo Offline)" : "Producto mostrado localmente (Modo Offline)", "success");
    }

    setSyncing(false);
    fetchStockData(false);
  };

  // --- Historial (Auditoría) ---
  const fetchHistory = async (showLoading = true) => {
    if (showLoading) setLoadingHistory(true);
    try {
      if (isConfigured) {
        // Pruning automático: Eliminar registros históricos con más de 1 mes de antigüedad
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        await supabase
          .from('stock_history')
          .delete()
          .lt('changed_at', oneMonthAgo.toISOString());

        const { data, error } = await supabase
          .from('stock_history')
          .select('*')
          .order('changed_at', { ascending: false })
          .limit(150);
          
        if (!error && data) {
          setHistoryItems(data);
        } else {
          console.error("Error al obtener historial:", error);
        }
      }
    } catch (err) {
      console.error("Excepción al obtener historial:", err);
    }
    if (showLoading) setLoadingHistory(false);
  };

  // --- Estudio de Carga Laboral SEDILE-CEFE ---
  const fetchWorkloadRecords = async (showLoading = true) => {
    if (showLoading) setLoadingWorkload(true);
    let success = false;

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('carga_laboral_sedile')
          .select('*')
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          const cacheStr = localStorage.getItem('carga_laboral_cache');
          const localOnly = cacheStr ? JSON.parse(cacheStr).filter((r: any) => String(r.id).startsWith('local-')) : [];
          // Filtrar de localOnly cualquier registro que ya se haya subido con éxito (por coincidencia o tempId)
          const merged = [...localOnly, ...data];
          setWorkloadRecords(merged);
          localStorage.setItem('carga_laboral_cache', JSON.stringify(merged));
          success = true;
        } else {
          console.error("Error al obtener carga laboral de Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al obtener carga laboral de Supabase:", err);
      }
    }

    if (!success) {
      const cache = localStorage.getItem('carga_laboral_cache');
      if (cache) {
        setWorkloadRecords(JSON.parse(cache));
      } else {
        setWorkloadRecords([]);
      }
    }
    if (showLoading) setLoadingWorkload(false);
  };

  const handleAddWorkloadRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkload.fecha || !newWorkload.turno) {
      showToast("Por favor complete los campos obligatorios", "error");
      return;
    }

    setLoadingWorkload(true);
    const tempId = 'local-' + Date.now();
    
    // Mapeamos los campos consolidados
    const recordToAdd = {
      fecha: newWorkload.fecha,
      turno: newWorkload.turno,
      area: newWorkload.area || 'Consolidado',
      categoria: newWorkload.categoria || 'Operatividad y Dotación',
      producto_unidad: newWorkload.producto_unidad || 'Resumen Turno',
      cantidad: Number(newWorkload.dotacion_real) || 10, // dotación real en cantidad antigua
      tiempo_total_min: 720, // 12 horas de turno
      tiempo_extra_min: Math.max(0, (Number(newWorkload.dotacion_teorica) || 10) - (Number(newWorkload.dotacion_real) || 10)), // ausencias
      observaciones: newWorkload.observaciones || '',
      
      // Nuevos campos del formato consolidado
      is_consolidado: true,
      dotacion_teorica: Number(newWorkload.dotacion_teorica) || 10,
      dotacion_real: Number(newWorkload.dotacion_real) || 10,
      motivos_ausencia: newWorkload.motivos_ausencia || [],
      litros_lacteos: Number(newWorkload.litros_lacteos) || 0,
      litros_enterales: Number(newWorkload.litros_enterales) || 0,
      pacientes_atendidos: Number(newWorkload.pacientes_atendidos) || 0,
      productos_entregados: Number(newWorkload.productos_entregados) || 0,
      incidentes_detectados: newWorkload.incidentes_detectados || []
    };

    let success = false;

    if (isConfigured) {
      try {
        // Intentar inserción con todas las columnas nuevas
        const { data, error } = await supabase
          .from('carga_laboral_sedile')
          .insert([recordToAdd])
          .select();

        if (!error && data && data.length > 0) {
          showToast("Resumen de turno guardado en base de datos", "success");
          success = true;
        } else {
          console.error("Error al guardar en Supabase con nuevas columnas:", error);
          const errorMsg = error?.message || '';
          
          // Si el error es porque las columnas no existen (falta migración SQL), reintentar en modo compatibilidad
          if (errorMsg.includes('column') && (errorMsg.includes('does not exist') || errorMsg.includes('inexistente'))) {
            console.log("Detectadas columnas faltantes en Supabase. Reintentando en modo compatible (JSON en observaciones)...");
            
            const backupJson = {
              dotacion_teorica: recordToAdd.dotacion_teorica,
              dotacion_real: recordToAdd.dotacion_real,
              motivos_ausencia: recordToAdd.motivos_ausencia,
              litros_lacteos: recordToAdd.litros_lacteos,
              litros_enterales: recordToAdd.litros_enterales,
              pacientes_atendidos: recordToAdd.pacientes_atendidos,
              productos_entregados: recordToAdd.productos_entregados,
              incidentes_detectados: recordToAdd.incidentes_detectados
            };

            const compatibleRecord = {
              fecha: recordToAdd.fecha,
              turno: recordToAdd.turno,
              area: 'Consolidado',
              categoria: 'Operatividad y Dotación',
              producto_unidad: 'Resumen Turno',
              cantidad: recordToAdd.dotacion_real,
              tiempo_total_min: 720,
              tiempo_extra_min: recordToAdd.dotacion_teorica - recordToAdd.dotacion_real,
              observaciones: '[COMPATIBILITY_JSON:' + JSON.stringify(backupJson) + '] ' + (newWorkload.observaciones || '')
            };

            const { data: retryData, error: retryError } = await supabase
              .from('carga_laboral_sedile')
              .insert([compatibleRecord])
              .select();

            if (!retryError && retryData && retryData.length > 0) {
              showToast("Guardado (¡Advertencia: ejecuta la migración SQL para habilitar columnas y gráficos completos!)", "warning");
              success = true;
            } else {
              console.error("Error en intento de reintento compatible:", retryError);
            }
          }
        }
      } catch (err) {
        console.error("Excepción al guardar en Supabase:", err);
      }
    }

    if (!success) {
      const recordWithId = { ...recordToAdd, id: tempId, created_at: new Date().toISOString() } as WorkloadRecord;
      const updatedList = [recordWithId, ...workloadRecords];
      setWorkloadRecords(updatedList);
      localStorage.setItem('carga_laboral_cache', JSON.stringify(updatedList));
      showToast("Registro guardado localmente (Offline)", "success");
    } else {
      await fetchWorkloadRecords(false);
    }

    // Resetear formulario con valores por defecto consolidados
    setNewWorkload({
      fecha: new Date().toISOString().split('T')[0],
      turno: newWorkload.turno || 'Día',
      dotacion_teorica: 10,
      dotacion_real: 10,
      motivos_ausencia: [],
      litros_lacteos: 0,
      litros_enterales: 0,
      pacientes_atendidos: 0,
      productos_entregados: 0,
      incidentes_detectados: [],
      observaciones: '',
      is_consolidado: true
    });
    setLoadingWorkload(false);
  };;

  const handleDeleteWorkloadRecord = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro del estudio?")) return;

    setLoadingWorkload(true);
    let success = false;

    if (isConfigured && !id.startsWith('local-')) {
      try {
        const { error } = await supabase
          .from('carga_laboral_sedile')
          .delete()
          .eq('id', id);

        if (!error) {
          showToast("Registro eliminado de la base de datos", "success");
          success = true;
        } else {
          console.error("Error al eliminar en Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al eliminar en Supabase:", err);
      }
    }

    if (!success) {
      const updatedList = workloadRecords.filter(r => r.id !== id);
      setWorkloadRecords(updatedList);
      localStorage.setItem('carga_laboral_cache', JSON.stringify(updatedList));
      showToast("Registro eliminado localmente (Offline)", "success");
    } else {
      await fetchWorkloadRecords(false);
    }
    setLoadingWorkload(false);
  };

  // Auto-sincronizar mermas locales pendientes hacia Supabase para rescate automático
  const syncLocalMermasToCloud = async (localRecords: any[]) => {
    if (!isConfigured || localRecords.length === 0) return;
    let anySynced = false;
    const remainingLocal: any[] = [];

    for (const rec of localRecords) {
      try {
        const { id, created_at, ...cleanRec } = rec;
        // 1. Intentar inserción directa
        const { data, error } = await supabase.from('mermas_sedile').insert([cleanRec]).select();
        if (!error && data && data.length > 0) {
          anySynced = true;
          continue;
        }

        // 2. Fallback de compatibilidad total
        const parsed = parseMermaRecord(cleanRec);
        const compatibleRecord = {
          fecha: cleanRec.fecha,
          seccion: parsed.baseSection as any,
          motivo: 'Acumulación',
          producto_unidad: `[SEC:${cleanRec.seccion}|MOT:${cleanRec.motivo}] ${cleanRec.producto_unidad}`,
          cantidad: cleanRec.cantidad
        };
        const { data: retryData, error: retryError } = await supabase.from('mermas_sedile').insert([compatibleRecord]).select();
        if (!retryError && retryData && retryData.length > 0) {
          anySynced = true;
          continue;
        }

        remainingLocal.push(rec);
      } catch (e) {
        remainingLocal.push(rec);
      }
    }

    if (anySynced) {
      localStorage.setItem('mermas_cache', JSON.stringify(remainingLocal));
      await fetchMermasRecords(false);
      showToast("Mermas locales sincronizadas con la nube con éxito", "success");
    }
  };

  // --- Registro de Mermas SEDILE-CEFE ---
  const fetchMermasRecords = async (showLoading = true) => {
    if (showLoading) setLoadingMermas(true);
    let success = false;

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('mermas_sedile')
          .select('*')
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          const cacheStr = localStorage.getItem('mermas_cache');
          const localOnly = cacheStr ? JSON.parse(cacheStr).filter((r: any) => String(r.id).startsWith('local-')) : [];
          
          const normalized = data.map((r: any) => {
            const p = parseMermaRecord(r);
            return {
              ...r,
              seccion: p.cleanSeccion,
              motivo: p.cleanMotivo,
              producto_unidad: p.cleanProductoUnidad
            };
          });

          const merged = [...localOnly, ...normalized];
          setMermasRecords(merged);
          localStorage.setItem('mermas_cache', JSON.stringify(merged));
          success = true;

          // Si hay registros locales pendientes de sincronizar, enviarlos a Supabase
          if (localOnly.length > 0) {
            syncLocalMermasToCloud(localOnly);
          }
        } else {
          console.error("Error al obtener mermas de Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al obtener mermas de Supabase:", err);
      }
    }

    if (!success) {
      const cache = localStorage.getItem('mermas_cache');
      if (cache) {
        const parsed = JSON.parse(cache).map((r: any) => {
          const p = parseMermaRecord(r);
          return {
            ...r,
            seccion: p.cleanSeccion,
            motivo: p.cleanMotivo,
            producto_unidad: p.cleanProductoUnidad
          };
        });
        setMermasRecords(parsed);
      } else {
        setMermasRecords([]);
      }
    }
    if (showLoading) setLoadingMermas(false);
  };

  const handleAddMermaRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerma.fecha || !newMerma.seccion || !newMerma.motivo || !newMerma.producto_unidad || !newMerma.cantidad || newMerma.cantidad <= 0) {
      showToast("Por favor complete todos los campos requeridos", "error");
      return;
    }

    if (newMerma.motivo === 'Otro' && !otroMotivoText.trim()) {
      showToast("Por favor especifique el motivo en el campo de texto.", "error");
      return;
    }

    setLoadingMermas(true);
    const qtyToAdd = Number(newMerma.cantidad);
    
    // Auto-detectar si es líquido
    const isLiquid = ['Mamaderas', 'Vasos con suplemento', 'Vasos con productos especiales', 'Jeringa BIC', 'Jeringa Gavage', 'Botellines', 'Jugos en caja'].includes(newMerma.producto_unidad || '') || (newMerma.producto_unidad || '').includes('Jeringa');
    const supplementVal = isLiquid ? mermaSuplemento : '';
    
    const finalMotivo = newMerma.motivo === 'Otro'
      ? (otroMotivoText.trim() ? `Otro: ${otroMotivoText.trim()}` : 'Otro')
      : newMerma.motivo;

    const recordToAdd = {
      fecha: newMerma.fecha,
      seccion: newMerma.seccion as any,
      motivo: finalMotivo,
      producto_unidad: (isLiquid && supplementVal ? (newMerma.producto_unidad + " - " + supplementVal) : newMerma.producto_unidad) as any,
      cantidad: qtyToAdd
    };

    // Buscar si ya existe un registro con la misma fecha, sección, motivo y fórmula/producto para acumular
    const existing = mermasRecords.find(r => {
      const p = parseMermaRecord(r);
      return r.fecha === recordToAdd.fecha &&
        (p.cleanSeccion === recordToAdd.seccion || r.seccion === recordToAdd.seccion) &&
        (p.cleanMotivo === recordToAdd.motivo || r.motivo === recordToAdd.motivo) &&
        (p.cleanProductoUnidad === recordToAdd.producto_unidad || r.producto_unidad === recordToAdd.producto_unidad);
    });

    let success = false;

    if (existing) {
      const newQty = existing.cantidad + qtyToAdd;
      
      if (isConfigured && !existing.id.startsWith('local-')) {
        try {
          const { data, error } = await supabase
            .from('mermas_sedile')
            .update({ cantidad: newQty })
            .eq('id', existing.id)
            .select();

          if (!error && data && data.length > 0) {
            showToast("Registro de merma acumulado con éxito", "success");
            success = true;
          } else {
            console.error("Error al actualizar en Supabase:", error);
          }
        } catch (err) {
          console.error("Excepción al actualizar en Supabase:", err);
        }
      }

      if (!success) {
        // Fallback local
        const updatedList = mermasRecords.map(r => 
          r.id === existing.id ? { ...r, cantidad: newQty } : r
        );
        setMermasRecords(updatedList);
        localStorage.setItem('mermas_cache', JSON.stringify(updatedList));
        showToast("Registro de merma acumulado localmente (Offline)", "success");
      } else {
        await fetchMermasRecords(false);
      }
    } else {
      // Inserción normal
      const tempId = 'local-' + Date.now();
      if (isConfigured) {
        try {
          const { data, error } = await supabase
            .from('mermas_sedile')
            .insert([recordToAdd])
            .select();

          if (!error && data && data.length > 0) {
            showToast("Registro de merma guardado en Supabase", "success");
            success = true;
          } else {
            console.warn("Fallo insert directo en Supabase, aplicando guardado compatible:", error);
            // Reintento compatible: encapsular sección y motivo en producto_unidad para compatibilidad con DB antigua
            const parsed = parseMermaRecord(recordToAdd);
            const compatibleRecord = {
              fecha: recordToAdd.fecha,
              seccion: parsed.baseSection as any,
              motivo: 'Acumulación',
              producto_unidad: `[SEC:${recordToAdd.seccion}|MOT:${recordToAdd.motivo}] ${recordToAdd.producto_unidad}`,
              cantidad: recordToAdd.cantidad
            };
            const { data: retryData, error: retryError } = await supabase
              .from('mermas_sedile')
              .insert([compatibleRecord])
              .select();

            if (!retryError && retryData && retryData.length > 0) {
              showToast("Guardado en la nube con éxito", "success");
              success = true;
            } else {
              console.error("Error definitivo al guardar en Supabase:", retryError || error);
            }
          }
        } catch (err) {
          console.error("Excepción al guardar en Supabase:", err);
        }
      }

      if (!success) {
        const recordWithId = { ...recordToAdd, id: tempId, created_at: new Date().toISOString() } as MermaRecord;
        const updatedList = [recordWithId, ...mermasRecords];
        setMermasRecords(updatedList);
        localStorage.setItem('mermas_cache', JSON.stringify(updatedList));
        showToast("Registro de merma guardado localmente (Offline)", "success");
      } else {
        await fetchMermasRecords(false);
      }
    }

    // Reset quantity and supplement
    setNewMerma(prev => ({
      ...prev,
      cantidad: 0
    }));
    setMermaSuplemento('');
    setOtroMotivoText('');
    setLoadingMermas(false);
  };

  const handleDeleteMermaRecord = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro de merma?")) return;

    setLoadingMermas(true);
    let success = false;

    if (isConfigured && !id.startsWith('local-')) {
      try {
        const { error } = await supabase
          .from('mermas_sedile')
          .delete()
          .eq('id', id);

        if (!error) {
          showToast("Registro de merma eliminado", "success");
          success = true;
        } else {
          console.error("Error al eliminar en Supabase:", error);
        }
      } catch (err) {
        console.error("Excepción al eliminar en Supabase:", err);
      }
    }

    if (!success) {
      const updatedList = mermasRecords.filter(r => r.id !== id);
      setMermasRecords(updatedList);
      localStorage.setItem('mermas_cache', JSON.stringify(updatedList));
      showToast("Registro de merma eliminado localmente", "success");
    } else {
      await fetchMermasRecords(false);
    }
    setLoadingMermas(false);
  };

  const copyWorkloadToClipboard = () => {
    if (workloadRecords.length === 0) {
      showToast("No hay registros de carga laboral para copiar.", "info");
      return;
    }

    let text = `ESTUDIO DE CARGA LABORAL SEDILE-CEFE\n`;
    text += `Generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}\n\n`;
    text += `Fecha\tTurno\tÁrea\tCategoría de Tarea\tProducto/Unidad\tCantidad\tTiempo Total (Min)\tTiempo Extra (Min)\tObservaciones\n`;
    workloadRecords.forEach(r => {
      text += `${r.fecha}\t${r.turno}\t${r.area}\t${r.categoria}\t${r.producto_unidad}\t${r.cantidad}\t${r.tiempo_total_min}\t${r.tiempo_extra_min}\t${r.observaciones || ''}\n`;
    });

    navigator.clipboard.writeText(text)
      .then(() => showToast("Datos de carga laboral copiados al portapapeles", "success"))
      .catch(() => showToast("Error al copiar al portapapeles", "error"));
  };

  // --- Funciones de Exportación (Copiar) ---

  // 1. Copiar como Texto (Excel)
  const copyAsText = () => {
    const filtered = getFilteredItems().filter(item => !item.oculto);
    if (filtered.length === 0) {
      showToast("No hay registros en el listado para copiar", "error");
      return;
    }

    // Cabecera TSV
    let content = "Código\tProducto\tUnidad\tStock SEDILE\tUso Diario\tStock Total\tDías Disp. SEDILE\tDías Disp. Hosp\r\n";
    
    filtered.forEach(item => {
      const dispSedile = item.uso_diario > 0 ? (item.stock_sedile / item.uso_diario).toFixed(1) : "Sin uso";
      const dispHosp = item.uso_diario > 0 ? (item.stock_total / item.uso_diario).toFixed(1) : "Sin uso";
      
      content += `${item.codigo}\t${item.nombre}\t${item.unidad}\t${item.stock_sedile}\t${item.uso_diario}\t${item.stock_total}\t${dispSedile}\t${dispHosp}\r\n`;
    });

    navigator.clipboard.writeText(content)
      .then(() => showToast("Â¡Tabla completa copiada al portapapeles! Ya puede pegarla en Excel o un correo.", "success"))
      .catch(err => {
        console.error("Error copying text:", err);
        showToast("Error al copiar texto", "error");
      });
  };

  // 2. Copiar como Texto Público (Solo Producto y Stock SEDILE)
  const copyPublicText = () => {
    const filtered = getFilteredItems().filter(item => !item.oculto);
    if (filtered.length === 0) {
      showToast("No hay registros en el listado para copiar", "error");
      return;
    }

    let content = `STOCK SEDILE 2026 - Control de Stock de Turno\nFecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;
    content += "PRODUCTO -> STOCK DISPONIBLE\n";
    content += "---------------------------------------\n";
    
    filtered.forEach(item => {
      content += `• ${item.nombre}: ${item.stock_sedile} ${item.unidad}\n`;
    });

    navigator.clipboard.writeText(content)
      .then(() => showToast("¡Lista simplificada copiada! Ideal para enviar por WhatsApp o chats.", "success"))
      .catch(err => {
        console.error("Error:", err);
        showToast("Error al copiar stock", "error");
      });
  };

  // 3. Copiar como Imagen (PNG) a través de Canvas con textos y números agrandados
  const copyAsImage = (isPublic = false) => {
    const filtered = getFilteredItems().filter(item => !item.oculto);
    if (filtered.length === 0) {
      showToast("No hay productos filtrados para exportar como imagen.", "error");
      return;
    }

    showToast("Generando imagen de alta resolución...", "success");

    // Configuración de dimensiones según el modo (sin cambiar dimensiones globales de la imagen)
    const width = isPublic ? 1400 : 2380;
    const tableWidth = isPublic ? 650 : 1140;
    const separator = isPublic ? 40 : 50;
    const leftXOffset = isPublic ? 30 : 25;
    const rightXOffset = leftXOffset + tableWidth + separator;
    const middleX = width / 2;

    const titleHeight = isPublic ? 115 : 110;
    const headerHeight = isPublic ? 52 : 52;
    const footerHeight = isPublic ? 52 : 52;

    // Preprocesamiento para insertar cabecera RTH en cada columna si hay RTH
    const rawLeft = filtered.slice(0, Math.ceil(filtered.length / 2));
    const rawRight = filtered.slice(Math.ceil(filtered.length / 2));

    const insertRTHHeader = (colItems: any[]) => {
      const res: any[] = [];
      let rthStarted = false;
      for (let i = 0; i < colItems.length; i++) {
        const item = colItems[i];
        if (item.categoria === 'RTH (Enteral)' && !rthStarted) {
          res.push({ isRTHHeader: true });
          rthStarted = true;
        }
        res.push(item);
      }
      return res;
    };

    const leftItems = insertRTHHeader(rawLeft);
    const rightItems = insertRTHHeader(rawRight);
    const numRows = Math.max(leftItems.length, rightItems.length);

    // Configuración de anchos y nombres de columnas (Código es 120px y Producto es 310px)
    const colWidths = isPublic ? [330, 190, 130] : [120, 330, 120, 170, 180, 220];
    const colNames = isPublic ? ['Producto', 'Stock Disp.', 'Días SEDILE'] : ['Código', 'Producto', 'Unidad', 'Stock SEDILE', 'Bodega Leches', 'Días SEDILE'];

    // Crear un canvas temporal para medir texto
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');

    const getWrappedLines = (text: string, font: string, maxWidth: number) => {
      if (!text) return [];
      if (!measureCtx) return [text];
      measureCtx.save();
      measureCtx.font = font;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const testWidth = measureCtx.measureText(testLine).width;
        if (testWidth < maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      measureCtx.restore();
      return lines;
    };

    const getCodeLines = (code: string) => {
      if (!code) return ['--'];
      if (code.includes('-')) {
        const parts = code.split('-');
        return [parts[0] + '-', parts[1] || ''];
      }
      if (code.length > 4) {
        return [code.substring(0, 4), code.substring(4)];
      }
      return [code];
    };

    // Pre-calcular posiciones Y y alturas de cada fila
    const rowHeights: number[] = [];
    const rowYPositions: number[] = [];
    let currentY = titleHeight - 16 + headerHeight; // y inicial para el cuerpo de la tabla

    for (let r = 0; r < numRows; r++) {
      rowYPositions.push(currentY);

      const itemL = leftItems[r];
      const itemR = rightItems[r];

      let h = isPublic ? 52 : 96; // base row height mínimo de 96 para admin
      
      if ((itemL && itemL.isRTHHeader) || (itemR && itemR.isRTHHeader)) {
        h = isPublic ? 52 : 96;
      } else {
        if (isPublic) {
          const fontStr = 'bold 22px system-ui, -apple-system, sans-serif';
          const linesL = itemL ? getWrappedLines(itemL.nombre, fontStr, colWidths[0] - 20) : [];
          const linesR = itemR ? getWrappedLines(itemR.nombre, fontStr, colWidths[0] - 20) : [];
          const maxLines = Math.max(1, linesL.length, linesR.length);
          h = 52 + (maxLines - 1) * 24;
        } else {
          const fontStr = 'bold 34px system-ui, -apple-system, sans-serif';
          const linesL = itemL ? getWrappedLines(itemL.nombre, fontStr, colWidths[1] - 20) : [];
          const linesR = itemR ? getWrappedLines(itemR.nombre, fontStr, colWidths[1] - 20) : [];
          const codeLinesL = itemL ? getCodeLines(itemL.codigo) : [];
          const codeLinesR = itemR ? getCodeLines(itemR.codigo) : [];
          
          const maxContentHeightL = Math.max(codeLinesL.length * 34, linesL.length * 38);
          const maxContentHeightR = Math.max(codeLinesR.length * 34, linesR.length * 38);
          const maxContentHeight = Math.max(maxContentHeightL, maxContentHeightR);
          
          h = Math.max(96, maxContentHeight + 20); // Mínimo 96 o altura del contenido con padding
        }
      }
      
      rowHeights.push(h);
      currentY += h;
    }

    const totalHeight = currentY + footerHeight;

    const canvas = document.createElement('canvas');
    const dpr = 2; // Alta resolución retina
    canvas.width = width * dpr;
    canvas.height = totalHeight * dpr;
    if (typeof window !== 'undefined') (window as any).__lastCanvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showToast("Error al inicializar el procesador de imágenes", "error");
      return;
    }

    ctx.scale(dpr, dpr);

    // Cargar imagen del Logo
    const logoImg = new Image();
    logoImg.src = '/logo.png';

    const renderCanvas = () => {
      // Fondo Blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, totalHeight);

      // Banner Superior (Purple Premium)
      ctx.fillStyle = '#6b21a8'; // purple-800
      ctx.fillRect(0, 0, width, titleHeight - 16);

      // Título Principal (Agrandado a 34px)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('STOCK BODEGA SEDILE CEFE - 2026', 94, isPublic ? 48 : 47); // Desplazado para hacer espacio al logo

      // Subtítulo con fecha y categorías seleccionadas
      ctx.fillStyle = '#e9d5ff'; // purple-200
      ctx.font = '500 17px system-ui, -apple-system, sans-serif';
      const currentDate = new Date().toLocaleString('es-CL');
      const categoryLabel = selectedCategories.includes('Todos') ? 'Todos' : selectedCategories.join(', ');
      ctx.fillText("Reporte de disponibilidad institucional • Generado el " + currentDate + " • Categorías: " + categoryLabel, 94, isPublic ? 75 : 74);

      // Dibujar Logo en el Banner Superior Izquierda en un círculo blanco
      try {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(52, isPublic ? 46 : 45, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc'; // purple-400
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.clip(); // Cortar en círculo

        // Dibujar logo
        ctx.drawImage(logoImg, 20, isPublic ? 14 : 13, 64, 64);
        ctx.restore();
      } catch (err) {
        console.error("Error al dibujar logo en canvas:", err);
      }

      // Badge decorativo de Reporte Oficial
      ctx.fillStyle = '#9333ea'; // purple-600
      ctx.beginPath();
      const badgeWidth = isPublic ? 200 : 220;
      ctx.roundRect(width - badgeWidth - 24, 30, badgeWidth, 34, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isPublic ? 'REPORTE NUTRICIONAL' : 'INFORME OFICIAL STOCK', width - 24 - (badgeWidth / 2), 51);

      const startY = titleHeight - 16;

      // Fondo Cabecera de Tabla (Duplicado para Izquierda y Derecha)
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.fillRect(leftXOffset, startY, tableWidth, headerHeight);
      ctx.fillRect(rightXOffset, startY, tableWidth, headerHeight);

      // Dibujar Nombres de Columnas en Cabeceras (Tipografía agrandada)
      ctx.fillStyle = '#ffffff';
      ctx.font = isPublic 
        ? 'bold 20px system-ui, -apple-system, sans-serif'
        : 'bold 22px system-ui, -apple-system, sans-serif';

      const drawHeaderForTable = (startX: number) => {
        let x = startX;
        for (let i = 0; i < colNames.length; i++) {
          const textX = x + ((isPublic && i === 0) || (!isPublic && i === 1) ? 16 : colWidths[i] / 2);
          ctx.textAlign = (isPublic && i === 0) || (!isPublic && i === 1) ? 'left' : 'center';
          const alignX = (isPublic && i === 0) || (!isPublic && i === 1) ? x + 16 : textX;
          ctx.fillText(colNames[i], alignX, startY + (isPublic ? 36 : 34));
          x += colWidths[i];
        }
      };

      drawHeaderForTable(leftXOffset);
      drawHeaderForTable(rightXOffset);

      // Dibujar Filas de Contenido
      for (let r = 0; r < numRows; r++) {
        const rowY = rowYPositions[r];
        const h = rowHeights[r];

        // --- LADO IZQUIERDO ---
        if (r < leftItems.length) {
          const item = leftItems[r];
          
          if (item.isRTHHeader) {
            // Fondo morado divisor de RTH
            ctx.fillStyle = '#f3e8ff'; // purple-100
            ctx.fillRect(leftXOffset, rowY, tableWidth, h);
            
            // Línea divisoria inferior
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(leftXOffset, rowY + h);
            ctx.lineTo(leftXOffset + tableWidth, rowY + h);
            ctx.stroke();

            // Texto "Productos RTH"
            ctx.fillStyle = '#7e22ce'; // purple-700
            ctx.font = isPublic
              ? 'bold 18px system-ui, -apple-system, sans-serif'
              : 'bold 22px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('PRODUCTOS RTH (Soporte Enteral)', leftXOffset + 16, rowY + h / 2);
          } else {
            // Fondo Zebra
            ctx.fillStyle = r % 2 === 0 ? '#ffffff' : '#f8fafc';
            ctx.fillRect(leftXOffset, rowY, tableWidth, h);

            // Línea divisoria inferior
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(leftXOffset, rowY + h);
            ctx.lineTo(leftXOffset + tableWidth, rowY + h);
            ctx.stroke();

            if (isPublic) {
              // Producto (Envoltura dinámica de texto)
              const fontStr = 'bold 22px system-ui, -apple-system, sans-serif';
              const linesL = getWrappedLines(item.nombre, fontStr, colWidths[0] - 20);
              const textStartY = rowY + (h - (linesL.length * 24)) / 2;
              
              ctx.fillStyle = '#0f172a';
              ctx.font = fontStr;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              linesL.forEach((line, idx) => {
                ctx.fillText(line, leftXOffset + 16, textStartY + idx * 24);
              });

              // Stock SEDILE
              ctx.fillStyle = '#6b21a8';
              ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(item.stock_sedile + " " + item.unidad, leftXOffset + colWidths[0] + colWidths[1] / 2, rowY + h / 2);

              // Disponibilidad SEDILE (Badge)
              const xDisp = leftXOffset + colWidths[0] + colWidths[1];
              const dispSedile = item.uso_diario > 0 ? item.stock_sedile / item.uso_diario : -1;
              drawCanvasBadge(ctx, xDisp, rowY, colWidths[2], dispSedile, h);
            } else {
              // Código (Alineado a la izquierda con salto de línea en guión, tamaño gigante 32px)
              const codeLinesL = getCodeLines(item.codigo);
              const codeStartY = rowY + (h - (codeLinesL.length * 34)) / 2;
              
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 32px monospace';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              codeLinesL.forEach((line, idx) => {
                ctx.fillText(line, leftXOffset + 16, codeStartY + idx * 34);
              });

              // Producto (Alineación izquierda con envoltura dinámica en tamaño gigante 34px)
              const fontStr = 'bold 34px system-ui, -apple-system, sans-serif';
              const linesL = getWrappedLines(item.nombre, fontStr, colWidths[1] - 20);
              const textStartY = rowY + (h - (linesL.length * 38)) / 2;

              ctx.fillStyle = '#0f172a';
              ctx.font = fontStr;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              linesL.forEach((line, idx) => {
                ctx.fillText(line, leftXOffset + colWidths[0] + 16, textStartY + idx * 38);
              });

              // Unidad
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(item.unidad || 'Tarro', leftXOffset + colWidths[0] + colWidths[1] + colWidths[2] / 2, rowY + h / 2);

              // Stock SEDILE
              ctx.fillStyle = '#0f172a';
              ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(item.stock_sedile.toString(), leftXOffset + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, rowY + h / 2);

              // Bodega Leches (Stock Bodega Leche)
              ctx.fillStyle = '#0f172a';
              ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              const stockBodegaL = (item.stock_bodega_leches ?? 0).toString();
              ctx.fillText(stockBodegaL, leftXOffset + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, rowY + h / 2);

              // Disponibilidad SEDILE (Badge)
              const xDisp = leftXOffset + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
              const dispSedile = item.uso_diario > 0 ? item.stock_sedile / item.uso_diario : -1;
              drawCanvasBadge(ctx, xDisp, rowY, colWidths[5], dispSedile, h);
            }
          }
        }

        // --- LADO DERECHO ---
        if (r < rightItems.length) {
          const item = rightItems[r];

          if (item.isRTHHeader) {
            // Fondo morado divisor de RTH
            ctx.fillStyle = '#f3e8ff'; // purple-100
            ctx.fillRect(rightXOffset, rowY, tableWidth, h);
            
            // Línea divisoria inferior
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(rightXOffset, rowY + h);
            ctx.lineTo(rightXOffset + tableWidth, rowY + h);
            ctx.stroke();

            // Texto "Productos RTH"
            ctx.fillStyle = '#7e22ce'; // purple-700
            ctx.font = isPublic
              ? 'bold 18px system-ui, -apple-system, sans-serif'
              : 'bold 22px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('PRODUCTOS RTH (Soporte Enteral)', rightXOffset + 16, rowY + h / 2);
          } else {
            // Fondo Zebra
            ctx.fillStyle = r % 2 === 0 ? '#ffffff' : '#f8fafc';
            ctx.fillRect(rightXOffset, rowY, tableWidth, h);

            // Línea divisoria inferior
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(rightXOffset, rowY + h);
            ctx.lineTo(rightXOffset + tableWidth, rowY + h);
            ctx.stroke();

            if (isPublic) {
              // Producto (Envoltura dinámica de texto)
              const fontStr = 'bold 22px system-ui, -apple-system, sans-serif';
              const linesR = getWrappedLines(item.nombre, fontStr, colWidths[0] - 20);
              const textStartY = rowY + (h - (linesR.length * 24)) / 2;
              
              ctx.fillStyle = '#0f172a';
              ctx.font = fontStr;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              linesR.forEach((line, idx) => {
                ctx.fillText(line, rightXOffset + 16, textStartY + idx * 24);
              });

              // Stock SEDILE
              ctx.fillStyle = '#6b21a8';
              ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(item.stock_sedile + " " + item.unidad, rightXOffset + colWidths[0] + colWidths[1] / 2, rowY + h / 2);

              // Disponibilidad SEDILE (Badge)
              const xDisp = rightXOffset + colWidths[0] + colWidths[1];
              const dispSedile = item.uso_diario > 0 ? item.stock_sedile / item.uso_diario : -1;
              drawCanvasBadge(ctx, xDisp, rowY, colWidths[2], dispSedile, h);
            } else {
              // Código (Alineado a la izquierda con salto de línea en guión, tamaño gigante 32px)
              const codeLinesR = getCodeLines(item.codigo);
              const codeStartY = rowY + (h - (codeLinesR.length * 34)) / 2;
              
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 32px monospace';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              codeLinesR.forEach((line, idx) => {
                ctx.fillText(line, rightXOffset + 16, codeStartY + idx * 34);
              });

              // Producto (Alineación izquierda con envoltura dinámica en tamaño gigante 34px)
              const fontStr = 'bold 34px system-ui, -apple-system, sans-serif';
              const linesR = getWrappedLines(item.nombre, fontStr, colWidths[1] - 20);
              const textStartY = rowY + (h - (linesR.length * 38)) / 2;

              ctx.fillStyle = '#0f172a';
              ctx.font = fontStr;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              linesR.forEach((line, idx) => {
                ctx.fillText(line, rightXOffset + colWidths[0] + 16, textStartY + idx * 38);
              });

              // Unidad
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(item.unidad || 'Tarro', rightXOffset + colWidths[0] + colWidths[1] + colWidths[2] / 2, rowY + h / 2);

              // Stock SEDILE
              ctx.fillStyle = '#0f172a';
              ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(item.stock_sedile.toString(), rightXOffset + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, rowY + h / 2);

              // Bodega Leches (Stock Bodega Leche)
              ctx.fillStyle = '#0f172a';
              ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              const stockBodegaR = (item.stock_bodega_leches ?? 0).toString();
              ctx.fillText(stockBodegaR, rightXOffset + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] / 2, rowY + h / 2);

              // Disponibilidad SEDILE (Badge)
              const xDisp = rightXOffset + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
              const dispSedile = item.uso_diario > 0 ? item.stock_sedile / item.uso_diario : -1;
              drawCanvasBadge(ctx, xDisp, rowY, colWidths[5], dispSedile, h);
            }
          }
        }
      }

      // Línea divisoria central vertical
      ctx.strokeStyle = '#cbd5e1'; // slate-300
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(middleX, startY);
      ctx.lineTo(middleX, currentY);
      ctx.stroke();

      // Pie de Reporte
      const footerY = currentY;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, footerY, width, footerHeight);

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('STOCK BODEGA SEDILE CEFE 2026 • Diseñado exclusivamente para control de bodega y leche institucional.', 24, footerY + 26);

      ctx.textAlign = 'right';
      ctx.fillText('Unidad de Nutrición • Hospital Regional de Antofagasta • SEDILE CEFE', width - 24, footerY + 26);

      // Convertir y exportar con fallback automático para celulares y contextos no seguros
      const triggerDownload = () => {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const dateStr = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
          const filename = isPublic 
            ? "Stock_SEDILE_Publico_" + dateStr + ".png"
            : "Stock_SEDILE_Oficial_" + dateStr + ".png";
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast("¡Imagen de stock descargada con éxito!", "success");
        } catch (err) {
          console.error("Error al descargar fallback:", err);
          showToast("No se pudo copiar ni descargar la imagen.", "error");
        }
      };

      if (!navigator.clipboard || !navigator.clipboard.write) {
        // En celulares sobre conexiones HTTP o navegadores sin soporte, descargamos directo
        triggerDownload();
        return;
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            showToast("¡Tabla copiada como imagen PNG! Listo para pegar en WhatsApp o correo.", "success");
          } catch (err) {
            console.error("Excepción en Clipboard API, iniciando descarga de emergencia:", err);
            triggerDownload();
          }
        }
      }, 'image/png');
    };

    logoImg.onload = renderCanvas;
    logoImg.onerror = () => {
      console.log("No se pudo precargar el logo para el canvas, procediendo sin el logo...");
      renderCanvas();
    };
  };

  // Dibujar Badge en Canvas Helper (Agrandado y Responsivo)
  const drawCanvasBadge = (ctx: CanvasRenderingContext2D, colX: number, rowY: number, colW: number, days: number, rHeight: number) => {
    const isPublicView = colW < 150;
    const badgeW = Math.min(isPublicView ? 114 : 174, colW - 12);
    const badgeH = isPublicView ? 36 : 56;
    const badgeX = colX + (colW - badgeW) / 2;
    const badgeY = rowY + (rHeight - badgeH) / 2;

    let bg = '#e2e8f0'; // gris / sin uso
    let fg = '#475569';
    let text = 'Sin uso';

    if (days >= 0) {
      if (days === 0) {
        bg = '#fee2e2'; // rojo claro
        fg = '#991b1b';
        text = 'Crítico (0 d)';
      } else if (days < 7) {
        bg = '#fee2e2';
        fg = '#991b1b';
        text = "Crítico (" + days.toFixed(1) + " d)";
      } else if (days < 15) {
        bg = '#fef3c7'; // amarillo claro
        fg = '#92400e';
        text = "Bajo (" + days.toFixed(1) + " d)";
      } else {
        bg = '#dcfce7'; // verde claro
        fg = '#166534';
        text = "OK (" + days.toFixed(1) + " d)";
      }
    }

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, isPublicView ? 18 : 22);
    ctx.fill();

    ctx.fillStyle = fg;
    ctx.font = isPublicView 
      ? 'bold 18px system-ui, -apple-system, sans-serif'
      : 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX + badgeW / 2, badgeY + badgeH / 2);
  };

  const toggleCategory = (category: string) => {
    if (category === 'Todos') {
      setSelectedCategories(['Todos']);
    } else {
      if (selectedCategories.includes('Todos')) {
        setSelectedCategories([category]);
      } else {
        if (selectedCategories.includes(category)) {
          const updated = selectedCategories.filter(c => c !== category);
          setSelectedCategories(updated.length === 0 ? ['Todos'] : updated);
        } else {
          setSelectedCategories([...selectedCategories, category]);
        }
      }
    }
  };

  // --- Conteo de Riesgo Predictivo de Stock ---
  const riskCounts = useMemo(() => {
    let outOfStock = 0;
    let critical = 0;
    let warning = 0;

    items.forEach(item => {
      if (item.oculto && (!isAdmin || !showHidden)) return;
      if (item.stock_sedile === 0) {
        outOfStock++;
      } else if (item.uso_diario > 0) {
        const days = item.stock_sedile / item.uso_diario;
        if (days < 7) {
          critical++;
        } else if (days < 14) {
          warning++;
        }
      }
    });

    return { outOfStock, critical, warning, totalRisk: outOfStock + critical + warning };
  }, [items, isAdmin, showHidden]);

  // --- Helpers de Renderizado y Búsqueda ---
  const getFilteredItems = () => {
    let result = items.filter(item => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.codigo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategories.includes('Todos') || selectedCategories.includes(item.categoria);
      
      // Filtrar críticos: stock en 0, o disponibilidad < 7 días en SEDILE o < 20 días en Bodega de Leches
      const daysSedile = item.uso_diario > 0 ? item.stock_sedile / item.uso_diario : -1;
      const daysBodega = item.uso_diario > 0 ? (item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario : -1;
      const isCritical = item.stock_sedile === 0 || 
                         (daysSedile !== -1 && daysSedile < 7) || 
                         (daysBodega !== -1 && daysBodega < 20);
      const matchesCritical = !filterCritical || isCritical;

      // Filtrar productos sin stock (cantidad 0)
      const matchesOutOfStock = !filterOutOfStock || item.stock_sedile === 0;

      // Filtro Predictivo Rápido por nivel de riesgo
      let matchesRisk = true;
      if (stockRiskFilter === 'out_of_stock') {
        matchesRisk = item.stock_sedile === 0;
      } else if (stockRiskFilter === 'critical') {
        matchesRisk = item.stock_sedile > 0 && daysSedile !== -1 && daysSedile < 7;
      } else if (stockRiskFilter === 'warning') {
        matchesRisk = item.stock_sedile > 0 && daysSedile >= 7 && daysSedile < 14;
      }

      // Filtrar ocultos (solo el admin con la opción showHidden puede verlos)
      const matchesHidden = (isAdmin && showHidden) ? true : !item.oculto;

      return matchesSearch && matchesCategory && matchesCritical && matchesHidden && matchesOutOfStock && matchesRisk;
    });

    // Ordenar para mandar los RTH al final, o por Licitación si está activo
    result.sort((a, b) => {
      if (sortByLicitacion) {
        const licA = a.licitacion_contrato || '';
        const licB = b.licitacion_contrato || '';
        // Elementos con licitación van primero; si no tienen, van al final
        if (licA && !licB) return -1;
        if (!licA && licB) return 1;
        if (licA && licB) {
          const comp = licA.localeCompare(licB);
          if (comp !== 0) return comp;
        }
        // Si tienen la misma licitación, ordenar por nombre
        return a.nombre.localeCompare(b.nombre);
      } else {
        if (a.categoria === 'RTH (Enteral)' && b.categoria !== 'RTH (Enteral)') return 1;
        if (a.categoria !== 'RTH (Enteral)' && b.categoria === 'RTH (Enteral)') return -1;
        return a.nombre.localeCompare(b.nombre);
      }
    });

    return result;
  };

  const getStockStatus = (item: StockItem) => {
    if (item.uso_diario <= 0) return { label: 'Sin uso', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    
    const days = item.stock_sedile / item.uso_diario;
    if (days < 7) {
      return { label: `${days.toFixed(1)} días`, color: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-semibold' };
    } else if (days < 20) {
      return { label: `${days.toFixed(1)} días`, color: 'bg-amber-50 text-amber-700 border-amber-100' };
    } else {
      return { label: `${days.toFixed(1)} días`, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
  };

  const getBodegaStockStatus = (item: StockItem) => {
    if (item.uso_diario <= 0) return { label: 'Sin uso', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    
    const days = (item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario;
    if (days < 20) {
      return { label: `${days.toFixed(1)} días`, color: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-semibold' };
    } else if (days < 35) {
      return { label: `${days.toFixed(1)} días`, color: 'bg-amber-50 text-amber-700 border-amber-100' };
    } else {
      return { label: `${days.toFixed(1)} días`, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
  };

  const getHospitalStockStatus = (item: StockItem) => {
    if (item.uso_diario <= 0) return { label: 'Sin uso', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    
    const days = item.stock_total / item.uso_diario;
    if (days < 15) {
      return { label: `${days.toFixed(1)} días`, color: 'bg-rose-50 text-rose-700 border-rose-100 font-semibold' };
    } else if (days < 30) {
      return { label: `${days.toFixed(1)} días`, color: 'bg-amber-50 text-amber-700 border-amber-100' };
    } else {
      return { label: `${days.toFixed(1)} días`, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
  };

  // Mapeador de agrupamiento para la visualización del historial en tarjetas
  interface UpdateBatch {
    id: string;
    timestamp: string;
    dateLabel: string;
    records: StockHistoryItem[];
  }

  const getUtcDateString = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const groupHistoryIntoBatches = (history: StockHistoryItem[]): UpdateBatch[] => {
    if (history.length === 0) return [];
    
    const sorted = [...history].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    
    const batches: UpdateBatch[] = [];
    
    sorted.forEach(record => {
      const recordUtcDate = getUtcDateString(record.changed_at);
      const existingBatch = batches.find(b => getUtcDateString(b.timestamp) === recordUtcDate);
      
      if (!existingBatch) {
        const dateObj = new Date(record.changed_at);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        
        batches.push({
          id: record.id,
          timestamp: record.changed_at,
          dateLabel: `Actualización día ${day}/${month} a las ${timeStr} hrs`,
          records: [record]
        });
      } else {
        existingBatch.records.push(record);
      }
    });
    
    return batches.slice(0, 10);
  };

  // Reconstruye el stock del pasado (antes de la actualización seleccionada)
  const getPreviewItems = (): (StockItem & { old_stock?: number; diff?: number })[] => {
    if (!selectedBatchId) {
      return filteredItems;
    }
    
    const batches = groupHistoryIntoBatches(historyItems);
    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    if (!selectedBatch) return filteredItems;
    
    const batchChanges = new Map<string, { old_stock: number; new_stock: number }>();
    for (let i = selectedBatch.records.length - 1; i >= 0; i--) {
      const r = selectedBatch.records[i];
      const existing = batchChanges.get(r.stock_id);
      if (!existing) {
        batchChanges.set(r.stock_id, {
          old_stock: Number(r.old_stock) || 0,
          new_stock: Number(r.new_stock) || 0
        });
      } else {
        existing.new_stock = Number(r.new_stock) || 0;
      }
    }
    
    return filteredItems.map(item => {
      const change = batchChanges.get(item.id);
      if (change) {
        const oldStockVal = change.old_stock;
        const diffVal = change.new_stock - oldStockVal;
        
        return {
          ...item,
          stock_sedile: oldStockVal,
          stock_total: oldStockVal + (item.stock_bodega_leches || 0),
          old_stock: oldStockVal,
          diff: diffVal
        };
      }
      return item;
    });
  };

  const filteredItems = getFilteredItems();
  
  // Totales Estadísticos
  const totalProducts = items.length;
  const criticalProductsCount = items.filter(item => {
    if (item.uso_diario <= 0) return false;
    const daysSedile = item.stock_sedile / item.uso_diario;
    const daysBodega = (item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario;
    return item.stock_sedile === 0 || daysSedile < 7 || daysBodega < 20;
  }).length;
  
  const lowProductsCount = items.filter(item => {
    if (item.uso_diario <= 0) return false;
    const daysSedile = item.stock_sedile / item.uso_diario;
    const daysBodega = (item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario;
    const isSedileLow = daysSedile >= 7 && daysSedile < 20;
    const isBodegaLow = daysBodega >= 20 && daysBodega < 35;
    return isSedileLow || isBodegaLow;
  }).length;

  // Obtener última actualización
  const lastUpdatedObj = items.reduce((latest, item) => {
    if (item.updated_at) {
      const d = new Date(item.updated_at);
      if (d > latest) return d;
    }
    return latest;
  }, new Date(0));
  
  let lastUpdatedText = "Sin actualizaciones recientes";
  if (lastUpdatedObj.getTime() > 0) {
    const wd = new Intl.DateTimeFormat('es-CL', { weekday: 'long' }).format(lastUpdatedObj);
    const day = lastUpdatedObj.getDate();
    const month = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(lastUpdatedObj);
    const year = lastUpdatedObj.getFullYear();
    const hrs = lastUpdatedObj.getHours().toString().padStart(2, '0');
    const mins = lastUpdatedObj.getMinutes().toString().padStart(2, '0');
    lastUpdatedText = `Actualizado el ${wd.charAt(0).toUpperCase() + wd.slice(1)} ${day} de ${month} del ${year} a las ${hrs}:${mins} hrs`;
  }

  const renderAnalyticsView = () => {
    // 1. KPI Cálculos
    const totalStockUnits = items.reduce((acc, item) => acc + (item.stock_sedile + (item.stock_bodega_leches || 0)), 0);
    
    const itemsWithUse = items.filter(item => item.uso_diario > 0);
    const avgAutonomy = itemsWithUse.length > 0
      ? itemsWithUse.reduce((acc, item) => acc + ((item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario), 0) / itemsWithUse.length
      : 0;

    const outOfStockItems = items.filter(item => item.stock_sedile === 0 && (item.stock_bodega_leches || 0) === 0);

    const healthyCount = items.filter(item => {
      if (item.uso_diario <= 0) return true;
      const daysSedile = item.stock_sedile / item.uso_diario;
      const daysBodega = (item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario;
      return item.stock_sedile > 0 && daysSedile >= 7 && daysBodega >= 20;
    }).length;
    const healthyPercentage = Math.round((healthyCount / (items.length || 1)) * 100);

    // 2. Gráfico 1: Top 10 Críticos / Consumo / Stock (Toggled)
    // 2a. Datos para Consumo Diario (Top 10)
    const topConsumoSorted = [...itemsWithUse]
      .sort((a, b) => b.uso_diario - a.uso_diario)
      .slice(0, 10);
    const consumoChartDataList = topConsumoSorted.map(item => ({
      name: item.nombre.length > 18 ? item.nombre.substring(0, 15) + '...' : item.nombre,
      fullName: item.nombre,
      consumoDiario: parseFloat(item.uso_diario.toFixed(1)),
      stock_sedile: item.stock_sedile,
      stock_bodega: item.stock_bodega_leches || 0
    }));

    // 2b. Datos para Autonomía (excluyendo stock 0)
    const autonomiaSorted = [...itemsWithUse]
      .filter(item => (item.stock_sedile + (item.stock_bodega_leches || 0)) > 0)
      .map(item => {
        const days = (item.stock_sedile + (item.stock_bodega_leches || 0)) / item.uso_diario;
        return { ...item, daysHospital: days };
      })
      .sort((a, b) => a.daysHospital - b.daysHospital)
      .slice(0, 10);
    const autonomiaChartDataList = autonomiaSorted.map(item => ({
      name: item.nombre.length > 18 ? item.nombre.substring(0, 15) + '...' : item.nombre,
      fullName: item.nombre,
      diasDisp: parseFloat(item.daysHospital.toFixed(1)),
      stock_sedile: item.stock_sedile,
      stock_bodega: item.stock_bodega_leches || 0,
      uso_diario: item.uso_diario
    }));

    // 2c. Datos para Stock Físico Stacked (SEDILE vs Bodega)
    const stockSorted = [...items]
      .filter(item => (item.stock_sedile + (item.stock_bodega_leches || 0)) > 0)
      .sort((a, b) => {
        const totalA = a.stock_sedile + (a.stock_bodega_leches || 0);
        const totalB = b.stock_sedile + (b.stock_bodega_leches || 0);
        return totalA - totalB;
      })
      .slice(0, 10);
    const stockChartDataList = stockSorted.map(item => ({
      name: item.nombre.length > 18 ? item.nombre.substring(0, 15) + '...' : item.nombre,
      fullName: item.nombre,
      stockSedile: item.stock_sedile,
      stockBodega: item.stock_bodega_leches || 0,
      stockTotal: item.stock_sedile + (item.stock_bodega_leches || 0),
      uso_diario: item.uso_diario
    }));

    // 3. Gráfico 2: Categorías
    const COLORS = ['#8b5cf6', '#3b82f6', '#eab308', '#14b8a6', '#f97316', '#ec4899', '#f43f5e', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#14b8a6'];
    const pieData = formCategories.map(cat => {
      const catItems = items.filter(item => item.categoria === cat);
      const totalStock = catItems.reduce((acc, item) => acc + (item.stock_sedile + (item.stock_bodega_leches || 0)), 0);
      return {
        name: cat,
        value: totalStock
      };
    }).filter(c => c.value > 0);

    // Helper para formatear desglose por envase y volumen (cc)
    const formatContainersBreakdown = (records: any[]) => {
      if (!records || records.length === 0) return '0 unidades';
      
      const containerMap: Record<string, { units: number; volCc: number }> = {};

      records.forEach(r => {
        const parsed = parseMermaRecord(r);
        const cType = parsed.containerType || 'Unidades';
        if (!containerMap[cType]) {
          containerMap[cType] = { units: 0, volCc: 0 };
        }
        const units = parsed.isLiquid ? 1 : (r.cantidad || 0);
        const vol = parsed.isLiquid ? (r.cantidad || 0) : 0;
        containerMap[cType].units += units;
        containerMap[cType].volCc += vol;
      });

      const parts = Object.keys(containerMap).map(cType => {
        const item = containerMap[cType];
        if (item.volCc > 0) {
          return `${item.units} ${cType.toLowerCase()} (${item.volCc} cc)`;
        }
        return `${item.units} ${cType.toLowerCase()}`;
      });

      return parts.join(', ');
    };

    // --- Registro de Mermas Calculations ---
    const netMermasRecords = mermasRecords.filter(r => r.motivo !== 'Devolución para reutilizar');
    const reusableMermasRecords = mermasRecords.filter(r => r.motivo === 'Devolución para reutilizar');
    const totalNetMermasUnits = netMermasRecords.reduce((sum, r) => sum + (parseMermaRecord(r).isLiquid ? 1 : (r.cantidad || 0)), 0);
    const totalNetMermasVolCc = netMermasRecords.filter(r => parseMermaRecord(r).isLiquid).reduce((sum, r) => sum + (r.cantidad || 0), 0);
    const totalReusableUnits = reusableMermasRecords.reduce((sum, r) => sum + (parseMermaRecord(r).isLiquid ? 1 : (r.cantidad || 0)), 0);

    const sectionLosses: Record<string, number> = { Enterales: 0, Pediatría: 0, Neonatología: 0 };
    netMermasRecords.forEach(r => {
      const baseSec = parseMermaRecord(r).baseSection;
      const units = parseMermaRecord(r).isLiquid ? 1 : (r.cantidad || 0);
      if (sectionLosses[baseSec] !== undefined) {
        sectionLosses[baseSec] += units;
      }
    });

    let topSection = 'Ninguna';
    let maxSectionLoss = 0;
    Object.keys(sectionLosses).forEach(sec => {
      if (sectionLosses[sec] > maxSectionLoss) {
        maxSectionLoss = sectionLosses[sec];
        topSection = sec;
      }
    });

    const reasonLosses: Record<string, number> = {};
    netMermasRecords.forEach(r => {
      const mot = r.motivo || 'Sin motivo';
      const units = parseMermaRecord(r).isLiquid ? 1 : (r.cantidad || 0);
      reasonLosses[mot] = (reasonLosses[mot] || 0) + units;
    });

    let topReason = 'Ninguno';
    let maxReasonLoss = 0;
    Object.keys(reasonLosses).forEach(re => {
      if (reasonLosses[re] > maxReasonLoss) {
        maxReasonLoss = reasonLosses[re];
        topReason = re;
      }
    });

    // Chart data (Moved to global scope)
    const motivoChartData = Object.keys(reasonLosses).map(m => ({
      name: m,
      value: reasonLosses[m]
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const seccionChartData = Object.keys(sectionLosses).map(sec => ({
      name: sec,
      Cantidad: sectionLosses[sec]
    }));

    const copyMermasToWhatsApp = () => {
      if (mermasRecords.length === 0) {
        showToast("No hay registros de mermas para reportar.", "info");
        return;
      }

      let text = `🚨 *REPORTE DE MERMAS - SEDILE-CEFE* 🚨\n`;
      text += `Fecha de reporte: ${new Date().toLocaleDateString('es-CL')}\n\n`;
      
      text += `*PÉRDIDAS POR SECCIÓN (Mermas Netas):*\n`;
      ['Enterales', 'Pediatría', 'Neonatología'].forEach(sec => {
        const secRecords = netMermasRecords.filter(r => parseMermaRecord(r).baseSection === sec);
        text += `🏢 ${sec}: ${secRecords.length > 0 ? formatContainersBreakdown(secRecords) : '0 unidades'}\n`;
      });
      text += `\n`;

      text += `*DESGLOSE POR MOTIVO REAL:*\n`;
      const uniqueReasons = [...new Set(netMermasRecords.map(r => r.motivo || 'Sin motivo'))];
      uniqueReasons.forEach(mot => {
        const motRecords = netMermasRecords.filter(r => (r.motivo || 'Sin motivo') === mot);
        text += `⚠️ ${mot}: ${formatContainersBreakdown(motRecords)}\n`;
      });
      text += `\n`;

      text += `*TOTAL MERMAS REALES:* ${formatContainersBreakdown(netMermasRecords)} (Total: ${totalNetMermasUnits} uds${totalNetMermasVolCc > 0 ? ` / ${totalNetMermasVolCc} cc` : ''}).\n\n`;
      
      text += `*LOGÍSTICA / DISTRIBUCIÓN INEFICIENTE:*\n`;
      text += `♻️ Devoluciones para Reutilizar: ${reusableMermasRecords.length > 0 ? formatContainersBreakdown(reusableMermasRecords) : '0 unidades'} (tiempo de traslado perdido).\n`;

      navigator.clipboard.writeText(text)
        .then(() => showToast("Reporte formateado copiado para WhatsApp", "success"))
        .catch(() => showToast("Error al copiar al portapapeles", "error"));
    };

    return (
      <div className="space-y-6 animate-fade-in">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Panel de Análisis y Estadísticas</h2>
            <p className="text-xs text-slate-500 font-medium">Indicadores generales y herramientas de planificación de bodega láctea.</p>
          </div>
          <button
            onClick={() => setViewMode('table')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm self-start sm:self-center"
          >
            <Clipboard className="w-3.5 h-3.5" /> Volver al Inventario
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Autonomía Institucional</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{avgAutonomy.toFixed(1)} días</h3>
              <p className="text-xs text-slate-400 mt-0.5">Promedio de stock disponible</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Índice Saludable</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{healthyPercentage}%</h3>
              <p className="text-xs text-slate-400 mt-0.5">Productos con stock seguro</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 to-red-500"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productos Agotados</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{outOfStockItems.length}</h3>
              <p className="text-xs text-rose-500/80 mt-0.5">Stock total en cero</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm text-rose-600">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-sky-500"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Físico Custodiado</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStockUnits.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Unidades totales en bodegas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm text-blue-600">
              <Database className="w-5 h-5" />
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">
                  {statsChartType === 'consumo' && '🔥 Top 10 Mayor Consumo Diario'}
                  {statsChartType === 'autonomia' && '🚨 Top 10 Autonomía Crítica'}
                  {statsChartType === 'stock' && '📦 Top 10 Menor Stock Físico'}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {statsChartType === 'consumo' && 'Basado en el uso diario promedio (unidades/día).'}
                  {statsChartType === 'autonomia' && 'Muestra días de autonomía (excluye productos agotados).'}
                  {statsChartType === 'stock' && 'Stock físico real acumulado en SEDILE y Bodega Leches.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Selector de modo de vista: Gráfico o Lista */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => setStatsViewMode('chart')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      statsViewMode === 'chart'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📊 Gráfico
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsViewMode('list')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      statsViewMode === 'list'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📋 Lista
                  </button>
                </div>

                <select
                  value={statsChartType}
                  onChange={(e) => setStatsChartType(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                >
                  <option value="consumo">🔥 Consumo Diario</option>
                  <option value="autonomia">🚨 Autonomía (Días)</option>
                  <option value="stock">📦 Stock SEDILE/Bodega</option>
                </select>
              </div>
            </div>
            <div className="h-80 w-full overflow-y-auto">
              {statsViewMode === 'chart' ? (
                <ResponsiveContainer width="100%" height="100%">
                  {statsChartType === 'consumo' ? (
                    <BarChart
                      data={consumoChartDataList}
                      layout="vertical"
                      margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorConsumo" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} unit=" u/d" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} fontSize={10} />
                      <Tooltip formatter={(value) => [`${value} unidades/día`, 'Consumo Diario']} />
                      <Bar dataKey="consumoDiario" fill="url(#colorConsumo)" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="consumoDiario" position="right" fontSize={10} fill="#64748b" formatter={(val: any) => `${val} u/d`} />
                        {consumoChartDataList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="url(#colorConsumo)" />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : statsChartType === 'autonomia' ? (
                    <BarChart
                      data={autonomiaChartDataList}
                      layout="vertical"
                      margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} unit=" d" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} fontSize={10} />
                      <Tooltip formatter={(value) => [`${value} días`, 'Autonomía']} />
                      <Bar dataKey="diasDisp" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="diasDisp" position="right" fontSize={10} fill="#64748b" formatter={(val: any) => `${val} d`} />
                        {autonomiaChartDataList.map((entry, index) => {
                          const days = entry.diasDisp;
                          let barColor = '#10b981';
                          if (days < 7) {
                            barColor = '#f43f5e';
                          } else if (days < 20) {
                            barColor = '#f59e0b';
                          }
                          return <Cell key={`cell-${index}`} fill={barColor} />;
                        })}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart
                      data={stockChartDataList}
                      layout="vertical"
                      margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} unit=" u" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} fontSize={10} />
                      <Tooltip formatter={(value, name) => [`${value} unidades`, name === 'stockSedile' ? 'Stock SEDILE' : 'Stock Bodega']} />
                      <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="stockSedile" name="Stock SEDILE" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="stockBodega" name="Stock Bodega" stackId="a" fill="#14b8a6" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="stockTotal" position="right" fontSize={10} fill="#64748b" formatter={(val: any) => `${val} u`} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                /* Vista de Lista Detallada */
                <div className="space-y-2.5 pr-1.5">
                  {statsChartType === 'consumo' && consumoChartDataList.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/55 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md mr-1.5">#{idx + 1}</span>
                          <span className="font-bold text-xs text-slate-800">{item.fullName}</span>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                          🔥 {item.consumoDiario} u/día
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
                        <span>Stock total: <strong className="text-slate-700">{(item.stock_sedile + item.stock_bodega)} u</strong></span>
                        <span>(SEDILE: {item.stock_sedile} u | Bodega: {item.stock_bodega} u)</span>
                      </div>
                    </div>
                  ))}

                  {statsChartType === 'autonomia' && autonomiaChartDataList.map((item, idx) => {
                    const days = item.diasDisp;
                    let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    let progressColor = 'bg-emerald-500';
                    if (days < 7) {
                      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-100';
                      progressColor = 'bg-rose-500';
                    } else if (days < 20) {
                      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                      progressColor = 'bg-amber-500';
                    }
                    const progressPct = Math.min((days / 30) * 100, 100);

                    return (
                      <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/55 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md mr-1.5">#{idx + 1}</span>
                            <span className="font-bold text-xs text-slate-800">{item.fullName}</span>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                            ⏳ {days} días
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Stock: <strong className="text-slate-700">{(item.stock_sedile + item.stock_bodega)} u</strong> | Consumo: <strong className="text-slate-700">{item.uso_diario} u/día</strong></span>
                          <span>(SEDILE: {item.stock_sedile} u | Bodega: {item.stock_bodega} u)</span>
                        </div>
                      </div>
                    );
                  })}

                  {statsChartType === 'stock' && stockChartDataList.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/55 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md mr-1.5">#{idx + 1}</span>
                          <span className="font-bold text-xs text-slate-800">{item.fullName}</span>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          📦 {item.stockTotal} unidades
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
                        <span>SEDILE: <strong className="text-slate-700">{item.stockSedile} u</strong> | Bodega: <strong className="text-slate-700">{item.stockBodega} u</strong></span>
                        <span>Consumo: {item.uso_diario > 0 ? `${item.uso_diario} u/día` : 'Sin uso'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Distribución del Stock Lácteo por Categorías 🍰</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Suma total de unidades físicas de stock institucional.</p>
            </div>
            <div className="h-80 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-64 w-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 w-full text-xs font-semibold">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-600">{entry.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold">{entry.value.toLocaleString()} uds</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* --- REGISTRO Y AUDITORÍA DE MERMAS (Reemplaza Planificador) --- */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                🗑️ Registro y Auditoría de Mermas
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Controle y registre el desperdicio de fórmulas lácteas por servicio y motivo. Las devoluciones para reutilizar no suman como pérdida neta.
              </p>
            </div>
          </div>

          {/* KPI Cards de Mermas */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mermas Netas Reales</p>
                <h4 className="text-2xl font-black text-rose-600 mt-1">{totalNetMermasUnits} <span className="text-xs font-bold text-slate-400">uds</span></h4>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Total acumulado de desperdicio físico real.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Devueltos para Reutilizar</p>
                <h4 className="text-2xl font-black text-emerald-600 mt-1">{totalReusableUnits} <span className="text-xs font-bold text-slate-400">uds</span></h4>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Sellados reutilizados (pérdida de tiempo logístico).</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Servicio Mayor Desperdicio</p>
                <h4 className="text-lg font-black text-slate-800 mt-1.5 truncate">{topSection}</h4>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Con {maxSectionLoss} unidades de merma neta.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mayor Motivo Pérdida</p>
                <h4 className="text-lg font-black text-slate-800 mt-1.5 truncate">{topReason}</h4>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Con {maxReasonLoss} unidades de merma neta.</p>
            </div>
          </div>

          {/* Formulario e Indicadores Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario (Column 1 - width 5/12) */}
            <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <PlusCircle className="w-4 h-4 text-purple-600" />
                Registrar Pérdida / Devolución
              </h4>

              <form onSubmit={handleAddMermaRecord} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Fecha</label>
                    <input
                      type="date"
                      required
                      value={newMerma.fecha || ''}
                      onChange={(e) => setNewMerma(prev => ({ ...prev, fecha: e.target.value }))}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Sección / Servicio de Procedencia</label>
                    <select
                      value={newMerma.seccion || '2°piso'}
                      onChange={(e) => setNewMerma(prev => ({ ...prev, seccion: e.target.value as any }))}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <optgroup label="Adultos (Pisos / UCO)">
                        <option value="2°piso">2°piso</option>
                        <option value="3°piso UCO">3°piso UCO</option>
                        <option value="4°piso">4°piso</option>
                        <option value="5°piso">5°piso</option>
                        <option value="6°piso">6°piso</option>
                        <option value="7°piso">7°piso</option>
                        <option value="8°piso">8°piso</option>
                      </optgroup>
                      <optgroup label="Pediatría (Servicios)">
                        <option value="Lactantes">Lactantes</option>
                        <option value="II infancia">II infancia</option>
                        <option value="Cirugia">Cirugia</option>
                        <option value="Timped">Timped</option>
                        <option value="Uciped">Uciped</option>
                        <option value="Oncoped">Oncoped</option>
                      </optgroup>
                      <optgroup label="Neonatología">
                        <option value="Neonatología">Neonatología</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Motivo de Pérdida / Retorno</label>
                  <select
                    value={newMerma.motivo || 'No se entrega'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewMerma(prev => ({ ...prev, motivo: val }));
                      if (val !== 'Otro') {
                        setOtroMotivoText('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="No se entrega">No se entrega</option>
                    <option value="Paciente no está">Paciente no está</option>
                    <option value="Ya tiene producto">Ya tiene producto</option>
                    <option value="Rechaza/no toma">Rechaza/no toma</option>
                    <option value="Leche materna">Leche materna</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="R0 no informado">R0 no informado</option>
                    <option value="En ayuno">En ayuno</option>
                    <option value="Aislamiento">Aislamiento</option>
                    <option value="Pab/Examen">Pab/Examen</option>
                    <option value="Trasladado">Trasladado</option>
                    <option value="Alta no informado">Alta no informado</option>
                    <option value="Paciente grave">Paciente grave</option>
                    <option value="Fallecido">Fallecido</option>
                    <option value="Otro">Otro (Escribir motivo...)</option>
                  </select>
                </div>

                {/* Si seleccionó "Otro", mostrar campo de texto corto */}
                {newMerma.motivo === 'Otro' && (
                  <div className="flex flex-col gap-1 animate-fade-in">
                    <label className="text-[9px] font-bold text-purple-600 uppercase">Especificar Otro Motivo</label>
                    <input
                      type="text"
                      placeholder="Especifique el motivo..."
                      required
                      value={otroMotivoText}
                      onChange={(e) => setOtroMotivoText(e.target.value)}
                      className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-purple-300"
                    />
                  </div>
                )}

                {/* Contenedor / Envase */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Unidad de Nutrición / Envase</label>
                  <select
                    value={newMerma.producto_unidad || 'Mamaderas'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setNewMerma(prev => ({ ...prev, producto_unidad: val }));
                      if (!['Mamaderas', 'Vasos con suplemento', 'Vasos con productos especiales', 'Jeringa BIC', 'Jeringa Gavage', 'Botellines', 'Jugos en caja'].includes(val)) {
                        setMermaSuplemento('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Mamaderas">Mamaderas</option>
                    <option value="Vasos con suplemento">Vasos con suplemento</option>
                    <option value="Vasos con productos especiales">Vasos con productos especiales</option>
                    <option value="Jeringa BIC">Jeringa BIC</option>
                    <option value="Jeringa Gavage">Jeringa Gavage</option>
                    <option value="Botellines">Botellines</option>
                    <option value="Jugos en caja">Jugos en caja</option>
                  </select>
                </div>

                {/* Si es líquido, mostrar campo manual de suplemento y campo CC */}
                {['Mamaderas', 'Vasos con suplemento', 'Vasos con productos especiales', 'Jeringa BIC', 'Jeringa Gavage', 'Botellines', 'Jugos en caja'].includes(newMerma.producto_unidad || '') ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Suplemento / Fórmula Mermada</label>
                      <input
                        type="text"
                        placeholder="Ej: Frebini, Puramino, etc."
                        required
                        value={mermaSuplemento}
                        onChange={(e) => setMermaSuplemento(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Volumen Mermado (cc)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Ej: 150"
                        value={newMerma.cantidad === 0 ? '' : newMerma.cantidad}
                        onChange={(e) => setNewMerma(prev => ({ ...prev, cantidad: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Cantidad (Unidades)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Ej: 5"
                      value={newMerma.cantidad === 0 ? '' : newMerma.cantidad}
                      onChange={(e) => setNewMerma(prev => ({ ...prev, cantidad: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingMermas}
                  className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-300 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {loadingMermas ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Registrar Evento de Merma
                </button>
              </form>
            </div>

            {/* Gráficos (Column 2 - width 7/12) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Donut Motivos */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-inner flex flex-col gap-2">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Motivos de Desperdicio Real</h5>
                  {motivoChartData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                      Sin datos de merma neta.
                    </div>
                  ) : (
                    <div>
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={motivoChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {motivoChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getMotivoColor(entry.name)} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} uds`, 'Cantidad']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1 mt-1 text-[9px] font-semibold">
                        {motivoChartData.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between border-b border-slate-50 pb-0.5">
                            <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getMotivoColor(entry.name) }}></span>
                              <span className="text-slate-500 truncate">{entry.name}</span>
                            </div>
                            <span className="text-slate-800 font-mono font-bold">{entry.value} uds ({Math.round((entry.value / (totalNetMermasUnits || 1)) * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bar Secciones */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-inner flex flex-col gap-2">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Mermas por Sección</h5>
                  {totalNetMermasUnits === 0 ? (
                    <div className="h-40 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                      Sin datos de merma neta.
                    </div>
                  ) : (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={seccionChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={65} />
                          <Tooltip formatter={(value) => [`${value} uds`, 'Merma Neta']} />
                          <Bar dataKey="Cantidad" fill="#8b5cf6" radius={[0, 3, 3, 0]}>
                            {seccionChartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#8b5cf6' : '#a78bfa'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bitácora de Registro de Mermas (Acordeón Anidado Mes y Día) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              📋 Historial y Bitácora de Desperdicio
            </h4>
            
            {mermasRecords.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs font-bold">
                No hay registros de mermas o retornos ingresados.
              </div>
            ) : (
              <div>
                {(() => {
                  const monthGroups = {};
                  const sortedMermas = [...mermasRecords].sort((a, b) => b.fecha.localeCompare(a.fecha));
                  
                  sortedMermas.forEach(r => {
                    const mKey = getMonthYearKey(r.fecha);
                    const dKey = r.fecha;
                    if (!monthGroups[mKey]) monthGroups[mKey] = {};
                    if (!monthGroups[mKey][dKey]) monthGroups[mKey][dKey] = [];
                    monthGroups[mKey][dKey].push(r);
                  });

                  const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
                    const firstDateA = Object.keys(monthGroups[a])[0] || '';
                    const firstDateB = Object.keys(monthGroups[b])[0] || '';
                    return firstDateB.localeCompare(firstDateA);
                  });

                  return sortedMonthKeys.map(monthKey => {
                    const isMonthExpanded = !!expandedMonths[monthKey];
                    
                    // Calcular estadísticas mensuales
                    let mQty = 0;
                    let mCost = 0;
                    Object.values(monthGroups[monthKey]).forEach((dayRecs) => {
                      dayRecs.forEach((r) => {
                        if (r.motivo !== 'Devolución para reutilizar') {
                          mQty += parseMermaRecord(r).isLiquid ? 1 : (r.cantidad || 0);
                          mCost += getMermaCost(r, formulaPricings);
                        }
                      });
                    });

                    return (
                      <div key={monthKey} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30 mb-4 shadow-sm transition-all duration-200">
                        {/* Cabecera del Mes */}
                        <button
                          onClick={() => setExpandedMonths(prev => ({ ...prev, [monthKey]: !isMonthExpanded }))}
                          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-100/70 hover:bg-slate-200/50 text-slate-800 transition-all font-bold text-sm cursor-pointer border-none focus:outline-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📅</span>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-sm font-black text-slate-800">{monthKey}</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Consolidado: {mQty} uds. desperdiciadas • Costo: $ {mCost.toLocaleString('es-CL')}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={"w-4 h-4 text-slate-500 transition-transform duration-200 " + (isMonthExpanded ? "rotate-180" : "")} />
                        </button>

                        {isMonthExpanded && (
                          <div className="p-4 bg-white divide-y divide-slate-100 flex flex-col gap-3">
                            {Object.keys(monthGroups[monthKey]).sort((a, b) => b.localeCompare(a)).map(dateKey => {
                              const dayRecords = monthGroups[monthKey][dateKey];
                              const isDateExpanded = !!expandedDates[dateKey];
                              
                              // Calcular estadísticas del día
                              let dQty = 0;
                              let dCost = 0;
                              dayRecords.forEach(r => {
                                if (r.motivo !== 'Devolución para reutilizar') {
                                  const parsed = parseMermaRecord(r);
                                  dQty += parsed.isLiquid ? 1 : r.cantidad;
                                  dCost += getMermaCost(r, formulaPricings);
                                }
                              });
                              
                              const dQtyLiquid = dayRecords.filter(r => r.motivo !== 'Devolución para reutilizar' && parseMermaRecord(r).isLiquid).reduce((sum, r) => sum + r.cantidad, 0);

                              return (
                                <div key={dateKey} className="border border-slate-150 rounded-xl overflow-hidden bg-white mb-2 shadow-sm transition-all duration-200">
                                  {/* Cabecera del Día */}
                                  <button
                                    onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !isDateExpanded }))}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 transition-all font-bold text-xs border-l-4 border-purple-600 border-t-0 border-r-0 border-b-0 cursor-pointer focus:outline-none"
                                  >
                                    <div className="flex flex-col items-start gap-0.5">
                                      <span className="text-xs font-bold text-slate-800">{formatFriendlyDate(dateKey)}</span>
                                      <span className="text-[10px] text-slate-500 font-semibold">
                                        Total Día: {dQtyLiquid > 0 ? (dQtyLiquid + " cc") : ""} {dQtyLiquid > 0 && dQty > 0 ? "+ " : ""} {dQty > 0 ? (dQty + " uds") : ""} • Costo: $ {dCost.toLocaleString('es-CL')}
                                      </span>
                                    </div>
                                    <ChevronDown className={"w-3.5 h-3.5 text-slate-400 transition-transform duration-200 " + (isDateExpanded ? "rotate-180" : "")} />
                                  </button>

                                  {isDateExpanded && (
                                    <div className="overflow-x-auto border-t border-slate-100">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-150">
                                            <th className="py-2.5 px-4">Sección</th>
                                            <th className="py-2.5 px-4">Unidad de Nutrición</th>
                                            <th className="py-2.5 px-4">Motivo</th>
                                            <th className="py-2.5 px-4 text-center">Cantidad</th>
                                            <th className="py-2.5 px-4 text-center">Estado Merma</th>
                                            <th className="py-2.5 px-4 text-center w-16">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                          {dayRecords.map(r => {
                                            const isReused = r.motivo === 'Devolución para reutilizar';
                                            const parsed = parseMermaRecord(r);
                                            return (
                                              <tr key={r.id} className="hover:bg-slate-50/30 text-slate-700 font-medium text-xs">
                                                <td className="py-2.5 px-4 font-semibold text-slate-600">
                                                  <div>{parsed.baseSection}</div>
                                                  {parsed.subServicio && (
                                                    <div className="text-[9px] text-indigo-600 font-black">{parsed.subServicio}</div>
                                                  )}
                                                </td>
                                                <td className="py-2.5 px-4 font-bold text-slate-700">
                                                  <div>{parsed.containerType}</div>
                                                  {parsed.supplementName && (
                                                    <div className="text-[9px] text-purple-600 font-black">{parsed.supplementName}</div>
                                                  )}
                                                </td>
                                                <td className="py-2.5 px-4 font-semibold text-slate-600">{r.motivo}</td>
                                                <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                                                  {parsed.isLiquid ? (r.cantidad + " cc") : (r.cantidad + " uds")}
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                  {isReused ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                      Reutilizado (0 merma)
                                                    </span>
                                                  ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                      Merma Real
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                  <button
                                                    onClick={() => handleDeleteMermaRecord(r.id)}
                                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                    title="Eliminar este registro"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
          
          {/* Mermas Export and Dashboard Buttons Container */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={copyMermasToWhatsApp}
              disabled={mermasRecords.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Copia el reporte estructurado de mermas para pegarlo directamente en WhatsApp"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Copiar Reporte (WhatsApp)</span>
            </button>

            <button
              onClick={copyMermasToExcel}
              disabled={mermasRecords.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Copia la bitácora completa en formato Excel (TSV)"
            >
              <Clipboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Copiar Bitácora (Excel)</span>
            </button>

            <button
              onClick={() => setShowMermasCostModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Abre el panel financiero de mermas e inventario para gestionar costos"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>Análisis de Costos y Mermas</span>
            </button>

            <button
              onClick={() => setShowMermasMonthModal(true)}
              disabled={mermasRecords.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Genera un informe gráfico en alta resolución por mes o histórico completo"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Generar Reporte de Mermas (Imagen)</span>
            </button>
          </div>
        </div>

      </div>
    );
  };

  const copyMermasToExcel = () => {
    if (mermasRecords.length === 0) return;
    let content = "Fecha\tSección\tUnidad de Nutrición\tMotivo\tCantidad\tEstado Merma\n";
    mermasRecords.forEach(r => {
      const isReused = r.motivo === 'Devolución para reutilizar';
      const estado = isReused ? "Reutilizado" : "Merma Real";
      content += r.fecha + "\t" + r.seccion + "\t" + r.producto_unidad + "\t" + r.motivo + "\t" + r.cantidad + "\t" + estado + "\n";
    });
    
    navigator.clipboard.writeText(content)
      .then(() => showToast("¡Bitácora de mermas copiada en formato Excel!", "success"))
      .catch(() => showToast("Error al copiar al portapapeles", "error"));
  };

  const copyMermasAsImage = (targetMonthKey?: string | 'all' | null) => {
    const isSpecificMonth = !!targetMonthKey && targetMonthKey !== 'all';
    const recordsToUse = isSpecificMonth
      ? mermasRecords.filter(r => getMonthYearKey(r.fecha) === targetMonthKey)
      : mermasRecords;

    if (recordsToUse.length === 0) {
      showToast("No hay registros de mermas para exportar en este período.", "error");
      return;
    }

    const periodName = isSpecificMonth ? targetMonthKey : "Histórico Completo";
    showToast("Generando reporte oficial de mermas (" + periodName + ")...", "success");

    const width = 2000;
    const totalHeight = 1080; // Altura ampliada para incluir el cuadro de estadísticas por servicio
    const titleHeight = 110;
    const footerHeight = 52;

    const canvas = document.createElement('canvas');
    const dpr = 2;
    canvas.width = width * dpr;
    canvas.height = totalHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const logoImg = new Image();
    logoImg.src = '/logo.png';

    // Función para dibujar iconos vectoriales a código en el canvas
    const drawCategoryIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
      ctx.save();
      ctx.strokeStyle = '#6b21a8'; // Color morado corporativo
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (type === 'Mamaderas') {
        // Cuerpo de la mamadera
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath();
        ctx.roundRect(x - 15, y - 10, 30, 40, 6);
        ctx.fill();
        ctx.stroke();

        // Líquido interior
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.roundRect(x - 12, y + 10, 24, 18, 3);
        ctx.fill();

        // Cuello de botella
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(x - 10, y - 16, 20, 6);

        // Chupete/Mamón
        ctx.fillStyle = '#db2777'; // Rosado
        ctx.beginPath();
        ctx.arc(x, y - 19, 6, 0, Math.PI, true);
        ctx.fill();
        ctx.stroke();

        // Marcas graduadas
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 2); ctx.lineTo(x - 5, y - 2);
        ctx.moveTo(x - 10, y + 8); ctx.lineTo(x - 5, y + 8);
        ctx.moveTo(x - 10, y + 18); ctx.lineTo(x - 5, y + 18);
        ctx.stroke();

      } else if (type === 'Vasos con suplemento' || type === 'Vasos con productos especiales') {
        const isSpecial = type === 'Vasos con productos especiales';
        
        // Vaso (Trapezoide invertido)
        ctx.fillStyle = isSpecial ? '#fdf2f8' : '#faf5ff';
        ctx.beginPath();
        ctx.moveTo(x - 18, y - 15);
        ctx.lineTo(x + 18, y - 15);
        ctx.lineTo(x + 12, y + 25);
        ctx.lineTo(x - 12, y + 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Líquido
        ctx.fillStyle = isSpecial ? '#f472b6' : '#a78bfa';
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 5);
        ctx.lineTo(x + 15, y + 5);
        ctx.lineTo(x + 12, y + 22);
        ctx.lineTo(x - 12, y + 22);
        ctx.closePath();
        ctx.fill();

        // Bombilla
        ctx.strokeStyle = isSpecial ? '#db2777' : '#7e22ce';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 15);
        ctx.lineTo(x - 8, y - 25);
        ctx.lineTo(x - 14, y - 23);
        ctx.stroke();

      } else if (type === 'Jeringas') {
        // Tubo de la jeringa
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.rect(x - 7, y - 20, 14, 40);
        ctx.fill();
        ctx.stroke();

        // Líquido interior
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(x - 5, y - 10, 10, 20);

        // Émbolo inferior
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 20);
        ctx.lineTo(x, y + 35);
        ctx.moveTo(x - 8, y + 35);
        ctx.lineTo(x + 8, y + 35);
        ctx.stroke();

        // Aguja superior
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x, y - 28);
        ctx.stroke();

        // Marcas graduadas
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 15); ctx.lineTo(x - 2, y - 15);
        ctx.moveTo(x - 5, y - 10); ctx.lineTo(x - 2, y - 10);
        ctx.moveTo(x - 5, y - 5); ctx.lineTo(x - 2, y - 5);
        ctx.moveTo(x - 5, y); ctx.lineTo(x - 2, y);
        ctx.moveTo(x - 5, y + 5); ctx.lineTo(x - 2, y + 5);
        ctx.moveTo(x - 5, y + 10); ctx.lineTo(x - 2, y + 10);
        ctx.stroke();

      } else if (type === 'Botellines') {
        // Botella base
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(x - 16, y - 5, 32, 30, 4);
        ctx.fill();
        ctx.stroke();

        // Líquido
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.roundRect(x - 13, y + 5, 26, 18, 2);
        ctx.fill();

        // Cuello
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 5);
        ctx.lineTo(x - 10, y - 15);
        ctx.lineTo(x + 10, y - 15);
        ctx.lineTo(x + 10, y - 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tapa
        ctx.fillStyle = '#6b21a8';
        ctx.fillRect(x - 12, y - 20, 24, 6);

      } else if (type === 'Jugos en caja') {
        // Caja de jugo
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.roundRect(x - 14, y - 18, 28, 38, 4);
        ctx.fill();
        ctx.stroke();

        // Detalle diagonal
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 8);
        ctx.lineTo(x + 10, y + 8);
        ctx.stroke();

        // Bombilla doblada
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 18);
        ctx.lineTo(x + 8, y - 26);
        ctx.lineTo(x + 13, y - 24);
        ctx.stroke();
      }

      ctx.restore();
    };

    // Función para dibujar gráficos circulares
    const drawCanvasPieChart = (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      radius: number,
      slices: { value: number; color: string }[]
    ) => {
      const total = slices.reduce((sum, s) => sum + s.value, 0);
      if (total === 0) return;
      let startAngle = -Math.PI / 2;
      slices.forEach(slice => {
        const sliceAngle = (slice.value / total) * Math.PI * 2;
        ctx.fillStyle = slice.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        startAngle += sliceAngle;
      });
    };

    const renderCanvas = () => {
      // Fondo Blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, totalHeight);

      // Banner Superior
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(0, 0, width, titleHeight - 16);

      // Título
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('AUDITORÍA OFICIAL DE MERMAS Y DESPERDICIOS', 94, 47);

      ctx.fillStyle = '#e9d5ff';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      const currentDate = new Date().toLocaleString('es-CL');
      const periodSubtitle = isSpecificMonth
        ? "Informe mensual de mermas • " + targetMonthKey
        : "Informe consolidado de mermas y análisis de costos (Histórico completo)";
      ctx.fillText(periodSubtitle + " • Generado el " + currentDate + " • SEDILE CEFE", 94, 74);

      // Logo
      try {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(52, 45, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.clip();
        ctx.drawImage(logoImg, 20, 13, 64, 64);
        ctx.restore();
      } catch (err) {}

      // Badge Confidencial
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.roundRect(width - 240 - 24, 30, 240, 34, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REPORTE AUDITORÍA INTERNA', width - 24 - 120, 51);

      // Procesar datos consolidados del período seleccionado
      const uniqueDates = [...new Set(recordsToUse.map(r => r.fecha))];
      const numDays = Math.max(1, uniqueDates.length);
      let totalMermasQty = 0;
      let totalMermasCost = 0;
      let totalReusedQty = 0;

      const motivoLoss = {};
      const seccionLoss = {};
      const categoryTotals = {};

      // Inicializar categorías de mermas preparadas
      const categoriesList = ['Mamaderas', 'Vasos con suplemento', 'Vasos con productos especiales', 'Jeringas', 'Botellines', 'Jugos en caja'];
      categoriesList.forEach(cat => {
        categoryTotals[cat] = 0;
      });

      const categoryCosts = {};
      categoriesList.forEach(cat => {
        categoryTotals[cat] = 0;
        categoryCosts[cat] = 0;
      });

      recordsToUse.forEach(r => {
        const isReused = r.motivo === 'Devolución para reutilizar';
        const qty = r.cantidad || 0;
        const parsed = parseMermaRecord(r);
        const recordCost = getMermaCost(r, formulaPricings);
        
        if (isReused) {
          totalReusedQty += parsed.isLiquid ? 0 : qty;
        } else {
          totalMermasQty += parsed.isLiquid ? 0 : qty;
          totalMermasCost += recordCost;

          if (categoryTotals[parsed.containerType] !== undefined) {
            categoryTotals[parsed.containerType] += parsed.isLiquid ? 0 : qty;
          }
          if (categoryCosts[parsed.containerType] !== undefined) {
            categoryCosts[parsed.containerType] += recordCost;
          }
          
          if (!motivoLoss[r.motivo]) motivoLoss[r.motivo] = { qty: 0, cost: 0 };
          motivoLoss[r.motivo].qty += parsed.isLiquid ? 0 : qty;
          motivoLoss[r.motivo].cost += recordCost;

          const baseSection = parsed.baseSection;
          if (!seccionLoss[baseSection]) seccionLoss[baseSection] = { qty: 0, cost: 0 };
          seccionLoss[baseSection].qty += parsed.isLiquid ? 0 : qty;
          seccionLoss[baseSection].cost += recordCost;
        }
      });

      // Calcular suplemento más mermado
      const supplementLosses: Record<string, number> = {};
      recordsToUse.forEach(r => {
        if (r.motivo !== 'Devolución para reutilizar') {
          const parsed = parseMermaRecord(r);
          if (parsed.isLiquid && parsed.supplementName) {
            const name = parsed.supplementName;
            supplementLosses[name] = (supplementLosses[name] || 0) + (r.cantidad || 0);
          }
        }
      });
      
      let mostMermadoName = 'Ninguno';
      let mostMermadoVol = 0;
      Object.keys(supplementLosses).forEach(name => {
        if (supplementLosses[name] > mostMermadoVol) {
          mostMermadoVol = supplementLosses[name];
          mostMermadoName = name;
        }
      });

      const avgMermasPerDay = totalMermasQty / numDays;
      const avgLossCostPerDay = totalMermasCost / numDays;
      const monthlyLossProjected = avgLossCostPerDay * 30;

      // Dibujar Tarjetas KPI (y = 115, alto 110)
      const drawKpiCard = (x, bg, border, label, val, sub) => {
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(x, 115, 425, 110, 16);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(label, x + 24, 142);

        ctx.fillStyle = '#0f172a';
        ctx.font = val.length > 18 ? 'black 22px system-ui' : val.length > 12 ? 'black 26px system-ui' : 'black 34px system-ui';
        ctx.fillText(val, x + 24, 185);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px system-ui';
        ctx.fillText(sub, x + 24, 210);
      };

      const kpiPeriodSub = isSpecificMonth
        ? "Período auditado: " + numDays + " día(s) con registros"
        : "Proyección mensual: $ " + Math.round(monthlyLossProjected).toLocaleString('es-CL');
      drawKpiCard(50, '#fef2f2', '#fee2e2', 'PÉRDIDA TOTAL ESTIMADA (MERMA REAL)', "$ " + totalMermasCost.toLocaleString('es-CL'), kpiPeriodSub);
      drawKpiCard(515, '#fffbeb', '#fef3c7', 'CANTIDAD TOTAL DESPERDICIADA', totalMermasQty + " unidades", "Promedio diario: " + avgMermasPerDay.toFixed(1) + " unidades/día");
      drawKpiCard(980, '#f0fdf4', '#dcfce7', 'CANTIDAD DE RETORNOS REUTILIZADOS', totalReusedQty + " unidades", "Tasa reutilización: " + Math.round((totalReusedQty / (totalMermasQty + totalReusedQty || 1)) * 100) + "%");
      drawKpiCard(1445, '#f5f3ff', '#ddd6fe', 'SUPLEMENTO MÁS MERMADO', mostMermadoName, mostMermadoVol > 0 ? ("Volumen total mermado: " + mostMermadoVol + " cc") : "Sin mermas registradas");

      // Columnas a partir de y = 250
      const startY = 250;

      // --- COLUMNA IZQUIERDA: CUADRÍCULA DE 6 TARJETAS VISUALES ---
      let cardRow = 0;
      let cardCol = 0;
      const cardWidth = 450;
      const cardHeight = 160;
      const leftXOffset = 50;
      const xGap = 40;
      const yGap = 24;

      categoriesList.forEach((cat) => {
        const x = leftXOffset + cardCol * (cardWidth + xGap);
        const y = startY + cardRow * (cardHeight + yGap);

        // Fondo y bordes de tarjeta
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dibujar icono vectorial a la izquierda
        drawCategoryIcon(ctx, x + 60, y + (cardHeight / 2), cat);

        // Información de texto a la derecha
        const qty = categoryTotals[cat];
        const cost = categoryCosts[cat] || 0;
        const pct = totalMermasCost > 0 ? Math.round((cost / totalMermasCost) * 100) : 0;

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(cat, x + 130, y + 25);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'black 32px system-ui';
        ctx.fillText(qty + " uds", x + 130, y + 60);

        ctx.fillStyle = '#991b1b'; // Rojo oscuro para pérdidas
        ctx.font = 'bold 16px system-ui';
        ctx.fillText("$ " + cost.toLocaleString('es-CL') + " (" + pct + "%)", x + 130, y + 105);

        // Mover cuadrícula
        cardCol++;
        if (cardCol > 1) {
          cardCol = 0;
          cardRow++;
        }
      });

      // --- COLUMNA DERECHA: DOS GRÁFICOS CIRCULARES DE TORTA ---
      const rightXOffset = 1040;
      const chartsBoxWidth = 910;

      // 1. Gráfico Circular de Motivos
      const box1Y = startY;
      const box1Height = 264;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(rightXOffset, box1Y, chartsBoxWidth, box1Height, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cabecera del gráfico
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(rightXOffset, box1Y, chartsBoxWidth, 44, { tl: 16, tr: 16, bl: 0, br: 0 });
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Distribución de Pérdidas por Motivo ($)', rightXOffset + 20, box1Y + 22);

      // Calcular rebanadas para motivos
      const motivoSlices = Object.keys(motivoLoss).map(mot => ({
        value: motivoLoss[mot].cost,
        color: MOTIVO_COLORS[mot] || '#cbd5e1',
        name: mot,
        qty: motivoLoss[mot].qty
      })).filter(s => s.value > 0);

      if (motivoSlices.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos de pérdidas por motivos.', rightXOffset + chartsBoxWidth / 2, box1Y + 150);
      } else {
        // Dibujar gráfico circular (Torta)
        drawCanvasPieChart(ctx, rightXOffset + 160, box1Y + 150, 80, motivoSlices);

        // Dibujar leyenda contigua
        let legendY = box1Y + 65;
        ctx.textBaseline = 'middle';
        motivoSlices.forEach(slice => {
          ctx.fillStyle = slice.color;
          ctx.fillRect(rightXOffset + 320, legendY - 8, 16, 16);

          const pct = totalMermasCost > 0 ? Math.round((slice.value / totalMermasCost) * 100) : 0;
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 13px system-ui';
          ctx.textAlign = 'left';
          ctx.fillText(slice.name + " (" + pct + "%)", rightXOffset + 350, legendY);

          ctx.fillStyle = '#64748b';
          ctx.font = '500 13px system-ui';
          ctx.fillText(slice.qty + " uds • $ " + slice.value.toLocaleString('es-CL'), rightXOffset + 680, legendY);

          legendY += 26;
        });
      }

      // 2. Gráfico Circular de Secciones
      const box2Y = startY + box1Height + 24;
      const box2Height = 240;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(rightXOffset, box2Y, chartsBoxWidth, box2Height, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cabecera del gráfico
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(rightXOffset, box2Y, chartsBoxWidth, 44, { tl: 16, tr: 16, bl: 0, br: 0 });
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Distribución de Pérdidas por Sección ($)', rightXOffset + 20, box2Y + 22);

      // Calcular rebanadas para secciones
      const sectionColors = {
        'Enterales': '#8b5cf6',
        'Pediatría': '#ec4899',
        'Neonatología': '#3b82f6'
      };

      const seccionSlices = Object.keys(seccionLoss).map(sec => ({
        value: seccionLoss[sec].cost,
        color: sectionColors[sec] || '#cbd5e1',
        name: sec,
        qty: seccionLoss[sec].qty
      })).filter(s => s.value > 0);

      if (seccionSlices.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos de pérdidas por secciones.', rightXOffset + chartsBoxWidth / 2, box2Y + 140);
      } else {
        // Dibujar gráfico circular (Torta)
        drawCanvasPieChart(ctx, rightXOffset + 160, box2Y + 140, 70, seccionSlices);

        // Dibujar leyenda contigua
        let legendY = box2Y + 65;
        ctx.textBaseline = 'middle';
        seccionSlices.forEach(slice => {
          ctx.fillStyle = slice.color;
          ctx.fillRect(rightXOffset + 320, legendY - 8, 16, 16);

          const pct = totalMermasCost > 0 ? Math.round((slice.value / totalMermasCost) * 100) : 0;
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 13px system-ui';
          ctx.textAlign = 'left';
          ctx.fillText("Servicio " + slice.name + " (" + pct + "%)", rightXOffset + 350, legendY);

          ctx.fillStyle = '#64748b';
          ctx.font = '500 13px system-ui';
          ctx.fillText(slice.qty + " uds • $ " + slice.value.toLocaleString('es-CL'), rightXOffset + 680, legendY);

          legendY += 30;
        });
      }

      // Línea divisoria central vertical
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rightXOffset - 25, startY);
      ctx.lineTo(rightXOffset - 25, startY + 528);
      ctx.stroke();

      // --- NUEVO CUADRO HORIZONTAL: ESTADÍSTICAS Y PROYECCIONES OPERATIVAS POR SERVICIO (y = 802) ---
      const summaryY = 802;
      const summaryHeight = 190;
      const summaryWidth = width - 100; // 1900px

      // Dibujar caja contenedora
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(50, summaryY, summaryWidth, summaryHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cabecera de la caja
      ctx.fillStyle = '#1e293b'; // dark slate
      ctx.beginPath();
      ctx.roundRect(50, summaryY, summaryWidth, 40, [16, 16, 0, 0]);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('📋 PROYECCIONES FINANCIERAS Y PROMEDIOS DE DESPERDICIO POR SERVICIO', 70, summaryY + 20);

      // Definir columnas por servicio
      const services = ['Enterales', 'Pediatría', 'Neonatología'];
      const serviceWidth = 633; // 1900 / 3 roughly
      
      services.forEach((service, idx) => {
        const colStartX = 50 + idx * serviceWidth;
        const midX = colStartX + serviceWidth / 2;

        // Datos del servicio
        let sQty = 0;
        let sCost = 0;
        recordsToUse.forEach(r => {
          if (r.seccion === service && r.motivo !== 'Devolución para reutilizar') {
            sQty += (r.cantidad || 0);
            sCost += getMermaCost(r, formulaPricings);
          }
        });

        const sDailyAvg = sQty / numDays;
        const sMonthlyQty = sDailyAvg * 30;
        const sMonthlyCost = (sCost / numDays) * 30;

        // Título del Servicio
        ctx.fillStyle = '#6b21a8'; // purple
        ctx.font = 'bold 17px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('SERVICIO ' + service.toUpperCase(), midX, summaryY + 68);

        // Promedio Diario
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 14px system-ui';
        ctx.fillText('Promedio Diario: ' + sDailyAvg.toFixed(1) + ' uds/día', midX, summaryY + 98);

        // Total Proyectado Mes
        ctx.fillText('Total Proyectado Mes: ' + Math.round(sMonthlyQty) + ' uds', midX, summaryY + 124);

        // Pérdida Financiera Proyectada
        ctx.fillStyle = '#991b1b';
        ctx.fillText('Pérdida Proyectada: $ ' + Math.round(sMonthlyCost).toLocaleString('es-CL') + '/mes', midX, summaryY + 150);

        // Semáforo de Estado
        let stateText = 'OPTIMIZADO';
        let stateBg = '#dcfce7'; // verde
        let stateFg = '#166534';
        
        if (sMonthlyCost > 50000) {
          stateText = 'CRÍTICO';
          stateBg = '#fee2e2'; // rojo
          stateFg = '#991b1b';
        } else if (sMonthlyCost > 20000) {
          stateText = 'BAJO OBSERVACIÓN';
          stateBg = '#fef3c7'; // naranjo
          stateFg = '#92400e';
        }

        ctx.fillStyle = stateBg;
        ctx.beginPath();
        ctx.roundRect(midX - 100, summaryY + 162, 200, 22, 11);
        ctx.fill();

        ctx.fillStyle = stateFg;
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(stateText, midX, summaryY + 173);

        // Dibujar líneas verticales divisorias (para col 1 y col 2)
        if (idx < 2) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(colStartX + serviceWidth, summaryY + 40);
          ctx.lineTo(colStartX + serviceWidth, summaryY + summaryHeight);
          ctx.stroke();
        }
      });

      // Pie de Reporte
      const footerY = totalHeight - footerHeight;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, footerY, width, footerHeight);

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 15px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const footerPeriod = isSpecificMonth ? "MES DE " + targetMonthKey.toUpperCase() : "HISTÓRICO COMPLETO";
      ctx.fillText('REPORTE AUDITORÍA MERMAS 2026 • ' + footerPeriod + ' • Información de control e indicadores financieros.', 24, footerY + 26);

      ctx.textAlign = 'right';
      ctx.fillText('Unidad de Nutrición • Hospital Regional de Antofagasta • SEDILE CEFE', width - 24, footerY + 26);

      // Exportar como imagen
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        const dateStr = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
        const safeMonthStr = isSpecificMonth ? targetMonthKey.replace(/\s+/g, '_') : 'Historico_' + dateStr;
        link.download = "Auditoria_Mermas_" + safeMonthStr + ".png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("¡Reporte oficial de mermas (" + (isSpecificMonth ? targetMonthKey : "Histórico") + ") descargado con éxito!", "success");
      } catch (err) {
        showToast("Error al exportar reporte de mermas", "error");
      }
    };

    logoImg.onload = renderCanvas;
    logoImg.onerror = renderCanvas;
  };


  const renderWorkloadView = () => {
    // --- NORMALIZACIÓN DE REGISTROS DE BITÁCORA (Soporte Fallback JSON y Compatibilidad) ---
    const normalizedRecords: WorkloadRecord[] = workloadRecords.map(r => {
      // Si ya tiene columnas nativas pobladas, es consolidado nativo
      if (r.is_consolidado && r.dotacion_teorica !== undefined) return r;
      
      // Si tiene JSON embebido de compatibilidad en observaciones
      if (r.observaciones && r.observaciones.includes('[COMPATIBILITY_JSON:')) {
        try {
          const startMarker = '[COMPATIBILITY_JSON:';
          const startIdx = r.observaciones.indexOf(startMarker);
          const endIdx = r.observaciones.indexOf(']', startIdx);
          if (startIdx !== -1 && endIdx !== -1) {
            const jsonStr = r.observaciones.substring(startIdx + startMarker.length, endIdx);
            const backupData = JSON.parse(jsonStr);
            const cleanObs = r.observaciones.substring(endIdx + 1).trim();
            return {
              ...r,
              is_consolidado: true,
              dotacion_teorica: backupData.dotacion_teorica || 10,
              dotacion_real: backupData.dotacion_real || 10,
              motivos_ausencia: backupData.motivos_ausencia || [],
              litros_lacteos: backupData.litros_lacteos || 0,
              litros_enterales: backupData.litros_enterales || 0,
              pacientes_atendidos: backupData.pacientes_atendidos || 0,
              productos_entregados: backupData.productos_entregados || 0,
              incidentes_detectados: backupData.incidentes_detectados || [],
              observaciones: cleanObs
            };
          }
        } catch (e) {
          console.error("Error al parsear JSON de compatibilidad:", e);
        }
      }
      
      // Si es un registro antiguo detallado por lote, simular compatibilidad
      if (r.categoria === 'Envasado / Preparación de Fórmulas') {
        return {
          ...r,
          is_consolidado: false,
          dotacion_teorica: 10,
          dotacion_real: 10,
          motivos_ausencia: [],
          litros_lacteos: (() => {
            const parsed = parseMermaRecord(r);
            return (parsed.isLiquid && parsed.baseSection !== 'Enterales') ? (r.cantidad / 1000) : 0;
          })(),
          litros_enterales: (() => {
            const parsed = parseMermaRecord(r);
            return (parsed.isLiquid && parsed.baseSection === 'Enterales') ? (r.cantidad / 1000) : 0;
          })(),
          pacientes_atendidos: r.cantidad > 0 ? 1 : 0,
          productos_entregados: r.cantidad,
          incidentes_detectados: r.observaciones ? [r.observaciones] : []
        };
      }

      return r;
    });

    const consolidated = normalizedRecords.filter(r => r.is_consolidado);
    const hasConsolidatedData = consolidated.length > 0;

    // --- PROCESAMIENTO DE KPIs (Datos Reales vs Fallback de Muestra) ---
    let totalLitersLacteos = 0;
    let totalLitersEnterales = 0;
    let totalPacientes = 0;
    let totalProductos = 0;
    let avgRealStaff = 10;
    let avgOverload = 1.0;
    let deficitShiftsCount = 0;

    if (hasConsolidatedData) {
      let staffSum = 0;
      let overloadSum = 0;
      consolidated.forEach(r => {
        totalLitersLacteos += r.litros_lacteos || 0;
        totalLitersEnterales += r.litros_enterales || 0;
        totalPacientes += r.pacientes_atendidos || 0;
        totalProductos += r.productos_entregados || 0;
        
        const real = r.dotacion_real || 10;
        const teorica = r.dotacion_teorica || 10;
        staffSum += real;
        overloadSum += real > 0 ? (teorica / real) : 1;
        if (real < teorica) {
          deficitShiftsCount++;
        }
      });
      avgRealStaff = Math.round((staffSum / consolidated.length) * 10) / 10;
      avgOverload = Math.round((overloadSum / consolidated.length) * 100) / 100;
    } else {
      // Fallback a los datos de la muestra del estudio
      totalLitersLacteos = 17.85;
      totalLitersEnterales = 11.2;
      totalPacientes = 170; // 123 + 47
      totalProductos = 191; // 130 + 61
      avgRealStaff = 7.5; // simula ausentismo
      avgOverload = 1.33; // simula sobrecarga
      deficitShiftsCount = 3;
    }

    // --- DATOS PARA GRÁFICOS (Recharts) ---
    
    // Gráfico 1: Dotación Real vs Teórica
    const dotacionChartData = hasConsolidatedData 
      ? consolidated.slice(0, 10).reverse().map(r => ({
          name: r.fecha.substring(8, 10) + '/' + r.fecha.substring(5, 7) + ' ' + r.turno,
          'Dotación Real': r.dotacion_real || 10,
          'Dotación Teórica': r.dotacion_teorica || 10,
          overload: r.dotacion_real && r.dotacion_real > 0 ? (r.dotacion_teorica || 10) / r.dotacion_real : 1
        }))
      : [
          { name: '15/06 Día', 'Dotación Real': 10, 'Dotación Teórica': 10 },
          { name: '16/06 Día', 'Dotación Real': 7, 'Dotación Teórica': 10 },
          { name: '17/06 Noche', 'Dotación Real': 8, 'Dotación Teórica': 10 },
          { name: '18/06 Día', 'Dotación Real': 10, 'Dotación Teórica': 10 },
          { name: '19/06 Día', 'Dotación Real': 7, 'Dotación Teórica': 10 },
          { name: '20/06 Noche', 'Dotación Real': 8, 'Dotación Teórica': 10 }
        ];

    // Gráfico 2: Producción de Litros
    const litrosChartData = hasConsolidatedData
      ? consolidated.slice(0, 10).reverse().map(r => ({
          name: r.fecha.substring(8, 10) + '/' + r.fecha.substring(5, 7) + ' ' + r.turno,
          'Lácteos (L)': r.litros_lacteos || 0,
          'Enterales (L)': r.litros_enterales || 0
        }))
      : [
          { name: '15/06 Día', 'Lácteos (L)': 15.2, 'Enterales (L)': 8.5 },
          { name: '16/06 Día', 'Lácteos (L)': 17.8, 'Enterales (L)': 11.2 },
          { name: '17/06 Noche', 'Lácteos (L)': 12.0, 'Enterales (L)': 9.0 },
          { name: '18/06 Día', 'Lácteos (L)': 18.5, 'Enterales (L)': 10.5 },
          { name: '19/06 Día', 'Lácteos (L)': 17.85, 'Enterales (L)': 11.2 },
          { name: '20/06 Noche', 'Lácteos (L)': 14.2, 'Enterales (L)': 8.0 }
        ];

    // Gráfico 3: Carga Logística (Pacientes y Productos)
    const logisticaChartData = hasConsolidatedData
      ? consolidated.slice(0, 10).reverse().map(r => ({
          name: r.fecha.substring(8, 10) + '/' + r.fecha.substring(5, 7) + ' ' + r.turno,
          'Pacientes Atendidos': r.pacientes_atendidos || 0,
          'Productos Entregados': r.productos_entregados || 0
        }))
      : [
          { name: '15/06 Día', 'Pacientes Atendidos': 140, 'Productos Entregados': 160 },
          { name: '16/06 Día', 'Pacientes Atendidos': 155, 'Productos Entregados': 180 },
          { name: '17/06 Noche', 'Pacientes Atendidos': 130, 'Productos Entregados': 145 },
          { name: '18/06 Día', 'Pacientes Atendidos': 168, 'Productos Entregados': 195 },
          { name: '19/06 Día', 'Pacientes Atendidos': 170, 'Productos Entregados': 191 },
          { name: '20/06 Noche', 'Pacientes Atendidos': 138, 'Productos Entregados': 152 }
        ];

    // Gráfico 4: Frecuencia de Incidentes
    const incidentCounts: Record<string, number> = {
      'Altas no informadas en sala': 0,
      'Cambios de habitación sin aviso': 0,
      'Pedidos de Urgencia ("Fuera de hora")': 0,
      'Falta de apoyo y demoras externas': 0
    };

    if (hasConsolidatedData) {
      consolidated.forEach(r => {
        if (r.incidentes_detectados) {
          r.incidentes_detectados.forEach(inc => {
            if (incidentCounts[inc] !== undefined) {
              incidentCounts[inc]++;
            }
          });
        }
      });
    } else {
      // Datos fijos de frecuencia del ausentismo/estudio
      incidentCounts['Altas no informadas en sala'] = 4;
      incidentCounts['Cambios de habitación sin aviso'] = 3;
      incidentCounts['Pedidos de Urgencia ("Fuera de hora")'] = 5;
      incidentCounts['Falta de apoyo y demoras externas'] = 2;
    }

    const totalShifts = hasConsolidatedData ? consolidated.length : 6;
    const incidentesChartData = Object.keys(incidentCounts).map(key => ({
      name: key,
      'Frecuencia (%)': Math.round((incidentCounts[key] / totalShifts) * 100)
    }));

    const fixedInvisibleData = [
      { name: 'Lavado y desconche', value: 24.5, range: '22-27 min', color: '#8b5cf6' },
      { name: 'Registros manuales', value: 26.0, range: '19-33 min', color: '#ec4899' },
      { name: 'Ida a bodega', value: 26.0, range: '26 min', color: '#3b82f6' },
      { name: 'Lavandería (sabanillas)', value: 31.0, range: '31 min', color: '#10b981' },
      { name: 'Esterilización agua', value: 15.0, range: '15 min', color: '#f59e0b' }
    ];

    const totalInvisibleMins = fixedInvisibleData.reduce((sum, item) => sum + item.value, 0);

    // Ausencia helper
    const handleAusenciaCheckboxChange = (motivo: string, checked: boolean) => {
      const current = newWorkload.motivos_ausencia || [];
      const updated = checked 
        ? [...current, motivo]
        : current.filter(m => m !== motivo);
      setNewWorkload(prev => ({ ...prev, motivos_ausencia: updated }));
    };

    // Incident helper
    const handleIncidenteCheckboxChange = (incidente: string, checked: boolean) => {
      const current = newWorkload.incidentes_detectados || [];
      const updated = checked
        ? [...current, incidente]
        : current.filter(i => i !== incidente);
      setNewWorkload(prev => ({ ...prev, incidentes_detectados: updated }));
    };

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        
        {/* --- BANNER DE BIENVENIDA EMPÁTICO --- */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 border border-purple-800/30 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-purple-500/30 inline-flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3 text-purple-400" />
                Estudio Operativo de Carga Laboral y Ausentismo
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                Carga Laboral y Operatividad SEDILE/CEFE
              </h2>
              <p className="text-xs text-purple-100/90 mt-1.5 max-w-3xl font-bold leading-relaxed italic font-medium">
                "Visibilizar el gran esfuerzo logístico, de preparación y el trabajo silencioso que realiza el equipo de SEDILE/CEFE diariamente para asegurar la nutrición de los pacientes"
              </p>
            </div>
            <button
              onClick={copyWorkloadToClipboard}
              disabled={workloadRecords.length === 0}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white text-indigo-950 hover:bg-purple-50 disabled:bg-purple-800/40 disabled:text-purple-300 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-purple-600" />
              <span>Copiar Bitácora (Excel)</span>
            </button>
          </div>
        </div>

        {/* Badge de Fallback */}
        {!hasConsolidatedData && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-bold flex items-center justify-between shadow-sm animate-pulse">
            <span>⚠️ Mostrando datos de simulación basados en muestras. ¡Ingresa resúmenes de turnos abajo para ver estadísticas reales!</span>
            {!isConfigured && <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px]">Modo Local / Demo</span>}
          </div>
        )}

        {/* --- KPI SUMMARY GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Dotación Promedio */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dotación Promedio Real</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{avgRealStaff} <span className="text-xs text-slate-400 font-bold">de 10 nominal</span></h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                Promedio de técnicos efectivamente presentes por turno.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">Turnos con ausentismo:</span>
              <span className={"font-black px-2 py-0.5 rounded-lg " + (deficitShiftsCount > 0 ? "text-rose-600 bg-rose-50 border border-rose-100" : "text-emerald-600 bg-emerald-50")}>
                {deficitShiftsCount} turnos
              </span>
            </div>
          </div>

          {/* KPI 2: Factor de Sobrecarga */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Índice de Sobrecarga</p>
              <h3 className="text-3xl font-black text-purple-700 mt-1">x{avgOverload} <span className="text-xs text-purple-400 font-bold">FTE/Téc</span></h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                Cada técnico presente asume la carga laboral equivalente a {avgOverload} personas.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">Estado Clínico:</span>
              <span className={"font-black px-2.5 py-0.5 rounded-lg text-[10px] uppercase " + (
                avgOverload > 1.3 ? "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse" : 
                avgOverload > 1.1 ? "bg-amber-50 text-amber-700 border border-amber-100" : 
                "bg-emerald-50 text-emerald-700 border border-emerald-100"
              )}>
                {avgOverload > 1.3 ? "Riesgo Crítico" : avgOverload > 1.1 ? "Sobrecarga" : "Operación Segura"}
              </span>
            </div>
          </div>

          {/* KPI 3: Litros Preparados */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volumen de Producción</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {(totalLitersLacteos + totalLitersEnterales).toFixed(1)} <span className="text-xs text-slate-400 font-bold">Litros</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                Total acumulado en el periodo de estudio.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-bold">
              <span>Lácteos: {totalLitersLacteos.toFixed(1)}L</span>
              <span>Enterales: {totalLitersEnterales.toFixed(1)}L</span>
            </div>
          </div>

          {/* KPI 4: Pacientes y Entregas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carga Logística Total</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {totalProductos} <span className="text-xs text-slate-400 font-bold">Productos</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                Entregados a {totalPacientes} pacientes hospitalizados.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-bold">
              <span>Pacientes: {totalPacientes}</span>
              <span>Rendimiento: {(totalProductos > 0 && totalPacientes > 0 ? totalProductos / totalPacientes : 1.2).toFixed(1)} p/pac</span>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE FORMULARIO E INGRESO DE RESUMEN --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Formulario Consolidado (5/12) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <PlusCircle className="w-4 h-4 text-purple-600" />
              Registrar Resumen de Turno (SEDILE/CEFE)
            </h3>

            <form onSubmit={handleAddWorkloadRecord} className="flex flex-col gap-3.5">
              
              {/* Fecha y Turno */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha del Turno</label>
                  <input
                    type="date"
                    required
                    value={newWorkload.fecha || ''}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, fecha: e.target.value }))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Turno</label>
                  <select
                    value={newWorkload.turno || 'Día'}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, turno: e.target.value as any }))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Día">Día (08:00 - 20:00)</option>
                    <option value="Noche">Noche (20:00 - 08:00)</option>
                  </select>
                </div>
              </div>

              {/* Dotación Nominal (Teórica) y Real */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dotación Teórica (Nominal)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newWorkload.dotacion_teorica}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, dotacion_teorica: Number(e.target.value) || 10 }))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dotación Real Presente</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newWorkload.dotacion_real}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, dotacion_real: Number(e.target.value) || 10 }))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Checkboxes de Ausencias (Si dotación real < dotación teórica) */}
              {(newWorkload.dotacion_real || 10) < (newWorkload.dotacion_teorica || 10) && (
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex flex-col gap-2 animate-fade-in">
                  <span className="text-[9px] font-black text-rose-800 uppercase">⚠️ Registrar causas de las ausencias ({ (newWorkload.dotacion_teorica || 10) - (newWorkload.dotacion_real || 10) } personas):</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-rose-955 font-bold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={(newWorkload.motivos_ausencia || []).includes('Licencia Médica')}
                        onChange={(e) => handleAusenciaCheckboxChange('Licencia Médica', e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500/20 w-3.5 h-3.5"
                      />
                      <span>Licencia Médica</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={(newWorkload.motivos_ausencia || []).includes('Vacaciones / Feriado')}
                        onChange={(e) => handleAusenciaCheckboxChange('Vacaciones / Feriado', e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500/20 w-3.5 h-3.5"
                      />
                      <span>Vacaciones / Feriado</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={(newWorkload.motivos_ausencia || []).includes('Permiso Administrativo')}
                        onChange={(e) => handleAusenciaCheckboxChange('Permiso Administrativo', e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500/20 w-3.5 h-3.5"
                      />
                      <span>Permiso</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={(newWorkload.motivos_ausencia || []).includes('Ausencia injustificada')}
                        onChange={(e) => handleAusenciaCheckboxChange('Ausencia injustificada', e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500/20 w-3.5 h-3.5"
                      />
                      <span>Injustificada</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Producción de Fórmulas en Litros */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Litros Lácteos preparados</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 17.85"
                    value={newWorkload.litros_lacteos === 0 ? '' : newWorkload.litros_lacteos}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, litros_lacteos: Number(e.target.value) || 0 }))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Litros Enterales preparados</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 11.2"
                    value={newWorkload.litros_enterales === 0 ? '' : newWorkload.litros_enterales}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, litros_enterales: Number(e.target.value) || 0 }))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Pacientes y Productos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pacientes atendidos</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 170"
                    value={newWorkload.pacientes_atendidos === 0 ? '' : newWorkload.pacientes_atendidos}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, pacientes_atendidos: Number(e.target.value) || 0 }))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Productos entregados</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 191"
                    value={newWorkload.productos_entregados === 0 ? '' : newWorkload.productos_entregados}
                    onChange={(e) => setNewWorkload(prev => ({ ...prev, productos_entregados: Number(e.target.value) || 0 }))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Checkboxes de Incidentes / Alertas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Incidentes / Retrasos del Turno</label>
                <div className="border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2 text-[10px] font-bold text-slate-650">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                    <input 
                      type="checkbox"
                      checked={(newWorkload.incidentes_detectados || []).includes('Altas no informadas en sala')}
                      onChange={(e) => handleIncidenteCheckboxChange('Altas no informadas en sala', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500/20 w-3.5 h-3.5"
                    />
                    <span>Altas no informadas en sala (provoca mermas)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                    <input 
                      type="checkbox"
                      checked={(newWorkload.incidentes_detectados || []).includes('Cambios de habitación sin aviso')}
                      onChange={(e) => handleIncidenteCheckboxChange('Cambios de habitación sin aviso', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500/20 w-3.5 h-3.5"
                    />
                    <span>Cambios de habitación sin aviso (retrasos en ruta)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                    <input 
                      type="checkbox"
                      checked={(newWorkload.incidentes_detectados || []).includes('Pedidos de Urgencia ("Fuera de hora")')}
                      onChange={(e) => handleIncidenteCheckboxChange('Pedidos de Urgencia ("Fuera de hora")', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500/20 w-3.5 h-3.5"
                    />
                    <span>Pedidos de urgencia fuera de hora</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                    <input 
                      type="checkbox"
                      checked={(newWorkload.incidentes_detectados || []).includes('Falta de apoyo y demoras externas')}
                      onChange={(e) => handleIncidenteCheckboxChange('Falta de apoyo y demoras externas', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500/20 w-3.5 h-3.5"
                    />
                    <span>Falta de carros o asistencia de enfermería</span>
                  </label>
                </div>
              </div>

              {/* Observaciones */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Observación General / Notas</label>
                <input
                  type="text"
                  placeholder="Detallar eventos excepcionales del turno..."
                  value={newWorkload.observaciones || ''}
                  onChange={(e) => setNewWorkload(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loadingWorkload}
                className="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-300 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                {loadingWorkload ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Guardar Resumen de Turno</span>
              </button>
            </form>
          </div>

          {/* Gráficos de Dotación e Incidentes (7/12) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Gráfico 1: Dotación Teórica vs Real */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Brecha de Personal: Dotación Real vs Teórica
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Muestra la diferencia entre los 10 técnicos nominales requeridos y el personal real que trabajó en cada turno.
                </p>
              </div>

              <div className="my-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dotacionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 12]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Legend verticalAlign="top" height={36} iconSize={10} style={{ fontSize: '10px' }} />
                    <Bar name="Dotación Real" dataKey="Dotación Real" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar name="Dotación Teórica" dataKey="Dotación Teórica" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 4: Frecuencia de Incidentes en Turnos */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Cuellos de Botella más Frecuentes (% de turnos afectados)
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Muestra la frecuencia porcentual de eventos adversos que interrumpen el flujo regular de SEDILE/CEFE.
                </p>
              </div>

              <div className="my-3">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart layout="vertical" data={incidentesChartData} margin={{ top: 10, right: 10, left: 35, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} unit="%" domain={[0, 100]} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={120} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(value) => [value + '%', 'Frecuencia de Ocurrencia']} 
                    />
                    <Bar dataKey="Frecuencia (%)" radius={[0, 4, 4, 0]}>
                      {incidentesChartData.map((entry, index) => {
                        const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#64748b'];
                        return <Cell key={'cell-' + index} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* --- SEGUNDA LÍNEA DE GRÁFICOS (LITROS Y LOGÍSTICA) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 2: Producción de Litros */}
          <div className="lg:col-span-6 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Volumen Clínico Preparado: Lácteos vs Enterales (Litros)
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Comportamiento histórico del volumen en litros procesado por turno.
              </p>
            </div>

            <div className="my-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={litrosChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} unit=" L" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" height={36} iconSize={10} style={{ fontSize: '10px' }} />
                  <Line type="monotone" name="Fórmulas Lácteas" dataKey="Lácteos (L)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Soportes Enterales" dataKey="Enterales (L)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 3: Carga Logística (Pacientes y Productos) */}
          <div className="lg:col-span-6 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Carga Logística y de Distribución: Pacientes vs Productos
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Evolución de los pacientes hospitalizados visitados y número de preparados entregados.
              </p>
            </div>

            <div className="my-4">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={logisticaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" height={36} iconSize={10} style={{ fontSize: '10px' }} />
                  <Area type="monotone" name="Productos Entregados" dataKey="Productos Entregados" stroke="#8b5cf6" fill="#f3e8ff" strokeWidth={2} />
                  <Area type="monotone" name="Pacientes Atendidos" dataKey="Pacientes Atendidos" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- TRABAJO INVISIBLE (Información Basal de Muestra Estática) --- */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              El Trabajo Invisible Basal (Tareas Logísticas No Clínicas por Turno)
            </h3>
            <p className="text-[11px] text-purple-900 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 mt-2 font-bold leading-relaxed">
              📢 Las tareas logísticas complementarias suman casi 2 horas (<strong className="text-purple-700">{totalInvisibleMins} minutos</strong>) por turno de trabajo logístico adicional por técnico que no se registra como envasado directo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 my-4">
            {/* Gráfico de Torta */}
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-[200px]">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={fixedInvisibleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {fixedInvisibleData.map((entry, index) => (
                        <Cell key={'cell-' + index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(value) => [value + ' min', 'Promedio']} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leyenda personalizada */}
            <div className="md:col-span-6 flex flex-col gap-2">
              {fixedInvisibleData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-medium border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-2 text-slate-600 truncate max-w-[190px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                    <span className="truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono font-black text-slate-800 shrink-0">
                    {entry.value} min ({entry.range})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- SECCIÓN 4: INTEGRACIÓN COLAPSABLE DE BITÁCORA EXISTENTE (HISTÓRICO Y EDICIÓN) --- */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex justify-center">
            <button
              onClick={() => setShowOriginalLog(prev => !prev)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {showOriginalLog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showOriginalLog ? 'Ocultar Historial y Configuración de Planta' : 'Ver Historial Completo y Configuración de Planta'}</span>
            </button>
          </div>

          {showOriginalLog && (
            <div className="flex flex-col gap-6 p-4 bg-slate-100/50 rounded-3xl border border-slate-200/60 mt-2 animate-fade-in">
              
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-700" />
                  Módulo de Ajustes de Planta e Historial Supabase DB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                  Ajustar los parámetros de días y dotación promedio general, y visualizar/eliminar registros específicos.
                </p>
              </div>

              {/* Configuración de Planta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Parámetros Generales de Muestreo
                  </h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Días del Estudio (Muestreo)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={workloadDaysLimit}
                      onChange={(e) => setWorkloadDaysLimit(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-400 font-medium italic">
                      * Turnos totales con registros activos: <strong className="text-slate-600">{normalizedRecords.length}</strong>.
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Dotación Teórica Promedio
                  </h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Técnicos por Turno Teóricos</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={workloadStaffCount}
                      onChange={(e) => setWorkloadStaffCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de Registros Completa (Nuevos y Antiguos) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    📋 Bitácora del Estudio de Tiempos (Registros consolidados e individuales)
                  </h3>
                </div>

                {normalizedRecords.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs font-bold">
                    La bitácora está vacía. Comience ingresando resúmenes de turno en el formulario.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="py-3 px-4 w-28">Fecha</th>
                          <th className="py-3 px-4">Turno</th>
                          <th className="py-3 px-4">Área / Registro</th>
                          <th className="py-3 px-4 text-center">Dotación Real / Qty</th>
                          <th className="py-3 px-4 text-center">Litros Lácteos</th>
                          <th className="py-3 px-4 text-center">Litros Enterales</th>
                          <th className="py-3 px-4 text-center">Pacientes / Prod</th>
                          <th className="py-3 px-4">Incidentes / Observaciones</th>
                          <th className="py-3 px-4 text-center w-16">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {normalizedRecords.map((r) => {
                          const isCons = r.is_consolidado;
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/30 text-slate-700 font-medium">
                              <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800">{r.fecha}</td>
                              <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-600">
                                <span className={"px-2.5 py-1 rounded-full text-[10px] " + (
                                  r.turno === 'Día' ? 'bg-amber-100 text-amber-800' : 'bg-slate-700 text-slate-100'
                                )}>
                                  {r.turno}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">
                                {isCons ? 'Consolidado Turno' : r.area}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {isCons ? (r.dotacion_real + ' / ' + r.dotacion_teorica) : r.cantidad}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {isCons ? (r.litros_lacteos ? r.litros_lacteos.toFixed(2) + ' L' : '0.00 L') : '-'}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {isCons ? (r.litros_enterales ? r.litros_enterales.toFixed(2) + ' L' : '0.00 L') : '-'}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {isCons ? (r.pacientes_atendidos + ' p / ' + r.productos_entregados + ' pr') : '-'}
                              </td>
                              <td className="py-3 px-4 text-xs italic text-slate-500">
                                {isCons ? (
                                  <div className="flex flex-col gap-0.5">
                                    {(r.motivos_ausencia && r.motivos_ausencia.length > 0) && (
                                      <span className="text-rose-600 font-bold">Ausencias: {r.motivos_ausencia.join(', ')}</span>
                                    )}
                                    {(r.incidentes_detectados && r.incidentes_detectados.length > 0) && (
                                      <span className="text-purple-600 font-bold">Alertas: {r.incidentes_detectados.join(', ')}</span>
                                    )}
                                    {r.observaciones && <span>Obs: {r.observaciones}</span>}
                                  </div>
                                ) : (r.observaciones || '-')}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDeleteWorkloadRecord(r.id)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Eliminar este registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
          )}
        </div>

        {/* 
          --- CHART.JS REFERENCE FOR FUTURE DEVELOPMENT ---
          To switch to pure Chart.js in the future instead of Recharts:
          
          1. Install: npm install chart.js react-chartjs-2
          2. Import in App.tsx:
             import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale } from 'chart.js';
             import { Bar, Line, Pie } from 'react-chartjs-2';
             ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale);
             
          3. Usage for times/dotación comparison bar chart:
             const data = {
               labels: dotacionChartData.map(d => d.name),
               datasets: [
                 {
                   label: 'Dotación Real',
                   data: dotacionChartData.map(d => d['Dotación Real']),
                   backgroundColor: '#8b5cf6',
                   borderRadius: 4
                 },
                 {
                   label: 'Dotación Teórica',
                   data: dotacionChartData.map(d => d['Dotación Teórica']),
                   backgroundColor: '#cbd5e1',
                   borderRadius: 4
                 }
               ]
             };
             return <Bar data={data} />;
        */}

      </div>
    );
  };;
;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* --- HEADER PRINCIPAL (Diseño Premium Symmetrical) --- */}
      <header className="bg-gradient-to-r from-purple-800 via-purple-700 to-slate-800 text-white shadow-md relative overflow-hidden">
        {/* Adorno de fondo médico/digital */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        
        <div className="max-w-7xl 2xl:max-w-[96vw] mx-auto px-4 py-5 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Lado Izquierdo: Título */}
          <div className="flex items-center gap-4 text-center md:text-left w-full md:w-1/3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner shrink-0 mx-auto md:mx-0">
              <Database className="w-6 h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-purple-50">STOCK SEDILE 2026</h1>
              <p className="text-xs text-purple-100/70 font-semibold tracking-wide uppercase mt-0.5">Control de Inventario y Bodega</p>
            </div>
          </div>
          
          {/* Lado Central: LOGO CENTRADO Y ADAPTADO AL FONDO (Sello circular) */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/3 group">
            <div className="relative">
              {/* Resplandor animado de fondo */}
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-md group-hover:scale-110 transition-transform duration-500"></div>
              {/* Contenedor circular blanco premium estilo sello clínico */}
              <div className="relative bg-white p-1 rounded-full shadow-lg border-2 border-purple-300/50 flex items-center justify-center w-20 h-20 overflow-hidden transform hover:rotate-6 transition-all duration-300">
                <img 
                  src="/logo.png" 
                  className="w-18 h-18 object-contain rounded-full" 
                  alt="Unidad de Nutrición SEDILE-CEFE" 
                  onError={(e) => {
                    // Fallback en caso de error de carga
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <span className="text-[10px] text-purple-100/80 font-bold uppercase tracking-widest mt-2 bg-slate-900/30 px-3 py-0.5 rounded-full border border-purple-500/10">
              Unidad de nutricion - SEDILE-CEFE
            </span>
          </div>

          {/* Lado Derecho: Controles de Rol */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full md:w-[45%]">
            {/* Conectado/Offline badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border ${
              isDbConnected 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}>
              {isDbConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  Tiempo Real Activo
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Caché Local Offline
                </>
              )}
            </div>

            {/* Pestañas de Navegación del Administrador */}
            {isAdmin && (
              <div className="flex bg-slate-900/40 p-0.5 rounded-xl border border-slate-700/50">
                <button
                  onClick={() => {
                    setViewMode('table');
                    setIsGlobalEditMode(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Ver tabla de stock de bodega"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Inventario</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('analytics');
                    setIsGlobalEditMode(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'analytics'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Ver dashboard y análisis estadístico"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Estadísticas</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('workload');
                    setIsGlobalEditMode(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'workload'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Ver estudio de carga laboral y dotación"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Carga Laboral</span>
                </button>
              </div>
            )}

            {/* Admin Switcher Button */}
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 px-4 py-2 rounded-xl text-xs font-bold text-purple-200 transition-all shadow-inner active:scale-95"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin (Cerrar)</span>
                <LogOut className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>
            ) : (
              <button
                onClick={() => setShowPinModal(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 border border-teal-500 hover:border-teal-400 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso Administrador</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- PANEL DE ACCIÓN Y DATOS RÁPIDOS --- */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[96vw] w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        
        {/* --- DASHBOARD ADMIN RESUMEN (Visible para Admin) --- */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productos Totales</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalProducts}</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Registrados en inventario</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm shrink-0">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Crítico (&lt; 7 días)</p>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{criticalProductsCount}</h3>
                <p className="text-[11px] sm:text-xs text-rose-500/80 mt-0.5">Requieren reposición urgente</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Bajo (7-20 días)</p>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{lowProductsCount}</h3>
                <p className="text-[11px] sm:text-xs text-amber-500/80 mt-0.5">Fórmulas bajo observación</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'analytics' ? (
          renderAnalyticsView()
        ) : viewMode === 'workload' ? (
          renderWorkloadView()
        ) : (
          <>
            {/* --- FILTROS, BÚSQUEDA Y EXPORTACIÓN --- */}
        <div className="flex flex-col gap-4">
          {/* Nivel 1: Filtros de Tabla y Búsqueda (Principales) */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/60 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Lado Izquierdo: Buscador reactivo y Última Actualización */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block w-full sm:w-auto text-center shrink-0">
                {lastUpdatedText}
              </div>
            </div>

            {/* Lado Derecho: Filtros y Visualización */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              
              {/* Filtro Crítico */}
              {isAdmin && (
                <button
                  onClick={() => setFilterCritical(!filterCritical)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    filterCritical 
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${filterCritical ? 'text-rose-600' : 'text-slate-400'}`} />
                  Ver solo Críticos
                </button>
              )}

              {/* Filtro Ocultos */}
              {isAdmin && (
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    showHidden 
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Muestra u oculta los productos marcados como ocultos de la bodega"
                >
                  {showHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                  Ver Ocultos
                </button>
              )}

              {/* Filtro Ordenar por Licitación */}
              {isAdmin && (
                <button
                  onClick={() => setSortByLicitacion(!sortByLicitacion)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    sortByLicitacion 
                      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Agrupar y ordenar los productos según su código de licitación o contrato"
                >
                  <ArrowUpDown className={`w-3.5 h-3.5 ${sortByLicitacion ? 'text-purple-600' : 'text-slate-400'}`} />
                  Ordenar por Licitación
                </button>
              )}

              {/* Selector de Columnas */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95"
                    title="Configurar visibilidad de columnas"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>👁️ Columnas</span>
                  </button>
                  {showColumnSelector && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-3.5 space-y-2 text-xs font-semibold animate-scale-in">
                      <div className="border-b border-slate-100 pb-1.5 mb-1.5 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-black text-slate-400">Mostrar Columnas</span>
                        <button onClick={() => setShowColumnSelector(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {Object.keys(visibleColumns).map(col => {
                        const labelMap: Record<string, string> = {
                          codigo: 'Código',
                          licitacion_contrato: 'Lic./Contrato',
                          factor_empaque: 'Factor Empaque',
                          ubicacion: 'Ubicación',
                          area: 'Área',
                          nombre: 'Producto',
                          unidad: 'Unidad',
                          categoria: 'Categoría',
                          stock_sedile: 'Stock SEDILE',
                          uso_diario: 'Uso Diario',
                          stock_bodega_leches: 'Stock Bodega Leches',
                          stock_total: 'Stock Total',
                          disp_sedile: 'Disp. SEDILE',
                          disp_hospital: 'Disp. Bodega Leches'
                        };
                        return (
                          <label key={col} className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-slate-50 rounded px-1 text-slate-700">
                            <input
                              type="checkbox"
                              checked={visibleColumns[col]}
                              onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20"
                            />
                            <span>{labelMap[col] || col}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nivel 2: Acciones e Informes (Sub-barra dedicada y limpia) */}
          <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-inner">
            
            {/* Lado Izquierdo: Botones de Exportación / Copia */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest shrink-0">Exportar e Informes:</span>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => copyAsImage(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                      title="Genera una imagen PNG del stock completo institucional y la copia a tu portapapeles"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      Copiar imagen stock administrador
                    </button>

                    <button
                      onClick={() => copyAsImage(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                      title="Genera una imagen PNG resumida solo con producto y stock"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Copiar para enviar a Nutricionistas clínicos
                    </button>

                    <button
                      onClick={copyAsText}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                      title="Copia la tabla formateada para pegarla en Excel de inmediato"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                      Copiar como Excel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => copyAsImage(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
                    title="Genera una imagen PNG resumida con los filtros aplicados"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    Copiar Stock como imagen
                  </button>
                )}
              </div>
            </div>

             {/* Lado Derecho: Acciones de Gestión de Bodega (Editar/Agregar) o Información de Stock */}
             {isAdmin ? (
               <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                 <button
                   onClick={() => {
                     if (isGlobalEditMode) {
                       saveGlobalEdits();
                     } else {
                       setIsGlobalEditMode(true);
                     }
                   }}
                   className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 ${
                     isGlobalEditMode 
                       ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600' 
                       : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-600'
                   }`}
                 >
                   {isGlobalEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                   {isGlobalEditMode ? 'Guardar Datos' : 'Editar Datos'}
                 </button>

                 {isGlobalEditMode && (
                   <button
                     onClick={() => {
                       setIsGlobalEditMode(false);
                       setGlobalEdits({});
                     }}
                     className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                   >
                     <X className="w-3.5 h-3.5" /> Cancelar
                   </button>
                 )}

                 <button
                   onClick={() => setShowAddForm(true)}
                   className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all shadow-md active:scale-95 border border-teal-600"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Agregar Producto
                 </button>
               </div>
             ) : (
               <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end relative">
                 <button
                   onClick={() => setShowStockInfoCloud(!showStockInfoCloud)}
                   className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
                   title="Información respecto de iconos de stock"
                 >
                   <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                   <span>Información de Stock</span>
                 </button>

{showStockInfoCloud && (
                    <>
                      {/* Telón de fondo (backdrop) translúcido para móviles */}
                      <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 sm:hidden animate-fade-in"
                        onClick={() => setShowStockInfoCloud(false)}
                      />
                      <div className="fixed inset-x-4 top-24 sm:absolute sm:right-0 sm:left-auto sm:top-12 sm:w-[360px] z-50 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl flex flex-col gap-4 text-left animate-fade-in">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                         ℹ️ INFORMACION RESPECTO DE ICONOS DE STOCK
                       </span>
                       <button 
                         onClick={() => setShowStockInfoCloud(false)}
                         className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                       >
                         <X className="w-4 h-4 text-slate-400" />
                       </button>
                     </div>
                     <div className="space-y-3.5 text-xs text-slate-600">
                       <h4 className="font-extrabold text-slate-700 text-[12px] leading-tight">
                         ¿Cómo funciona la semaforización automática?
                       </h4>
                       <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                         El sistema calcula de forma dinámica el estado del inventario cruzando las existencias físicas con el consumo diario promedio:
                       </p>
                       <div className="space-y-3 mt-2">
                         <div className="flex gap-2.5 items-start">
                           <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 mt-1 shadow-sm"></span>
                           <div>
                             <strong className="text-slate-800 text-[11px] uppercase tracking-tight">STOCK SEGURO (Verde)</strong>
                             <p className="text-[11px] text-slate-500 mt-0.5">El producto cuenta con unidades suficientes para cubrir la demanda durante <strong>7 o más días</strong>.</p>
                           </div>
                         </div>
                         <div className="flex gap-2.5 items-start">
                           <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1 shadow-sm"></span>
                           <div>
                             <strong className="text-slate-800 text-[11px] uppercase tracking-tight">PRONTO A ACABAR (Naranja)</strong>
                             <p className="text-[11px] text-slate-500 mt-0.5">Quedan unidades en stock, pero debido al ritmo de consumo, se agotará en <strong>menos de 7 días</strong>.</p>
                           </div>
                         </div>
                         <div className="flex gap-2.5 items-start">
                           <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 shadow-sm animate-pulse"></span>
                           <div>
                             <strong className="text-slate-800 text-[11px] uppercase tracking-tight">AGOTADO (Rojo)</strong>
                             <p className="text-[11px] text-slate-500 mt-0.5">El stock actual en el turno es exactamente <strong>0</strong>. Requiere reposición inmediata.</p>
                           </div>
                         </div>
                       </div>
                     </div>
                      <button
                        onClick={() => setShowStockInfoCloud(false)}
                        className="mt-1 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors text-center shadow-inner"
                      >
                        Cerrar información
                      </button>
                    </div>
                    </>
                  )}
               </div>
             )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase tracking-wide">Categoría:</span>
            {allCategories.map(category => {
              const isActive = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- CARRUSEL DE HISTORIAL DE ACTUALIZACIONES --- */}
        {historyItems.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-purple-700 animate-pulse" />
                <h3 className="font-black text-sm text-slate-800 tracking-tight uppercase">Historial de Actualizaciones Recientes</h3>
              </div>
              {selectedBatchId && (
                <button
                  onClick={() => setSelectedBatchId(null)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Volver al stock en tiempo real
                </button>
              )}
            </div>
            
            {/* Carrusel scrollable horizontal */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {groupHistoryIntoBatches(historyItems).map(batch => {
                const isSelected = selectedBatchId === batch.id;
                
                return (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchId(isSelected ? null : batch.id)}
                    className={`flex-shrink-0 text-left p-4 rounded-xl border transition-all duration-300 w-64 ${
                      isSelected
                        ? 'bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1">
                      <span>
                        {(() => {
                          const uniqueProductCount = new Set(batch.records.map(r => r.stock_id)).size;
                          return `${uniqueProductCount} ${uniqueProductCount === 1 ? 'producto' : 'productos'}`;
                        })()}
                      </span>
                      {isSelected && <span className="bg-teal-600 text-white font-black px-1.5 py-0.5 rounded text-[8px]">ACTIVO</span>}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">
                      {batch.dateLabel}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium truncate">
                      {Array.from(new Set(batch.records.map(r => r.nombre))).join(', ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- BANNER DE ALERTAS PREDICTIVAS Y FILTRO RÁPIDO DE RIESGO --- */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  Monitor Predictivo de Stock & Quiebres
                </h3>
                {stockRiskFilter !== 'all' && (
                  <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Filtro Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Detección oportuna según ritmo de consumo diario para prevenir quiebres de inventario.
              </p>
            </div>
          </div>

          {/* Chips interactivos de estado */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 🔴 Agotados */}
            <button
              onClick={() => setStockRiskFilter(stockRiskFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all border shadow-sm ${
                stockRiskFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40 shadow-lg scale-105'
                  : riskCounts.outOfStock > 0
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/80 hover:scale-102'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-750'
              }`}
              title="Filtrar productos con stock 0"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${riskCounts.outOfStock > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
              <span>{riskCounts.outOfStock} Agotados</span>
            </button>

            {/* 🟠 Críticos (< 7 días) */}
            <button
              onClick={() => setStockRiskFilter(stockRiskFilter === 'critical' ? 'all' : 'critical')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all border shadow-sm ${
                stockRiskFilter === 'critical'
                  ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-105'
                  : riskCounts.critical > 0
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/80 hover:scale-102'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-750'
              }`}
              title="Filtrar productos con menos de 7 días de stock"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${riskCounts.critical > 0 ? 'bg-amber-500' : 'bg-slate-500'}`} />
              <span>{riskCounts.critical} Críticos (&lt; 7d)</span>
            </button>

            {/* 🟡 En Alerta (7-14 días) */}
            <button
              onClick={() => setStockRiskFilter(stockRiskFilter === 'warning' ? 'all' : 'warning')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all border shadow-sm ${
                stockRiskFilter === 'warning'
                  ? 'bg-yellow-600 text-white border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg scale-105'
                  : riskCounts.warning > 0
                    ? 'bg-yellow-950/60 text-yellow-300 border-yellow-800/80 hover:bg-yellow-900/80 hover:scale-102'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-750'
              }`}
              title="Filtrar productos con 7 a 14 días de stock"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${riskCounts.warning > 0 ? 'bg-yellow-500' : 'bg-slate-500'}`} />
              <span>{riskCounts.warning} En Alerta (7-14d)</span>
            </button>

            {/* Botón Ver Todos / Reset */}
            {stockRiskFilter !== 'all' && (
              <button
                onClick={() => setStockRiskFilter('all')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all border border-slate-600 shadow-sm"
                title="Mostrar todos los productos"
              >
                <X className="w-3.5 h-3.5" />
                <span>Mostrar Todos</span>
              </button>
            )}
          </div>
        </div>

        {/* --- CONTENEDOR DE TABLAS PRINCIPALES --- */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          
          {/* Banner de Advertencia Histórica */}
          {selectedBatchId !== null && (() => {
            const batch = groupHistoryIntoBatches(historyItems).find(b => b.id === selectedBatchId);
            return (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-900 tracking-tight">Viendo Snapshot Histórico</h4>
                    <p className="text-xs text-amber-700 mt-0.5 font-medium">
                      Mostrando el stock anterior de la actualización: <strong className="font-extrabold">{batch?.dateLabel}</strong>. Las ediciones inline han sido deshabilitadas temporalmente por seguridad.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatchId(null)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-center"
                >
                  Cerrar Vista Histórica
                </button>
              </div>
            );
          })()}
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Cargando base de datos del Hospital...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-md font-bold text-slate-700">No se encontraron productos</h3>
              <p className="text-sm text-slate-400 mt-1">Intente cambiando su criterio de búsqueda o filtros.</p>
            </div>
          ) : (
            <>
              {/* ================================================= */}
              {/* 1. VISTA DE ADMINISTRADOR (COMPLETA - 8 COLUMNAS) */}
              {/* ================================================= */}
              {isAdmin ? (
                <div className="overflow-auto max-h-[85vh] w-full border border-slate-200/80 rounded-2xl shadow-sm bg-white">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                      {visibleColumns.codigo !== false && <th className="py-3.5 px-4 text-center w-28 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Código</th>}
                      {visibleColumns.licitacion_contrato !== false && <th className="py-3.5 px-4 text-center w-36 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Lic./Contrato</th>}
                      {visibleColumns.factor_empaque !== false && <th className="py-3.5 px-4 text-center w-36 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Factor Empaque</th>}
                      {visibleColumns.ubicacion !== false && <th className="py-3.5 px-4 text-center w-36 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Ubicación</th>}
                      {visibleColumns.area !== false && <th className="py-3.5 px-4 text-center w-24 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Área</th>}
                      {visibleColumns.nombre !== false && <th className="py-3.5 px-4 w-[25%] sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Producto / Suministro</th>}
                      {visibleColumns.unidad !== false && <th className="py-3.5 px-4 text-center w-24 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Unidad</th>}
                      {visibleColumns.categoria !== false && <th className="py-3.5 px-4 text-center w-36 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Categoría</th>}
                      {visibleColumns.stock_sedile !== false && <th className="py-3.5 px-4 text-center w-36 bg-slate-900 sticky top-0 z-20 text-white border-b border-slate-700">Stock SEDILE</th>}
                      {visibleColumns.uso_diario !== false && <th className="py-3.5 px-4 text-center w-28 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Uso Diario</th>}
                      {visibleColumns.stock_bodega_leches !== false && <th className="py-3.5 px-4 text-center w-36 bg-slate-900 sticky top-0 z-20 text-white border-b border-slate-700">Stock Bodega Leches</th>}
                      {visibleColumns.stock_total !== false && <th className="py-3.5 px-4 text-center w-32 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Stock Total</th>}
                      {visibleColumns.disp_sedile !== false && <th className="py-3.5 px-4 text-center w-36 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Disp. SEDILE</th>}
                      {visibleColumns.disp_hospital !== false && <th className="py-3.5 px-4 text-center w-36 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700">Disp. Bodega Leches</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const itemsToRender = getPreviewItems();
                      const firstRthIndex = itemsToRender.findIndex(item => item.categoria === 'RTH (Enteral)');
                      const activeColSpan = Object.values(visibleColumns).filter(Boolean).length;
                      
                      return itemsToRender.map((item, idx) => {
                        const isEditing = isGlobalEditMode;
                        const isFirstRth = idx === firstRthIndex;
                        const isHistoryMode = selectedBatchId !== null;

                        return (
                          <React.Fragment key={item.id}>
                            {isFirstRth && (
                              <tr className="bg-purple-950/5 border-y border-purple-200/50">
                                <td colSpan={activeColSpan} className="py-3 px-4 text-left font-black text-xs text-purple-700 tracking-widest uppercase">
                                  ✦ PRODUCTOS RTH (ENTERAL)
                                </td>
                              </tr>
                            )}
                            <tr 
                              className={`hover:bg-slate-50/80 transition-colors text-slate-800 font-medium text-sm group animate-fade-in ${
                                item.oculto 
                                  ? 'bg-amber-100/40 border-l-4 border-amber-400 opacity-90' 
                                  : 'border-l-4 border-transparent'
                              } ${activeMenuId === item.id ? 'relative z-50' : ''}`}
                            >
                          
                          {/* Col 1: Código */}
                          {visibleColumns.codigo !== false && (
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={globalEdits[item.id]?.codigo ?? item.codigo ?? ''}
                                  onChange={(e) => handleGlobalEdit(item.id, 'codigo', e.target.value)}
                                  className="w-20 px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-center text-xs"
                                />
                              ) : (
                                item.codigo
                              )}
                            </td>
                          )}
                          {/* Col Licitacion */}
                          {visibleColumns.licitacion_contrato !== false && (
                            <td className="py-3 px-4 text-center font-medium text-slate-600 text-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={globalEdits[item.id]?.licitacion_contrato ?? item.licitacion_contrato ?? ''}
                                  onChange={(e) => handleGlobalEdit(item.id, 'licitacion_contrato', e.target.value)}
                                  className="w-24 px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-center text-xs"
                                />
                              ) : (
                                item.licitacion_contrato || '-'
                              )}
                            </td>
                          )}

                          {/* Col 2: Factor Empaque */}
                          {visibleColumns.factor_empaque !== false && (
                            <td className="py-3 px-4 text-center font-bold text-slate-600 text-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={globalEdits[item.id]?.factor_empaque ?? item.factor_empaque ?? ''}
                                  onChange={(e) => handleGlobalEdit(item.id, 'factor_empaque', e.target.value)}
                                  className="w-24 px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-center text-xs"
                                />
                              ) : (
                                item.factor_empaque || '1 UD'
                              )}
                            </td>
                          )}

                          {/* Col Ubicacion */}
                          {visibleColumns.ubicacion !== false && (
                            <td className="py-3 px-4 text-center font-medium text-slate-600 text-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={globalEdits[item.id]?.ubicacion ?? item.ubicacion ?? ''}
                                  onChange={(e) => handleGlobalEdit(item.id, 'ubicacion', e.target.value)}
                                  className="w-24 px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-center text-xs"
                                />
                              ) : (
                                item.ubicacion || '-'
                              )}
                            </td>
                          )}

                          {/* Col 3: Área */}
                          {visibleColumns.area !== false && (
                            <td className="py-3 px-4 text-center">
                              {isEditing ? (
                                <select
                                  value={globalEdits[item.id]?.area ?? item.area ?? 'clinica'}
                                  onChange={(e) => handleGlobalEdit(item.id, 'area', e.target.value)}
                                  className="px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-xs font-bold"
                                >
                                  <option value="clinica">clínica</option>
                                  <option value="CEFE">CEFE</option>
                                  <option value="SEDILE">SEDILE</option>
                                </select>
                              ) : (
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                  item.area === 'CEFE' ? 'bg-indigo-100 text-indigo-700' :
                                  item.area === 'SEDILE' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {item.area || 'clínica'}
                                </span>
                              )}
                            </td>
                          )}

                          {/* Col 4: Producto / Suministro */}
                          {visibleColumns.nombre !== false && (
                            <td className={`py-3 px-4 relative group ${activeMenuId === item.id ? 'z-50' : ''}`}>
                              <div className="flex justify-between items-center gap-2">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={globalEdits[item.id]?.nombre ?? item.nombre ?? ''}
                                    onChange={(e) => handleGlobalEdit(item.id, 'nombre', e.target.value)}
                                    className="w-full px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-sm font-semibold"
                                  />
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-950">{item.nombre}</span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">{item.categoria}</span>
                                  </div>
                                )}
                                
                                {/* Acciones en menú */}
                                {!isHistoryMode && isAdmin && !isGlobalEditMode && (
                                  <div className="flex items-center gap-1 actions-menu-container">
                                    <div className="relative">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                        }}
                                        className={`p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all ${
                                          activeMenuId === item.id ? 'opacity-100 bg-slate-100 text-slate-600' : 'opacity-0 group-hover:opacity-100'
                                        }`}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      
                                      {activeMenuId === item.id && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-[60] overflow-hidden animate-scale-in">
                                          <button
                                            onClick={() => { toggleVisibility(item.id, item.oculto); setActiveMenuId(null); }}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                          >
                                            {item.oculto ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {item.oculto ? 'Mostrar' : 'Ocultar'}
                                          </button>
                                          <button
                                            onClick={() => { handleDeleteProduct(item.id); setActiveMenuId(null); }}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Col 5: Unidad */}
                          {visibleColumns.unidad !== false && (
                            <td className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={globalEdits[item.id]?.unidad ?? item.unidad ?? ''}
                                  onChange={(e) => handleGlobalEdit(item.id, 'unidad', e.target.value)}
                                  className="w-20 px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 text-center font-bold"
                                />
                              ) : (
                                item.unidad || 'Tarro'
                              )}
                            </td>
                          )}

                          {/* Col 5b: Categoría */}
                          {visibleColumns.categoria !== false && (
                            <td className="py-3 px-4 text-center text-xs font-semibold text-slate-600">
                              {isEditing ? (
                                <select
                                  value={globalEdits[item.id]?.categoria ?? item.categoria ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'NEW_CATEGORY') {
                                      const newCat = window.prompt("Ingrese el nombre de la nueva categoría:");
                                      if (newCat && newCat.trim()) {
                                        const trimmed = newCat.trim();
                                        if (!customCategories.includes(trimmed)) {
                                          const nextCats = [...customCategories, trimmed];
                                          setCustomCategories(nextCats);
                                          localStorage.setItem('custom_categories', JSON.stringify(nextCats));
                                        }
                                        handleGlobalEdit(item.id, 'categoria', trimmed);
                                      }
                                    } else {
                                      handleGlobalEdit(item.id, 'categoria', val);
                                    }
                                  }}
                                  className="w-36 px-2 py-1 border border-teal-500 rounded focus:ring-1 focus:ring-teal-500 font-bold bg-white text-slate-700"
                                >
                                  {formCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                  <option value="NEW_CATEGORY">➕ Agregar Nueva Categoría...</option>
                                </select>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.categoria}
                                </span>
                              )}
                            </td>
                          )}

                          {/* Col 6: Stock SEDILE */}
                          {visibleColumns.stock_sedile !== false && (() => {
                            const isDraft = pendingChanges[item.id]?.stock_sedile !== undefined;
                            const displayVal = isDraft ? pendingChanges[item.id].stock_sedile : item.stock_sedile;
                            const diff = (item as any).diff;
                            
                            return (
                              <td className={`py-2 px-4 text-center bg-slate-50/50 group-hover:bg-slate-100/50 transition-all ${isDraft ? 'bg-amber-50 border-2 border-amber-300 rounded-lg' : ''}`}>
                                {isHistoryMode ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="font-bold font-mono text-slate-900">{displayVal}</span>
                                    {diff !== undefined && (
                                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                                        diff > 0 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : diff < 0 
                                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                          : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}>
                                        {diff > 0 ? `+${diff} ↑` : diff < 0 ? `${diff} ↓` : '0'}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    value={displayVal ?? 0}
                                    onChange={(e) => handleInlineChange(item.id, 'stock_sedile', e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={(e) => e.target.select()}
                                    disabled={isEditing}
                                    className={`w-20 px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-center font-bold bg-white shadow-sm transition-all text-slate-900 ${
                                      isDraft ? 'border-amber-400' : 'border-slate-200 focus:border-teal-500'
                                    } ${isEditing ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''}`}
                                    title="Modificar stock SEDILE (Se guardará al presionar Confirmar abajo)"
                                  />
                                )}
                              </td>
                            );
                          })()}

                          {/* Col 7: Uso Diario */}
                          {visibleColumns.uso_diario !== false && (() => {
                            const isDraft = pendingChanges[item.id]?.uso_diario !== undefined;
                            const displayVal = isDraft ? pendingChanges[item.id].uso_diario : item.uso_diario;
                            
                            return (
                              <td className={`py-2 px-4 text-center transition-all ${isDraft ? 'bg-amber-50 border-2 border-amber-300 rounded-lg' : ''}`}>
                                {isHistoryMode ? (
                                  <span className="font-semibold text-slate-700 font-mono">{displayVal}</span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={displayVal ?? 0}
                                    onChange={(e) => handleInlineChange(item.id, 'uso_diario', e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={(e) => e.target.select()}
                                    disabled={isEditing}
                                    className={`w-16 px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-center font-semibold bg-white transition-all text-slate-700 ${
                                      isDraft ? 'border-amber-400' : 'border-slate-200 focus:border-teal-500'
                                    } ${isEditing ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    title="Modificar uso diario"
                                  />
                                )}
                              </td>
                            );
                          })()}

                          {/* Col 8: Stock Bodega de Leches */}
                          {visibleColumns.stock_bodega_leches !== false && (() => {
                            const isDraft = pendingChanges[item.id]?.stock_bodega_leches !== undefined;
                            const displayVal = isDraft ? pendingChanges[item.id].stock_bodega_leches : (item.stock_bodega_leches || 0);
                            
                            return (
                              <td className={`py-2 px-4 text-center bg-slate-50/50 group-hover:bg-slate-100/50 transition-all ${isDraft ? 'bg-amber-50 border-2 border-amber-300 rounded-lg' : ''}`}>
                                {isHistoryMode ? (
                                  <span className="font-bold font-mono text-slate-900">{displayVal}</span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    value={displayVal ?? 0}
                                    onChange={(e) => handleInlineChange(item.id, 'stock_bodega_leches', e.target.value === '' ? '' : Number(e.target.value))}
                                    onFocus={(e) => e.target.select()}
                                    disabled={isEditing}
                                    className={`w-20 px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-center font-bold bg-white shadow-sm transition-all text-slate-900 ${
                                      isDraft ? 'border-amber-400' : 'border-slate-200 focus:border-teal-500'
                                    } ${isEditing ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''}`}
                                    title="Modificar stock Bodega de Leches (Se guardará al presionar Confirmar)"
                                  />
                                )}
                              </td>
                            );
                          })()}

                          {/* Col 9: Stock Total */}
                          {visibleColumns.stock_total !== false && (() => {
                            const currentStockSedile = Number(pendingChanges[item.id]?.stock_sedile ?? item.stock_sedile);
                            const currentStockBodega = Number(pendingChanges[item.id]?.stock_bodega_leches ?? (item.stock_bodega_leches || 0));
                            const displayVal = currentStockSedile + currentStockBodega;
                            
                            return (
                              <td className="py-3 px-4 text-center bg-slate-50/50 group-hover:bg-slate-100/50 font-black text-slate-950 font-mono">
                                {displayVal}
                              </td>
                            );
                          })()}

                          {/* Col 10: Días Disponibilidad SEDILE */}
                          {visibleColumns.disp_sedile !== false && (() => {
                            const currentStockSedile = Number(pendingChanges[item.id]?.stock_sedile ?? item.stock_sedile);
                            const currentUsoDiario = Number(pendingChanges[item.id]?.uso_diario ?? item.uso_diario);
                            const statsSedile = getStockStatus({ ...item, stock_sedile: currentStockSedile, uso_diario: currentUsoDiario });
                            
                            return (
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm transition-all ${statsSedile.color}`}>
                                  {statsSedile.label}
                                </span>
                              </td>
                            );
                          })()}

                          {/* Col 11: Días Disponibilidad Bodega de Leches */}
                          {visibleColumns.disp_hospital !== false && (() => {
                            const currentStockBodega = Number(pendingChanges[item.id]?.stock_bodega_leches ?? (item.stock_bodega_leches || 0));
                            const currentUsoDiario = Number(pendingChanges[item.id]?.uso_diario ?? item.uso_diario);
                            const statsBodega = getBodegaStockStatus({ ...item, stock_bodega_leches: currentStockBodega, uso_diario: currentUsoDiario });
                            
                            return (
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm transition-all ${statsBodega.color}`}>
                                  {statsBodega.label}
                                </span>
                              </td>
                            );
                          })()}


                            </tr>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              
              // =================================================
              // 2. VISTA PÚBLICA (SIMPLIFICADA - 4 COLUMNAS RESPONSIVA)
              // =================================================
              <div className="w-full border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
                <table className="w-full text-left table-fixed border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                      <th className="py-3 px-2 sm:py-4 sm:px-6 sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700 w-[38%] sm:w-[40%]">
                        <span className="hidden sm:inline">Nombre del Producto / Fórmula</span>
                        <span className="inline sm:hidden">Producto / Fórmula</span>
                      </th>
                      <th className="py-3 px-2 sm:py-4 sm:px-6 text-center sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700 w-[22%] sm:w-[20%]">
                        <span className="hidden sm:inline">Stock SEDILE</span>
                        <span className="inline sm:hidden">Stock</span>
                      </th>
                      <th className="py-3 px-2 sm:py-4 sm:px-6 text-center sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700 w-[20%] sm:w-[20%]">
                        <span className="hidden sm:inline">Disponibilidad</span>
                        <span className="inline sm:hidden">Disp.</span>
                      </th>
                      <th className="py-3 px-2 sm:py-4 sm:px-6 text-center sticky top-0 z-20 bg-slate-800 text-white border-b border-slate-700 w-[20%] sm:w-[20%]">
                        <span className="hidden sm:inline">Uso Diario</span>
                        <span className="inline sm:hidden">Uso D.</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const itemsToRender = getPreviewItems();
                      const firstRthIndex = itemsToRender.findIndex(item => item.categoria === 'RTH (Enteral)');
                      const isHistoryMode = selectedBatchId !== null;
                      
                      return itemsToRender.map((item, idx) => {
                        const isOutOfStock = item.stock_sedile === 0;
                        const isLowStock = !isOutOfStock && item.uso_diario > 0 && (item.stock_sedile / item.uso_diario) < 7;
                        const isFirstRth = idx === firstRthIndex;

                        return (
                          <React.Fragment key={item.id}>
                            {isFirstRth && (
                              <tr className="bg-purple-950/5 border-y border-purple-200/50">
                                <td colSpan={4} className="py-3.5 px-6 text-left font-black text-xs text-purple-700 tracking-widest uppercase">
                                  ✦ PRODUCTOS RTH (ENTERAL)
                                </td>
                              </tr>
                            )}
                            <tr 
                              className="hover:bg-slate-50/50 transition-colors font-semibold text-slate-800"
                            >
                          {/* Col 1: Nombre de Producto y Categoria */}
                          <td className="py-3 px-2 sm:py-4.5 sm:px-6">
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-base font-bold text-slate-900 leading-tight">{item.nombre}</span>
                              <span className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.categoria}</span>
                            </div>
                          </td>

                          {/* Col 2: Stock SEDILE */}
                          <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <span className={`inline-flex flex-col sm:flex-row items-center justify-center text-xs sm:text-base font-black px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl border shadow-sm tracking-wide ${
                                 isOutOfStock && !isHistoryMode
                                   ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                   : isLowStock && !isHistoryMode
                                     ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                     : 'bg-teal-50 text-teal-800 border-teal-100'
                               }`}>
                                 <span>{item.stock_sedile}</span>
                                 <span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider mt-0.5 sm:mt-0 sm:ml-1.5 ${
                                   isOutOfStock && !isHistoryMode 
                                     ? 'text-rose-500/80' 
                                     : isLowStock && !isHistoryMode 
                                       ? 'text-amber-600/80' 
                                       : 'text-slate-400'
                                 }`}>
                                   {item.unidad || 'Tarro'}
                                 </span>
                               </span>
                                
                               {/* Insignia de diferencia en vista histórica */}
                               {isHistoryMode && (item as any).diff !== undefined && (
                                 <span className={`inline-flex items-center gap-0.5 text-[9px] sm:text-xs font-black px-1.5 py-0.5 sm:px-2.5 sm:py-2 rounded-lg sm:rounded-xl border shadow-sm whitespace-nowrap ${
                                   (item as any).diff > 0 
                                     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                     : (item as any).diff < 0 
                                     ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                     : 'bg-slate-100 text-slate-500 border-slate-200'
                                 }`}>
                                   {(item as any).diff > 0 ? `+${(item as any).diff}` : (item as any).diff < 0 ? `${(item as any).diff}` : '0'}
                                 </span>
                               )}
                            </div>
                          </td>

                          {/* Col 3: Disponibilidad SEDILE */}
                          <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1 text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border shadow-sm transition-all whitespace-nowrap ${
                                isOutOfStock && !isHistoryMode
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                  : isLowStock && !isHistoryMode
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                    : item.uso_diario <= 0
                                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {isOutOfStock && !isHistoryMode ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
                                    <span>Agotado</span>
                                  </>
                                ) : item.uso_diario <= 0 ? (
                                  <span>Sin uso</span>
                                ) : (
                                  <>
                                    {isLowStock ? (
                                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                                    ) : (
                                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
                                    )}
                                    <span className="sm:inline hidden">{((item.stock_sedile) / item.uso_diario).toFixed(1)} días</span>
                                    <span className="inline sm:hidden">{((item.stock_sedile) / item.uso_diario).toFixed(1)} d.</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Col 4: Uso Diario */}
                          <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                            <div className="flex items-center justify-center">
                              <span className="inline-flex flex-col sm:flex-row items-center justify-center text-xs sm:text-base font-black px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-800 shadow-sm tracking-wide">
                                <span>{item.uso_diario ?? 0}</span>
                                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5 sm:mt-0 sm:ml-1.5">
                                  {item.unidad ? `${item.unidad}/día` : 'uds/día'}
                                </span>
                              </span>
                            </div>
                          </td>
                            </tr>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}

          </>
        )}
        </div>

          </>
        )}

        {/* --- MENSAJES E INFORMACIÓN ADICIONAL --- */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start shadow-inner">
          <HelpCircle className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-slate-700 text-sm">Información sobre Disponibilidad e Inventario:</h4>
            <p>• La semaforización en la vista de usuario funciona de la siguiente manera: **Rojo** (Agotado - Sin stock); **Naranja** (Pronto a acabar - Menos de 7 días de stock); **Verde** (Stock seguro - 7 o más días).</p>
            <p>• Los **Días Disponibles SEDILE** representan la cantidad de días que durará el stock de la bodega láctea del turno según el uso diario promedio.</p>
            <p>• Los **Días Disponibles Hospital** representan el stock total institucional (bodega central del hospital + bodega SEDILE) dividido por el uso diario.</p>
            <p>• La semaforización de colores funciona de la siguiente manera: **Rojo** (&lt; 7 días, crítico); **Naranja** (7 a 15 días, moderado); **Verde** (&gt; 15 días, seguro).</p>
            <p className="font-semibold text-slate-500 mt-1">Para realizar cambios rápidos en cantidades, use el botón de "Acceso Administrador" en la barra superior con el PIN institucional.</p>
          </div>
        </div>

      </main>

      {/* --- FORMULARIO DE AGREGAR PRODUCTO (MODAL MODERNO) --- */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-scale-in">
            <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                <h3 className="font-bold text-lg">Agregar Producto al Inventario</h3>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo del Producto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Puramino (Polvo 400g)"
                    value={newItem.nombre || ''}
                    onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Código Único</label>
                  <input
                    type="text"
                    placeholder="Ej. LAC-011"
                    value={newItem.codigo || ''}
                    onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Categoría</label>
                  <select
                    value={newItem.categoria || 'Lácteos/Polvos'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'NEW_CATEGORY') {
                        const newCat = window.prompt("Ingrese el nombre de la nueva categoría:");
                        if (newCat && newCat.trim()) {
                          const trimmed = newCat.trim();
                          if (!customCategories.includes(trimmed)) {
                            const nextCats = [...customCategories, trimmed];
                            setCustomCategories(nextCats);
                            localStorage.setItem('custom_categories', JSON.stringify(nextCats));
                          }
                          setNewItem({ ...newItem, categoria: trimmed });
                        }
                      } else {
                        setNewItem({ ...newItem, categoria: val });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700 bg-white"
                  >
                    {formCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="NEW_CATEGORY">➕ Agregar Nueva Categoría...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidad Medida</label>
                  <input
                    type="text"
                    placeholder="Ej. Tarro, Caja, Envase"
                    value={newItem.unidad || ''}
                    onChange={(e) => setNewItem({ ...newItem, unidad: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Uso Diario Promedio</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newItem.uso_diario ?? 0}
                    onChange={(e) => setNewItem({ ...newItem, uso_diario: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Bodega SEDILE</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.stock_sedile ?? 0}
                    onChange={(e) => setNewItem({ ...newItem, stock_sedile: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Bodega de Leches</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.stock_bodega_leches ?? 0}
                    onChange={(e) => setNewItem({ ...newItem, stock_bodega_leches: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lic./Contrato</label>
                  <input
                    type="text"
                    placeholder="Ej. 1234-56-LQ23"
                    value={newItem.licitacion_contrato || ''}
                    onChange={(e) => setNewItem({ ...newItem, licitacion_contrato: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Factor de Empaque</label>
                  <input
                    type="text"
                    placeholder="Ej. CAJA 30 UD"
                    value={newItem.factor_empaque || ''}
                    onChange={(e) => setNewItem({ ...newItem, factor_empaque: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ubicación</label>
                  <input
                    type="text"
                    placeholder="Ej. Estante A3"
                    value={newItem.ubicacion || ''}
                    onChange={(e) => setNewItem({ ...newItem, ubicacion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Área</label>
                  <select
                    value={newItem.area || 'clinica'}
                    onChange={(e) => setNewItem({ ...newItem, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-semibold text-slate-700"
                  >
                    <option value="clinica">clínica</option>
                    <option value="CEFE">CEFE</option>
                    <option value="SEDILE">SEDILE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Añadir Producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE AUTENTICACIÓN / PIN --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 p-6 animate-scale-in relative">
            <button
              onClick={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError(false);
              }}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 border border-teal-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Desbloquear Administración</h3>
              <p className="text-xs text-slate-400 font-medium">Introduzca el código PIN institucional para habilitar la edición de stock e importaciones.</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Ingrese el PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    setPinError(false);
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border text-center font-bold tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${
                    pinError ? 'border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500' : 'border-slate-200'
                  }`}
                  autoFocus
                />
                {pinError && (
                  <p className="text-rose-600 font-semibold text-[11px] text-center mt-1.5 flex items-center gap-1 justify-center">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Código PIN incorrecto. Inténtelo de nuevo.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 text-sm"
              >
                Confirmar y Entrar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE HISTORIAL --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-in">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <h3 className="font-bold text-lg">Historial de Movimientos de Stock</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                  <p className="text-sm font-semibold text-slate-500">Cargando registros históricos...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-20">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-md font-bold text-slate-700">Sin historial registrado</h3>
                  <p className="text-sm text-slate-400 mt-1">Todavía no hay movimientos de stock almacenados.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse bg-white rounded-xl shadow-sm border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 w-40">Fecha y Hora</th>
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                      <th className="py-3 px-4 text-center">Stock Anterior</th>
                      <th className="py-3 px-4 text-center">Stock Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {historyItems.map((record) => {
                      const dateObj = new Date(record.changed_at);
                      const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute:'2-digit' });
                      const dateStr = dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
                      
                      const isAddition = record.new_stock > record.old_stock;
                      const isReduction = record.new_stock < record.old_stock;

                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {dateStr} <span className="text-slate-400 ml-1">{timeStr}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {record.nombre}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              record.action === 'INSERT' ? 'bg-emerald-100 text-emerald-700' :
                              record.action === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {record.action === 'UPDATE' ? 'MODIFICADO' : record.action === 'INSERT' ? 'AGREGADO' : 'ELIMINADO'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 font-mono">
                            {record.old_stock}
                          </td>
                          <td className={`py-3 px-4 text-center font-bold font-mono ${
                            isAddition ? 'text-emerald-600' : isReduction ? 'text-rose-600' : 'text-slate-800'
                          }`}>
                            {record.new_stock}
                            {isAddition && <span className="text-emerald-500 ml-1 text-xs">↑</span>}
                            {isReduction && <span className="text-rose-500 ml-1 text-xs">↓</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white border-t border-slate-200 p-4 text-center shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE ANÁLISIS DE COSTOS Y MERMAS REDISEÑADO Y UNIFICADO --- */}
      {showMermasCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-in">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">Análisis de Costos y Pérdidas Financieras</h3>
                  <p className="text-xs text-purple-200 font-medium">Gestión unificada de precios, consumo diario y pérdidas de mermas</p>
                </div>
              </div>
              <button
                onClick={() => setShowMermasCostModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas Modernas */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMermasCostTab('metricas')}
                  className={"px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 " + (
                    mermasCostTab === 'metricas'
                      ? 'bg-white text-purple-800 shadow-sm border border-purple-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  )}
                >
                  <span>📊</span>
                  <span>Métricas y Gráficos Financieros</span>
                </button>
                <button
                  onClick={() => setMermasCostTab('precios')}
                  className={"px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 " + (
                    mermasCostTab === 'precios'
                      ? 'bg-white text-purple-800 shadow-sm border border-purple-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  )}
                >
                  <span>💲</span>
                  <span>Precios de Productos (Bodega)</span>
                </button>
              </div>

              {/* Indicador de pestaña */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                {mermasCostTab === 'metricas' ? (
                  <span className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 font-bold">
                    <span>💡</span> Cálculo automático por ml y consumo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-bold">
                    <span>🔄</span> Sincronizado en tiempo real
                  </span>
                )}
              </div>
            </div>

            {/* Contenido Principal */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 flex flex-col gap-6">
              {mermasCostTab === 'metricas' ? (
                /* --- PESTAÑA 1: MÉTRICAS Y GRÁFICOS FINANCIEROS --- */
                (() => {
                  // Filtrar mermas según mes seleccionado
                  const isSpecificMonth = costAnalysisMonth !== 'all';
                  const filteredMermas = isSpecificMonth
                    ? mermasRecords.filter(r => getMonthYearKey(r.fecha) === costAnalysisMonth)
                    : mermasRecords;

                  const uniqueDates = [...new Set(filteredMermas.map(r => r.fecha))];
                  const numDays = Math.max(1, uniqueDates.length);
                  let totalLossQty = 0;
                  let totalLossCost = 0;

                  filteredMermas.forEach(r => {
                    if (r.motivo !== 'Devolución para reutilizar') {
                      const parsed = parseMermaRecord(r);
                      totalLossQty += parsed.isLiquid ? 0 : (r.cantidad || 0);
                      totalLossCost += getMermaCost(r, formulaPricings);
                    }
                  });

                  const avgLossCost = totalLossCost / numDays;
                  const monthlyLossProj = avgLossCost * 30;

                  // Pérdidas por motivo
                  const motivoCostMap: Record<string, number> = {};
                  filteredMermas.forEach(r => {
                    if (r.motivo !== 'Devolución para reutilizar') {
                      const cost = getMermaCost(r, formulaPricings);
                      motivoCostMap[r.motivo] = (motivoCostMap[r.motivo] || 0) + cost;
                    }
                  });
                  const motivoChartDataList = Object.keys(motivoCostMap).map(k => ({
                    name: k,
                    value: motivoCostMap[k]
                  })).sort((a, b) => b.value - a.value);

                  // Suplemento más mermado en el período
                  const supplementLosses: Record<string, number> = {};
                  filteredMermas.forEach(r => {
                    if (r.motivo !== 'Devolución para reutilizar') {
                      const parsed = parseMermaRecord(r);
                      if (parsed.isLiquid && parsed.supplementName) {
                        const name = parsed.supplementName;
                        supplementLosses[name] = (supplementLosses[name] || 0) + (r.cantidad || 0);
                      }
                    }
                  });

                  let mostMermadoName = 'Ninguno';
                  let mostMermadoVol = 0;
                  Object.keys(supplementLosses).forEach(name => {
                    if (supplementLosses[name] > mostMermadoVol) {
                      mostMermadoVol = supplementLosses[name];
                      mostMermadoName = name;
                    }
                  });

                  // Consumo diario de bodega (activo)
                  const activeProducts = items.filter(item => !item.oculto);
                  let totalDailyExpenditure = 0;
                  activeProducts.forEach(item => {
                    const price = formulaPricings[item.nombre]?.precio_tarro || formulaPricings[item.id]?.precio_tarro || productPrices[item.id] || 0;
                    totalDailyExpenditure += (item.uso_diario || 0) * price;
                  });
                  const monthlyExpenditureProj = totalDailyExpenditure * 30;

                  // Top 5 mayor gasto diario
                  const topSpendProducts = activeProducts
                    .map(item => {
                      const price = formulaPricings[item.nombre]?.precio_tarro || formulaPricings[item.id]?.precio_tarro || productPrices[item.id] || 0;
                      return {
                        name: item.nombre.length > 16 ? item.nombre.substring(0, 14) + '...' : item.nombre,
                        fullName: item.nombre,
                        gasto: (item.uso_diario || 0) * price
                      };
                    })
                    .filter(entry => entry.gasto > 0)
                    .sort((a, b) => b.gasto - a.gasto)
                    .slice(0, 5);

                  return (
                    <div className="flex flex-col gap-6">
                      {/* Barra Superior con Selector de Período */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Período de Análisis de Mermas
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <select
                                value={costAnalysisMonth}
                                onChange={(e) => setCostAnalysisMonth(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                              >
                                <option value="all">🌐 Histórico Completo (Todos los meses)</option>
                                {availableMermasMonths.map(m => (
                                  <option key={m.monthKey} value={m.monthKey}>
                                    📅 {m.monthKey} ({m.recordCount} registros)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-3 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-xl border border-purple-100">
                            {isSpecificMonth
                              ? `${costAnalysisMonth} • ${filteredMermas.length} eventos`
                              : `Histórico • ${filteredMermas.length} eventos totales`}
                          </span>
                        </div>
                      </div>

                      {/* Tarjetas KPI Superiores */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1: Pérdida por mermas */}
                        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Pérdida por Mermas ({isSpecificMonth ? 'Mes' : 'Total'})
                            </span>
                            <span className="text-xs">📉</span>
                          </div>
                          <h3 className="text-2xl font-black text-rose-600 mt-1">
                            $ {totalLossCost.toLocaleString('es-CL')}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {totalLossQty} uds. desperdiciadas • Prom: $ {Math.round(avgLossCost).toLocaleString('es-CL')}/día
                          </p>
                        </div>

                        {/* KPI 2: Proyección mensual */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Proyección Pérdida Mensual
                            </span>
                            <span className="text-xs">📅</span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-800 mt-1">
                            $ {Math.round(monthlyLossProj).toLocaleString('es-CL')}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Estimado sobre {numDays} día(s) con bitácora
                          </p>
                        </div>

                        {/* KPI 3: Consumo Diario Bodega */}
                        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Costo Consumo Diario Bodega
                            </span>
                            <span className="text-xs">📦</span>
                          </div>
                          <h3 className="text-2xl font-black text-indigo-700 mt-1">
                            $ {Math.round(totalDailyExpenditure).toLocaleString('es-CL')}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Gasto mensual proyectado: $ {Math.round(monthlyExpenditureProj).toLocaleString('es-CL')}
                          </p>
                        </div>

                        {/* KPI 4: Suplemento más mermado */}
                        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Suplemento Más Mermado
                            </span>
                            <span className="text-xs">🍼</span>
                          </div>
                          <h3 className="text-xl font-black text-purple-700 mt-1 truncate" title={mostMermadoName}>
                            {mostMermadoName}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {mostMermadoVol > 0 ? `${mostMermadoVol} cc mermados en período` : 'Sin pérdidas líquidas'}
                          </p>
                        </div>
                      </div>

                      {/* Gráficos Integrados en Paralelo */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Gráfico 1: Pérdidas de mermas por motivo */}
                        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                              <span>🥧</span>
                              <span>Pérdidas de Mermas por Motivo ($)</span>
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Total: $ {totalLossCost.toLocaleString('es-CL')}
                            </span>
                          </div>

                          {totalLossCost === 0 ? (
                            <div className="h-60 flex items-center justify-center text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                              Sin registros de pérdida de mermas para este período.
                            </div>
                          ) : (
                            <div className="h-60 flex flex-col sm:flex-row items-center justify-center gap-4">
                              <div className="h-44 w-44 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={motivoChartDataList}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={42}
                                      outerRadius={58}
                                      paddingAngle={2}
                                      dataKey="value"
                                    >
                                      {motivoChartDataList.map((entry, index) => (
                                        <Cell key={"cell-" + index} fill={getMotivoColor(entry.name)} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => ["$" + Number(value).toLocaleString('es-CL'), 'Pérdida']} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="space-y-1.5 overflow-y-auto max-h-48 flex-1 pr-1 text-[10px]">
                                {motivoChartDataList.map((entry) => (
                                  <div key={entry.name} className="flex items-center justify-between border-b border-slate-50 pb-1">
                                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getMotivoColor(entry.name) }}></span>
                                      <span className="text-slate-600 font-medium truncate" title={entry.name}>{entry.name}</span>
                                    </div>
                                    <span className="text-slate-800 font-mono font-bold">$ {entry.value.toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Gráfico 2: Top Fórmulas con mayor gasto diario */}
                        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                              <span>📊</span>
                              <span>Top Fórmulas de Mayor Gasto Diario en Bodega</span>
                            </h4>
                            <span className="text-[10px] text-indigo-600 font-bold">
                              Consumo Activo
                            </span>
                          </div>

                          {topSpendProducts.length === 0 ? (
                            <div className="h-60 flex items-center justify-center text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                              Asigna precios a los productos en la pestaña 'Precios de Productos' para ver el gasto diario.
                            </div>
                          ) : (
                            <div className="h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topSpendProducts} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                                  <YAxis tick={{ fontSize: 9 }} />
                                  <Tooltip formatter={(value) => ["$ " + Number(value).toLocaleString('es-CL'), 'Gasto Diario']} />
                                  <Bar dataKey="gasto" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                    {topSpendProducts.map((entry, idx) => (
                                      <Cell key={"bar-" + idx} fill={idx === 0 ? '#4f46e5' : idx === 1 ? '#6366f1' : '#818cf8'} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* --- PESTAÑA 2: CATÁLOGO UNIFICADO DE PRECIOS DE PRODUCTOS --- */
                (() => {
                  const activeProducts = items.filter(item => !item.oculto);

                  // Filtrado por categoría y término de búsqueda
                  const filteredProducts = activeProducts.filter(item => {
                    const matchesCategory = priceCatalogCategory === 'Todos' || item.categoria === priceCatalogCategory;
                    const matchesSearch = !priceCatalogSearch.trim() ||
                      item.nombre.toLowerCase().includes(priceCatalogSearch.toLowerCase()) ||
                      item.categoria.toLowerCase().includes(priceCatalogSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  const pricedCount = activeProducts.filter(item => {
                    const price = formulaPricings[item.nombre]?.precio_tarro || formulaPricings[item.id]?.precio_tarro || productPrices[item.id] || 0;
                    return price > 0;
                  }).length;

                  // Función auxiliar para actualizar precio de forma unificada
                  const handleUpdatePrice = (item: StockItem, price: number, format?: FormulaFormat, dil?: number) => {
                    setProductPrices(prev => {
                      const updated = { ...prev, [item.id]: price };
                      try { localStorage.setItem('product_prices', JSON.stringify(updated)); } catch (e) {}
                      return updated;
                    });

                    setFormulaPricings(prev => {
                      const existing = prev[item.nombre] || prev[item.id] || {};
                      const fmt = format || existing.formato || detectFormulaFormat(item.nombre, item.unidad);
                      const defaultDil = FORMULA_FORMAT_DATA[fmt]?.defaultDil || 14;
                      const dilution = dil !== undefined ? dil : (existing.dilucion_pct !== undefined ? existing.dilucion_pct : defaultDil);
                      const yieldMl = calculateFormulaYieldMl({ formato: fmt, dilucion_pct: dilution });

                      const updatedPricing: FormulaPricing = {
                        precio_tarro: price,
                        formato: fmt,
                        dilucion_pct: dilution,
                        ml_por_tarro: yieldMl
                      };

                      const next = {
                        ...prev,
                        [item.nombre]: updatedPricing,
                        [item.id]: updatedPricing
                      };

                      try {
                        localStorage.setItem('formula_pricings_v2', JSON.stringify(next));
                      } catch (e) {}

                      if (isConfigured) {
                        supabase
                          .from('config_sedile')
                          .upsert({ key: 'formula_pricings_v2', value: next, updated_at: new Date().toISOString() })
                          .then(({ error }) => {
                            if (error) console.warn("Aviso al sincronizar formula_pricings_v2:", error.message);
                          });
                      }

                      return next;
                    });
                  };

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Banner Explicativo */}
                      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            💲
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-sm">
                              Catálogo Unificado de Precios de Bodega
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              Ingresa el valor de compra del tarro/envase. El sistema calcula automáticamente el gasto diario de bodega y el costo por ml para las mermas.
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-white text-purple-700 font-bold text-xs rounded-xl border border-purple-200 shadow-xs shrink-0">
                          {pricedCount} de {activeProducts.length} productos con precio
                        </span>
                      </div>

                      {/* Barra de Búsqueda y Filtros de Categoría */}
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar fórmula o suplemento..."
                            value={priceCatalogSearch}
                            onChange={(e) => setPriceCatalogSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                          />
                        </div>

                        {/* Pills de Categorías */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setPriceCatalogCategory(cat)}
                              className={"px-3 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 cursor-pointer " + (
                                priceCatalogCategory === cat
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lista Ágil de Productos */}
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {filteredProducts.length === 0 ? (
                          <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                            No se encontraron productos coincidentes con los filtros.
                          </div>
                        ) : (
                          filteredProducts.map(item => {
                            const pricing = formulaPricings[item.nombre] || formulaPricings[item.id] || {};
                            const currentPrice = pricing.precio_tarro || productPrices[item.id] || 0;
                            const currentFmt = (pricing.formato || detectFormulaFormat(item.nombre, item.unidad)) as FormulaFormat;
                            const currentFmtData = FORMULA_FORMAT_DATA[currentFmt] || FORMULA_FORMAT_DATA['polvo_400g'];
                            const isPowder = currentFmtData.isPowder;
                            const currentDil = pricing.dilucion_pct !== undefined ? pricing.dilucion_pct : currentFmtData.defaultDil;
                            const currentYield = calculateFormulaYieldMl({ formato: currentFmt, dilucion_pct: currentDil });
                            const costPerMl = currentPrice > 0 ? (currentPrice / Math.max(1, currentYield)) : 0;
                            const isSettingsOpen = !!expandedPriceSettings[item.id];
                            const dailySpend = (item.uso_diario || 0) * currentPrice;

                            return (
                              <div
                                key={item.id}
                                className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col gap-2.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  {/* Columna Izquierda: Identificación del Producto */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                                      🍼
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
                                          {item.nombre}
                                        </h5>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                          {item.categoria}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                                        <span>Uso: <strong className="text-slate-600">{item.uso_diario} {item.unidad}/día</strong></span>
                                        <span>•</span>
                                        <span>Gasto diario: <strong className="text-indigo-600 font-mono">${Math.round(dailySpend).toLocaleString('es-CL')}/día</strong></span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Columna Derecha: Rendimiento + Input de Precio + Botón de Opciones */}
                                  <div className="flex items-center justify-end gap-3 shrink-0">
                                    {/* Indicadores de Rendimiento */}
                                    <div className="text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-[9px] text-slate-400 font-semibold">
                                          {currentFmtData.label}
                                        </span>
                                        <span className="text-[10px] font-black text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                          {costPerMl > 0 ? `$${costPerMl.toFixed(2)}/ml` : '$0.00/ml'}
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 block mt-0.5">
                                        Rinde ~{currentYield.toLocaleString('es-CL')} ml {isPowder ? `(al ${currentDil}%)` : ''}
                                      </span>
                                    </div>

                                    {/* Input de Precio Tarro */}
                                    <div className="relative w-32">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-xs">$</span>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={currentPrice === 0 ? '' : currentPrice}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value) || 0);
                                          handleUpdatePrice(item, val, currentFmt, currentDil);
                                        }}
                                        className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 font-mono text-right focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs"
                                      />
                                    </div>

                                    {/* Botón de Ajuste Fino (Engranaje / Opciones) */}
                                    <button
                                      type="button"
                                      onClick={() => setExpandedPriceSettings(prev => ({ ...prev, [item.id]: !isSettingsOpen }))}
                                      className={"p-2 rounded-xl border transition-all cursor-pointer " + (
                                        isSettingsOpen
                                          ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-xs'
                                          : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                                      )}
                                      title="Ajustar formato o dilución personalizada"
                                    >
                                      <SlidersHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Fila Desplegable de Ajuste Fino (Formato y Dilución) */}
                                {isSettingsOpen && (
                                  <div className="mt-1 pt-2.5 border-t border-purple-100/80 bg-purple-50/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
                                    <div className="flex flex-wrap items-center gap-4">
                                      {/* Selector de Formato */}
                                      <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-bold text-purple-800 uppercase">Formato:</label>
                                        <select
                                          value={currentFmt}
                                          onChange={(e) => {
                                            const newFmt = e.target.value as FormulaFormat;
                                            const newDil = FORMULA_FORMAT_DATA[newFmt]?.defaultDil || 14;
                                            handleUpdatePrice(item, currentPrice, newFmt, newDil);
                                          }}
                                          className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                                        >
                                          {Object.keys(FORMULA_FORMAT_DATA).map(fKey => (
                                            <option key={fKey} value={fKey}>
                                              {FORMULA_FORMAT_DATA[fKey as FormulaFormat].label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Selector de Dilución para polvos */}
                                      {isPowder && (
                                        <div className="flex items-center gap-2">
                                          <label className="text-[10px] font-bold text-purple-800 uppercase">Dilución:</label>
                                          <div className="relative w-20">
                                            <input
                                              type="number"
                                              min="5"
                                              max="30"
                                              step="0.5"
                                              value={currentDil}
                                              onChange={(e) => {
                                                const val = Math.max(1, Number(e.target.value) || 14);
                                                handleUpdatePrice(item, currentPrice, currentFmt, val);
                                              }}
                                              className="w-full pr-5 pl-2 py-1 bg-white border border-purple-200 rounded-lg font-black text-purple-900 font-mono text-right text-xs focus:outline-none"
                                            />
                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-[10px]">%</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Resumen dinámico del rendimiento */}
                                    <div className="text-[11px] text-purple-800 font-medium">
                                      1 tarro rinde ~{currentYield.toLocaleString('es-CL')} ml • Costo: ${costPerMl.toFixed(2)} / ml
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Hospital Regional de Antofagasta • SEDILE-CEFE • Gestión Financiera de Bodega
              </span>
              <button
                onClick={() => setShowMermasCostModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cerrar Panel Financiero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SELECTOR DE MES PARA REPORTE DE MERMAS (IMAGEN) --- */}
      {showMermasMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-in">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ImageIcon className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">Generar Reporte de Mermas (Imagen)</h3>
                  <p className="text-xs text-blue-100 font-medium">Selecciona el período o mes que deseas exportar</p>
                </div>
              </div>
              <button
                onClick={() => setShowMermasMonthModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Opción 1: Reporte Histórico Completo */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                  Auditoría Consolidada
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMermasMonthModal(false);
                    copyMermasAsImage('all');
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                      📊
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-sm md:text-base group-hover:text-indigo-700 transition-colors">
                          Histórico Completo (Todos los meses)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wide">
                          Todo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Consolida todos los períodos ({mermasRecords.length} eventos registrados)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Generar</span>
                  </div>
                </button>
              </div>

              {/* Opción 2: Desglose por Mes */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                    Reporte por Mes Registrado ({availableMermasMonths.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Haz clic en el mes que deseas descargar
                  </span>
                </div>

                {availableMermasMonths.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                    No se encontraron registros de mermas por mes.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableMermasMonths.map(month => (
                      <button
                        key={month.monthKey}
                        type="button"
                        onClick={() => {
                          setShowMermasMonthModal(false);
                          copyMermasAsImage(month.monthKey);
                        }}
                        className="text-left p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-slate-800 text-sm group-hover:text-purple-700 transition-colors">
                              {month.monthKey}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                            {month.recordCount} reg.
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {month.mermasQty} uds. mermadas
                          </span>
                          <span className="text-rose-600 font-mono font-black">
                            $ {month.mermasCost.toLocaleString('es-CL')}
                          </span>
                        </div>

                        <div className="mt-2.5 w-full py-1.5 bg-slate-50 group-hover:bg-purple-600 group-hover:text-white text-slate-600 rounded-xl text-center text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                          <ImageIcon className="w-3 h-3" />
                          <span>Descargar Imagen</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
              <span>Resolución de imagen: 2000 × 1080 px (Ultra HD)</span>
              <button
                type="button"
                onClick={() => setShowMermasMonthModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BARRA FLOTANTE DE CAMBIOS PENDIENTES --- */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4 animate-slide-up backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-white">Tienes {Object.keys(pendingChanges).length} cambios pendientes</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Los cambios de stock aún no se han guardado en la base de datos.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm("¿Seguro que deseas descartar todos los cambios pendientes?")) {
                  setPendingChanges({});
                  showToast("Cambios descartados", "info");
                }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              Descartar
            </button>
            <button
              onClick={commitPendingChanges}
              disabled={syncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-emerald-500/20 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  CONFIRMAR ACTUALIZACIÓN DE STOCK
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- BOTÓN ESTÁTICO: ENTREGA DE PEG - PEDIATRÍA --- */}
      {!isAdmin && (
        <div className="max-w-7xl 2xl:max-w-[96vw] w-full mx-auto px-4 pb-8 sm:px-6 lg:px-8 flex justify-center mt-6">
          <button
            onClick={() => setShowPegPinModal(true)}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md border border-purple-400/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Acceder al registro de entregas de PEG para Pediatría"
          >
            <Heart className="w-4 h-4 fill-current text-purple-200 shrink-0" />
            <span>Entrega de PEG - Pediatría</span>
          </button>
        </div>
      )}

      {/* --- MODAL CLAVE DE ACCESO PEDIATRÍA --- */}
      {showPegPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800">Acceso Pediatría</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Ingresa la clave para gestionar entregas de PEG.</p>
            </div>
            <input
              type="password"
              placeholder="Clave de 4 dígitos"
              maxLength={4}
              value={pegPin}
              onChange={(e) => setPegPin(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-center text-slate-700 tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyPegPin();
              }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setShowPegPinModal(false);
                  setPegPin('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerifyPegPin}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE GESTIÓN DE ENTREGAS DE PEG - PEDIATRÍA --- */}
      {showPegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-[94vw] 2xl:max-w-[96vw] max-h-[92vh] xl:max-h-[96vh] overflow-y-auto md:overflow-y-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-in transition-all duration-300">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-900 text-white px-6 py-4 flex items-center justify-between shrink-0 relative">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPegHelp(prev => !prev)}
                  className="w-5.5 h-5.5 rounded-full bg-white/15 hover:bg-white/30 text-white font-black text-xs flex items-center justify-center border-none cursor-pointer transition-colors shadow-sm"
                  title="Manual de Ayuda y Operación"
                >
                  ?
                </button>
                <Heart className="w-5 h-5 text-purple-300 fill-current" />
                <h3 className="font-bold text-lg">Entrega de PEG - Pediatría</h3>
              </div>
              <button
                onClick={() => {
                  setShowPegModal(false);
                  setEditingPeg(null);
                  setShowPegHelp(false);
                  setNewPegForm({ paciente_cama: '', cantidad_entregada: 0, dosis_gramos_dia: 0, dosis_inicio_gramos: 0, fecha_entrega: new Date().toISOString().split('T')[0], fecha_inicio_uso: new Date().toISOString().split('T')[0], servicio: 'Lactantes' });
                }}
                className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* NUBE DE AYUDA DE PEG (POP-OVER BLANCO) */}
            {showPegHelp && (
              <div className="absolute left-4 top-14 w-[calc(100%-2rem)] sm:w-[480px] max-h-[75vh] overflow-y-auto bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 z-50 flex flex-col gap-4 text-left animate-fade-in text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <h4 className="font-black text-xs uppercase tracking-wider text-purple-950">Guía de Operación - PEG Pediatría</h4>
                  </div>
                  <button
                    onClick={() => setShowPegHelp(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer transition-colors"
                    title="Cerrar Manual"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  {/* Sección 1 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      ⏸️ Congelamiento de Stock (Reg Cero)
                    </h5>
                    <p className="leading-relaxed">
                      Si el paciente entra en <strong>Régimen Cero</strong>, haz clic en <strong>Reg Cero</strong>. El sistema congelará su remanente exacto en sobres y <strong>pausará el descuento automático</strong>.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Al reactivar al paciente (haciendo clic en <strong>Realimentar</strong>), el descuento se reanuda desde la hora actual usando el stock congelado.
                    </p>
                  </div>

                  {/* Sección 2 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      ⏱️ Conteo Dinámico por Horas
                    </h5>
                    <p className="leading-relaxed">
                      El descuento ocurre hora a hora en tiempo real a lo largo de todo el día. El stock en la pantalla siempre refleja lo que el paciente debería haber consumido hasta el minuto actual.
                    </p>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-600 space-y-1">
                      <strong>Ejemplo Práctico:</strong>
                      <p>
                        Si son las 17:30 y tiene una dosis programada a las 18:00, el stock mostrará sus unidades intactas. Al marcar las 18:00 (o 18:01), el sistema detecta de forma instantánea que la hora transcurrió y descuenta la dosis de forma inmediata.
                      </p>
                    </div>
                  </div>

                  {/* Sección 3 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      📋 Altas y Devolución Automática
                    </h5>
                    <p className="leading-relaxed">
                      Al dar de alta a un paciente activo (haciendo clic en <strong>Dar Alta</strong>), el sistema calcula cuántos sobres le quedan. Esos sobres sobrantes se descuentan del paciente y se <strong>suman automáticamente al Pozo de Excedentes</strong> de bodega para llevar el control clínico.
                    </p>
                  </div>

                  {/* Sección 4 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      🔄 Traslado de Servicios Clínicos
                    </h5>
                    <p className="leading-relaxed">
                      Si el paciente es trasladado de servicio (ej: de <strong>UCIPED</strong> a <strong>LACTANTES</strong>), solo debes hacer clic en el botón de <strong>Editar (lápiz)</strong>, cambiar el servicio en la lista desplegable y guardar.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      El paciente y todo su stock restante, horarios e inicio se trasladarán intactos de inmediato al nuevo servicio, sin requerir ninguna otra acción.
                    </p>
                  </div>

                  {/* Sección 5 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      ➕ Recargar Sobres (Dos Opciones)
                    </h5>
                    <p className="leading-relaxed">
                      Si el paciente necesita más sobres para que no se le agote el stock, puedes hacerlo de dos formas:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500">
                      <li><strong>Opción Rápida:</strong> Haz clic en el botón morado <strong>➕ PEG</strong> de su tarjeta. Escribe el número de sobres nuevos (ej: <code>6</code>) y se sumarán automáticamente a su stock total (ej: de <code>6</code> a <code>12</code> sobres). El pozo de excedentes es informativo y no restará sobres.</li>
                      <li><strong>Opción Manual:</strong> Haz clic en el icono del <strong>lápiz azul (Editar)</strong>. En el formulario, cambia la cantidad por el nuevo total acumulado (ej: escribe <code>12</code> en lugar de <code>6</code>) y haz clic en <strong>Actualizar</strong>.</li>
                    </ul>
                  </div>

                  {/* Sección 6 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      ✏️ Modificar la Dosis del Paciente
                    </h5>
                    <p className="leading-relaxed">
                      Si la indicación médica cambia y necesitas ajustar los gramos de cada toma:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[10px] text-slate-500">
                      <li>Haz clic en el icono del <strong>lápiz azul (Editar)</strong> en la tarjeta del paciente.</li>
                      <li>En el formulario de la izquierda, escribe el nuevo valor en el campo <strong>Dosis por Toma (Gramos)</strong>.</li>
                      <li>Haz clic en el botón <strong>Actualizar</strong>. El sistema recalculará la velocidad de consumo y la autonomía de días de forma inmediata.</li>
                    </ol>
                  </div>

                  {/* Sección 7 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      📡 Soporte Offline (Anti-caídas de Internet)
                    </h5>
                    <p className="leading-relaxed">
                      Si en el hospital se cae el internet mientras registras o recargas con <strong>➕ PEG</strong>, el sistema no se queda colgado ni pierde el registro. Guarda la información en la memoria interna del computador/celular (localStorage) y, en cuanto vuelve la conexión, se sincroniza automáticamente con la base de datos en la nube.
                    </p>
                  </div>

                  {/* Sección 8 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      🕒 Conteo de Dosis Sin Descuentos Retroactivos
                    </h5>
                    <p className="leading-relaxed">
                      El sistema <strong>nunca restará tomas pasadas del día</strong> anteriores al momento en que realizas la entrega física:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500">
                      <li>Si entregas sobres a las 18:00 hrs e indicas que el tratamiento comienza a las 18:00 hrs, las tomas pasadas de las 06:00 o 16:00 de hoy no se descuentan, preservando tus sobres intactos para el consumo real.</li>
                      <li>Si programas un inicio a una hora futura, el paciente mostrará <span className="text-blue-600 font-bold">🔵 PENDIENTE</span> hasta que llegue ese momento exacto.</li>
                    </ul>
                  </div>

                  {/* Sección 9 */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-purple-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      ⚖️ Dosis Diferenciadas por Horario y Alerta Preventiva
                    </h5>
                    <p className="leading-relaxed">
                      Para casos pediátricos donde la indicación médica especifica distinta cantidad de gramos por toma (ej: 8.5g a las 06:00 y 17g a las 22:00):
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500">
                      <li>Activa el switch <strong>"Diferenciar dosis por horario"</strong> en el formulario e ingresa los gramos de cada toma. El sistema descontará el valor exacto asignado a cada hora.</li>
                      <li>Cuando al paciente le queden 2 tomas o menos en stock, la tarjeta mostrará automáticamente la alerta destacada <span className="text-amber-600 font-bold">⚠️ RECARGA REQUERIDA (≤ 2 tomas)</span>.</li>
                    </ul>
                  </div>

                  {/* Sección Especial: Cambios y mejoras realizadas 10/08 */}
                  <div className="mt-4 pt-4 border-t-2 border-indigo-300 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100/90 p-4 rounded-2xl space-y-2.5 shadow-sm border">
                    <h4 className="font-black text-xs uppercase tracking-tight text-indigo-950 flex items-center gap-2">
                      <span className="text-base">🚀</span>
                      <span>Cambios y mejoras realizadas 10/08</span>
                    </h4>
                    <p className="text-[11px] text-indigo-950 font-bold leading-relaxed">
                      Resumen de auditoría de precisión y nuevas correcciones de cálculo aplicadas al módulo de PEG Pediatría:
                    </p>
                    
                    <div className="space-y-2 text-[10px] text-slate-700">
                      <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm space-y-1">
                        <strong className="text-indigo-900 text-[11px] block">1. Preservación del Historial de Tomas Administradas:</strong>
                        <p className="leading-relaxed text-slate-600">
                          Al hacer clic en <strong>Editar (✏️)</strong> en cualquier paciente registrado, el contador de tomas administradas ya <strong>NUNCA se reinicia a 0</strong>. Preserva de forma persistente todas sus tomas acumuladas anteriores y continúa sumando.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm space-y-1">
                        <strong className="text-indigo-900 text-[11px] block">2. Sin Descuentos Retroactivos al Editar Sobres:</strong>
                        <p className="leading-relaxed text-slate-600">
                          El campo "Sobres" al editar se abre pre-llenado automáticamente con los <strong>Sobres Restantes Disponibles hoy</strong>. Al guardar una nueva cifra (ej: <code>6</code> sobres), el paciente mantendrá exactamente <strong>6.0 sobres (102.0g)</strong> disponibles desde ese minuto exacto sin restar de forma retroactiva dosis pasadas.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm space-y-1">
                        <strong className="text-indigo-900 text-[11px] block">3. Corrección de Zona Horaria (Causa Raíz de Descuadres):</strong>
                        <p className="leading-relaxed text-slate-600">
                          Se corrigió la conversión UTC a medianoche que desfasaba el cálculo en 24 horas. Las fechas y horarios de conteo trabajan 100% en tiempo local de Chile (<code>YYYY-MM-DD</code> local), eliminando descuadres espontáneos a la medianoche.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm space-y-1">
                        <strong className="text-indigo-900 text-[11px] block">4. Transiciones Continuas en Reg Cero, SOS y Realimentar:</strong>
                        <p className="leading-relaxed text-slate-600">
                          Al alternar entre <strong>Reg Cero</strong>, <strong>SOS</strong> y <strong>Realimentar (Activo)</strong>, el sistema congela y reanuda exactamente el stock disponible y las tomas acumuladas sin descalzar el remanente.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm space-y-1">
                        <strong className="text-indigo-900 text-[11px] block">5. Interfaz Adaptativa para Pantallas Anchas:</strong>
                        <p className="leading-relaxed text-slate-600">
                          El panel de PEG y la vista principal se expanden dinámicamente en computadores y monitores de escritorio (hasta <code>96%</code> del ancho de pantalla), mejorando la visibilidad del seguimiento de stock.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección Especial: Cambios y mejoras realizadas 04/08 */}
                  <div className="mt-4 pt-4 border-t-2 border-purple-200 bg-purple-50/80 p-4 rounded-2xl space-y-2.5">
                    <h4 className="font-black text-xs uppercase tracking-tight text-purple-950 flex items-center gap-2">
                      <span>🚀</span>
                      <span>Cambios y mejoras realizadas 04/08</span>
                    </h4>
                    <p className="text-[11px] text-purple-900 font-semibold leading-relaxed">
                      Resumen de optimizaciones clínicas y correcciones de cálculo aplicadas al módulo de PEG Pediatría:
                    </p>
                    
                    <div className="space-y-2 text-[10px] text-slate-700">
                      <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1">
                        <strong className="text-purple-900 text-[11px] block">1. Corrección de Tomas en Régimen Cero y Dosis 0g:</strong>
                        <p className="leading-relaxed text-slate-600">
                          Se corrigió la acumulación de tomas pasadas. Anteriormente, si un paciente permanecía en Régimen Cero o volumen 0g, el reloj contaba erróneamente los horarios pasados como "tomas administradas" virtuales (mostrando ej: 17 tomas con 0g consumidos). Ahora, si la dosis es de 0g o está pausado, las tomas administradas se mantienen estrictamente en <strong>0 tomas (Sin consumo)</strong>.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1">
                        <strong className="text-purple-900 text-[11px] block">2. Nueva Modalidad SOS (A Pedido):</strong>
                        <p className="leading-relaxed text-slate-600">
                          Se incorporó el botón y la etiqueta <strong>🆘 SOS (A Pedido)</strong>. Para pacientes cuyo suplemento PEG se administra solo si el servicio lo solicita (PRN), al activar esta opción se detiene el descuento automático por horario, manteniendo el stock remanente intacto sin descontar tomas por reloj.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1">
                        <strong className="text-purple-900 text-[11px] block">3. Corrección en Reingreso / Reactivación de Altas:</strong>
                        <p className="leading-relaxed text-slate-600">
                          Al hacer clic en <strong>Reactivar</strong> a un paciente desde el Historial de Altas, la app ahora solicita la cantidad exacta de sobres a entregar para la nueva estadía y actualiza la hora de inicio al momento actual, evitando que se le descuenten de inmediato tomas pasadas del día.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1">
                        <strong className="text-purple-900 text-[11px] block">4. Protección de Recargas Rápida (➕ PEG):</strong>
                        <p className="leading-relaxed text-slate-600">
                          Al añadir sobres nuevos con <strong>➕ PEG</strong> a un paciente que estuvo sin stock (0 sobres), el sistema resetea el tiempo de inicio al horario en que se entrega la recarga, evitando que el consumo acumulado de los días sin stock devore los sobres nuevos.
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1">
                        <strong className="text-purple-900 text-[11px] block">5. Formateo de Decimales en Gramos:</strong>
                        <p className="leading-relaxed text-slate-600">
                          Se aplicó redondeo a 1 decimal en la presentación del stock remanente en gramos, eliminando decimales extensos por imprecisión de coma flotante (ej: cambiando <code>102.79999999999998g</code> por un limpio <code>102.8g</code>).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-[10px] leading-relaxed text-purple-700 shrink-0 font-medium space-y-1.5">
                  <div><strong>💡 Conteo Inteligente:</strong> Las tomas se restan solas en tiempo real según el transcurso de las horas del día basándose en el reloj local.</div>
                  <div className="border-t border-purple-200/55 pt-1.5 text-[9.5px]">
                    <strong>✅ Regla de Oro para evitar Desfases Físicos vs Digitales:</strong>
                    <ul className="list-disc pl-3.5 space-y-0.5 mt-1 text-purple-800 font-normal">
                      <li>Registra en la app inmediatamente al entregar sobres de PEG físicos nuevos.</li>
                      <li>Haz clic en <strong>Dar Alta</strong> apenas el paciente se retire para devolver los sobres sobrantes reales al pozo clínico.</li>
                      <li>Si el paciente suspende transitoriamente su alimentación, usa <strong>Reg Cero</strong> para pausar el conteo y evitar descuentos automáticos erróneos.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Bitácora / Historial de Movimientos de Paciente */}
            {showPegAuditModal && selectedPegAuditPatient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-purple-100 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
                  {/* Cabecera */}
                  <div className="bg-gradient-to-r from-purple-700 to-indigo-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📜</span>
                      <div>
                        <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                          <span>Bitácora de Movimientos</span>
                        </h3>
                        <p className="text-[10px] text-purple-200 font-medium">
                          {parsePegPatientData(selectedPegAuditPatient).cleanName} • {selectedPegAuditPatient.servicio}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowPegAuditModal(false);
                        setSelectedPegAuditPatient(null);
                      }}
                      className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Resumen del paciente */}
                  {(() => {
                    const isPausedOrSos = selectedPegAuditPatient.status === 'paused' || selectedPegAuditPatient.status === 'sos' || Number(selectedPegAuditPatient.dosis_gramos_dia) === 0;
                    const { consumedGrams, dosesPassed } = calculateConsumedGrams(selectedPegAuditPatient, isPausedOrSos);
                    const totalGrams = selectedPegAuditPatient.cantidad_entregada * 17;
                    const remainingGrams = Math.max(0, totalGrams - consumedGrams);
                    const remainingSobres = Math.round((remainingGrams / 17) * 2) / 2;

                    const patientLogs = pegAuditLogs.filter(l => l.delivery_id === selectedPegAuditPatient.id);

                    const displayLogs = patientLogs.length > 0 ? patientLogs : [
                      {
                        id: 'initial_fallback',
                        delivery_id: selectedPegAuditPatient.id,
                        fecha_hora: `${selectedPegAuditPatient.fecha_entrega} (Registro Inicial)`,
                        tipo: 'inicial' as const,
                        titulo: 'Entrega Inicial de PEG',
                        detalle: `Registro inicial de ${selectedPegAuditPatient.cantidad_entregada} sobres (${selectedPegAuditPatient.cantidad_entregada * 17}g). Dosis: ${selectedPegAuditPatient.dosis_gramos_dia}g/toma.`
                      }
                    ];

                    return (
                      <div className="p-4 overflow-y-auto space-y-4 flex-1">
                        {/* Estado actual resumen */}
                        <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block">Estado Actual</span>
                            <span className="font-extrabold text-slate-800">
                              {selectedPegAuditPatient.status === 'active' ? '🟢 Activo' :
                               selectedPegAuditPatient.status === 'paused' ? '⏸️ Régimen Cero' :
                               selectedPegAuditPatient.status === 'sos' ? '🆘 SOS (A Pedido)' :
                               '🔴 De Alta'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block">Stock Restante</span>
                            <span className="font-black text-purple-900">{remainingSobres.toFixed(1)} sobres</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block">Tomas Administradas</span>
                            <span className="font-extrabold text-slate-800">{dosesPassed} tomas</span>
                          </div>
                        </div>

                        {/* Línea de tiempo de eventos */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <span>⏱️</span>
                            <span>Historial de Eventos Registrados</span>
                          </h4>

                          <div className="space-y-2.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-100 pl-6">
                            {displayLogs.map(log => {
                              const badgeStyle = 
                                log.tipo === 'inicial' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                log.tipo === 'recarga' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                log.tipo === 'reg_cero' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                log.tipo === 'sos' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                log.tipo === 'activo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                log.tipo === 'alta' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                log.tipo === 'reactivacion' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                                'bg-slate-100 text-slate-800 border-slate-200';

                              const icon = 
                                log.tipo === 'inicial' ? '📦' :
                                log.tipo === 'recarga' ? '➕' :
                                log.tipo === 'reg_cero' ? '⏸️' :
                                log.tipo === 'sos' ? '🆘' :
                                log.tipo === 'activo' ? '▶️' :
                                log.tipo === 'alta' ? '📋' :
                                log.tipo === 'reactivacion' ? '↩️' :
                                '✏️';

                              return (
                                <div key={log.id} className="relative bg-white p-3 rounded-xl border border-slate-200/70 shadow-xs space-y-1">
                                  <div className="absolute -left-[19px] top-3.5 w-2 h-2 rounded-full bg-purple-600 ring-4 ring-purple-100" />
                                  
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span>{icon}</span>
                                      <strong className="text-xs text-slate-800 font-bold">{log.titulo}</strong>
                                    </div>
                                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                      {log.fecha_hora}
                                    </span>
                                  </div>

                                  <p className="text-[10px] text-slate-600 leading-relaxed pl-5">
                                    {log.detalle}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pie de modal */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                    <button
                      onClick={() => {
                        setShowPegAuditModal(false);
                        setSelectedPegAuditPatient(null);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                    >
                      Cerrar Bitácora
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pozo de Excedentes Global (KPI Box editable) */}
            <div className="bg-purple-50 border-b border-purple-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🧴</span>
                <div>
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-tight">Pozo de Excedentes en Bodega</h4>
                  <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Sobres recuperados de pacientes de alta listos para reutilizar.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="hidden lg:flex items-center gap-1 bg-purple-100/60 px-2.5 py-1 rounded-xl border border-purple-200/60 text-[9px] font-bold text-purple-800 flex-wrap">
                  <span className="text-purple-600 font-bold uppercase tracking-wider text-[8px] mr-1">Activos por Servicio:</span>
                  {PEG_SERVICES.map(svc => {
                    const activeInSvc = pegDeliveries.filter(item => {
                      if (item.servicio !== svc) return false;
                      if (item.status !== 'active' && item.status !== 'paused' && item.status !== 'sos') return false;
                      const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || Number(item.dosis_gramos_dia) === 0;
                      const { consumedGrams } = calculateConsumedGrams(item, isPausedOrSos);
                      const totalGrams = item.cantidad_entregada * 17;
                      return (totalGrams - consumedGrams) > 0;
                    });
                    const totalSobresInSvc = activeInSvc.reduce((acc, item) => {
                      const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || Number(item.dosis_gramos_dia) === 0;
                      const { consumedGrams } = calculateConsumedGrams(item, isPausedOrSos);
                      const totalGrams = item.cantidad_entregada * 17;
                      const rem = Math.max(0, totalGrams - consumedGrams);
                      return acc + (rem / 17);
                    }, 0);
                    const roundedSvcSobres = Math.round(totalSobresInSvc * 2) / 2;

                    return (
                      <span key={svc} className="px-1.5 py-0.5 rounded bg-white text-purple-900 border border-purple-200">
                        {svc}: <strong>{roundedSvcSobres.toFixed(1)}s</strong>
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-sm shrink-0">
                  <span className="text-[11px] font-bold text-purple-700">Sobres Excedentes:</span>
                  <span className="px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-lg text-xs font-black text-purple-900 min-w-10 text-center">
                    {pegSurplusPool.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">sobres</span>
                </div>
              </div>
            </div>

            {/* Contenido dividido */}
            <div className="p-4 sm:p-5 lg:p-6 xl:p-7 overflow-y-visible md:overflow-hidden bg-slate-50 flex-1 flex flex-col md:flex-row gap-5 xl:gap-7">
              {/* Columna Izquierda: Formulario */}
              <div className="w-full md:w-1/3 lg:w-1/3 xl:w-[360px] 2xl:w-[400px] bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3 shrink-0 md:max-h-full md:overflow-y-auto md:pr-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight border-b border-slate-100 pb-2">
                  {editingPeg ? '✏️ Editar Entrega' : '➕ Registrar Entrega'}
                </h4>
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Servicio Clínico</label>
                    <select
                      value={newPegForm.servicio}
                      onChange={(e) => setNewPegForm(prev => ({ ...prev, servicio: e.target.value as any }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                    >
                      {PEG_SERVICES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Paciente / Cama</label>
                    <input
                      type="text"
                      placeholder="Ej: 301-1 Juanito Perez"
                      value={newPegForm.paciente_cama}
                      onChange={(e) => setNewPegForm(prev => ({ ...prev, paciente_cama: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sobres Entregados</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej: 6 sobres"
                      value={newPegForm.cantidad_entregada || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setNewPegForm(prev => ({ ...prev, cantidad_entregada: val }));
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dosis por Toma (Gramos)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Ej: 5 gr"
                      value={newPegForm.dosis_gramos_dia || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setNewPegForm(prev => ({ ...prev, dosis_gramos_dia: val, dosis_inicio_gramos: val }));
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Horario de comienzo de PEG</label>
                    <div className="flex flex-wrap gap-1">
                      {['06:00', '16:00', '18:00', '22:00'].map(hour => {
                        const isSelected = pegStartHour === hour;
                        return (
                          <button
                            type="button"
                            key={hour}
                            onClick={() => setPegStartHour(hour)}
                            className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer " + (
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            )}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Horarios establecidos de PEG</label>
                    <div className="flex flex-wrap gap-1">
                      {['06:00', '16:00', '18:00', '22:00'].map(hour => {
                        const schedulesArr = pegSchedulesStr.split(',').map(s => s.trim()).filter(Boolean);
                        const isSelected = schedulesArr.includes(hour);
                        
                        return (
                          <button
                            type="button"
                            key={hour}
                            onClick={() => {
                              let nextArr;
                              if (isSelected) {
                                nextArr = schedulesArr.filter(h => h !== hour);
                              } else {
                                nextArr = [...schedulesArr, hour];
                              }
                              const sorted = ['06:00', '16:00', '18:00', '22:00'].filter(h => nextArr.includes(h));
                              setPegSchedulesStr(sorted.join(', '));
                            }}
                            className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer " + (
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            )}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Seleccione uno o varios horarios establecidos.</span>
                    
                    {/* Switch: Diferenciar dosis por horario */}
                    <div className="mt-2 flex flex-col gap-1.5 bg-purple-50/60 p-2 rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setUseCustomScheduleDoses(prev => !prev)}>
                        <span className="text-[10px] font-bold text-purple-900 select-none flex items-center gap-1.5">
                          <span>⚖️</span>
                          <span>Diferenciar dosis por horario</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={useCustomScheduleDoses}
                          onChange={(e) => setUseCustomScheduleDoses(e.target.checked)}
                          className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer accent-purple-600"
                        />
                      </div>
                      
                      {useCustomScheduleDoses && (
                        <div className="grid grid-cols-2 gap-1.5 mt-1 pt-1.5 border-t border-purple-200/50">
                          {pegSchedulesStr.split(',').map(s => s.trim()).filter(Boolean).map(h => (
                            <div key={h} className="flex flex-col gap-0.5">
                              <label className="text-[9px] font-bold text-purple-800">Toma {h} (gr):</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                placeholder={newPegForm.dosis_gramos_dia ? `${newPegForm.dosis_gramos_dia}g` : 'Ej: 8.5'}
                                value={customScheduleDoses[h] !== undefined ? customScheduleDoses[h] : (newPegForm.dosis_gramos_dia || '')}
                                onChange={(e) => {
                                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                                  setCustomScheduleDoses(prev => ({ ...prev, [h]: val }));
                                }}
                                className="px-2 py-0.5 border border-purple-200 rounded-lg text-xs font-bold text-purple-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Fechas en Grid de dos columnas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">F. Entrega</label>
                      <input
                        type="date"
                        value={newPegForm.fecha_entrega}
                        onChange={(e) => setNewPegForm(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                        className="w-full px-2 py-1 border border-slate-200 rounded-xl font-semibold text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">F. Inicio Uso</label>
                      <input
                        type="date"
                        value={newPegForm.fecha_inicio_uso}
                        onChange={(e) => setNewPegForm(prev => ({ ...prev, fecha_inicio_uso: e.target.value }))}
                        className="w-full px-2 py-1 border border-slate-200 rounded-xl font-semibold text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  {editingPeg && (
                    <button
                      onClick={() => {
                        setEditingPeg(null);
                        setNewPegForm({ paciente_cama: '', cantidad_entregada: 0, dosis_gramos_dia: 0, dosis_inicio_gramos: 0, fecha_entrega: new Date().toISOString().split('T')[0], fecha_inicio_uso: new Date().toISOString().split('T')[0], servicio: 'Lactantes' });
                        setPegStartHour('');
                        setPegSchedulesStr('');
                        setUseCustomScheduleDoses(false);
                        setCustomScheduleDoses({});
                      }}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!newPegForm.paciente_cama || newPegForm.cantidad_entregada === undefined || newPegForm.cantidad_entregada === null || newPegForm.dosis_gramos_dia === undefined || newPegForm.dosis_gramos_dia === null || !newPegForm.fecha_entrega || !newPegForm.fecha_inicio_uso) {
                        showToast("Por favor, complete todos los campos.", "error");
                        return;
                      }
                      
                      const cleanSchedules = pegSchedulesStr.split(',').map(s => s.trim()).filter(Boolean);
                      if (cleanSchedules.length === 0) {
                        showToast("Por favor, seleccione uno o más horarios establecidos de la lista.", "error");
                        return;
                      }

                      const cleanStartHour = pegStartHour.trim();
                      if (!cleanStartHour) {
                        showToast("Por favor, seleccione el horario de comienzo del PEG.", "error");
                        return;
                      }

                      const formattedSchedules = cleanSchedules.map(h => {
                        if (useCustomScheduleDoses) {
                          const customD = customScheduleDoses[h] !== undefined ? customScheduleDoses[h] : newPegForm.dosis_gramos_dia;
                          return `${h}@${customD}`;
                        }
                        return h;
                      });

                      const schedulesStrCombined = formattedSchedules.join(',');
                      const combinedPacienteCama = `${newPegForm.paciente_cama} [${cleanStartHour} | ${schedulesStrCombined}]`;
                      const initialStatus = newPegForm.dosis_gramos_dia === 0 ? 'paused' : ((newPegForm as any).status || 'active');
                      const recordToSend = {
                        ...newPegForm,
                        status: initialStatus,
                        paciente_cama: combinedPacienteCama,
                        dosis_inicio_gramos: newPegForm.dosis_gramos_dia
                      };

                      if (editingPeg) {
                        await handleUpdatePegDelivery({ ...editingPeg, ...recordToSend });
                        setEditingPeg(null);
                      } else {
                        const res = await handleAddPegDelivery(recordToSend);
                        if (res === false) return;
                      }
                      
                      setNewPegForm({ paciente_cama: '', cantidad_entregada: 0, dosis_gramos_dia: 0, dosis_inicio_gramos: 0, fecha_entrega: new Date().toISOString().split('T')[0], fecha_inicio_uso: new Date().toISOString().split('T')[0], servicio: 'Lactantes' });
                      setPegStartHour('');
                      setPegSchedulesStr('');
                      setUseCustomScheduleDoses(false);
                      setCustomScheduleDoses({});
                    }}
                    disabled={loadingPeg}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border-none"
                  >
                    {editingPeg ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Listados */}
              <div className="flex-1 flex flex-col gap-6 overflow-x-hidden md:overflow-y-auto md:pr-2">
                {/* 1. Seguimiento de Stock Activo */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight">
                      📋 Seguimiento de Stock en Pacientes Activos
                    </h4>
                    {/* Filtros de Servicio */}
                    <div className="flex flex-wrap gap-1">
                      {['Todos', ...PEG_SERVICES].map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedPegServiceFilter(s)}
                          className={"px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer border " + (
                            selectedPegServiceFilter === s
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const activePatients = pegDeliveries.filter(item => {
                      if (item.status !== 'active' && item.status !== 'paused' && item.status !== 'sos') return false;
                      if (selectedPegServiceFilter !== 'Todos' && item.servicio !== selectedPegServiceFilter) return false;
                      return true;
                    });

                    if (activePatients.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          No hay pacientes activos.
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-y-visible max-h-none divide-y divide-slate-100 pr-1">
                        {activePatients.map(item => {
                          const { cleanName, startHour, schedules, scheduleDetails, hasCustomDoses, totalDailyGrams } = parsePegPatientData(item);
                          const isPausedOrSos = item.status === 'paused' || item.status === 'sos' || totalDailyGrams === 0 || Number(item.dosis_gramos_dia) === 0;
                          const { consumedGrams, dosesPassed } = calculateConsumedGrams(item, isPausedOrSos);
                          
                          const totalGrams = item.cantidad_entregada * 17;
                          const remainingGrams = Math.max(0, totalGrams - consumedGrams);
                          const remainingSobres = Math.round((remainingGrams / 17) * 2) / 2;
                          const remainingDays = totalDailyGrams > 0 ? (remainingGrams / totalDailyGrams) : 0;

                          const avgDoseGrams = scheduleDetails.length > 0 ? (totalDailyGrams / scheduleDetails.length) : item.dosis_gramos_dia;
                          const remainingDosesCount = avgDoseGrams > 0 ? Math.floor(remainingGrams / avgDoseGrams) : 0;

                          const isPending = new Date() < new Date(`${item.fecha_inicio_uso}T${startHour}:00`);
                          const isNoStockAlert = !isPending && !isPausedOrSos && (remainingGrams <= 0 || remainingSobres <= 0 || remainingDosesCount === 0);
                          const isLowStockAlert = !isPending && !isPausedOrSos && !isNoStockAlert && remainingDosesCount === 1;

                          return (
                            <div key={item.id} className="py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-xs hover:bg-slate-50/30 px-3 rounded-xl transition-all border-b border-slate-100 last:border-0">
                              <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-slate-800 font-black text-sm break-words whitespace-normal">{cleanName}</span>
                                  {/* Badge del Servicio */}
                                  <span className={"px-2 py-0.5 rounded-md text-[8px] font-black uppercase border " + (PEG_SERVICE_COLORS[item.servicio] || 'bg-slate-50 text-slate-600 border-slate-200')}>
                                    {item.servicio}
                                  </span>
                                  
                                  {item.status === 'paused' || item.dosis_gramos_dia === 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white border border-amber-600/50 animate-pulse">
                                      ⏸️ REG CERO (Pausado)
                                    </span>
                                  ) : item.status === 'sos' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white border border-indigo-700/50 animate-pulse">
                                      🆘 SOS (A Pedido)
                                    </span>
                                  ) : isPending ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200/50">
                                      🔵 PENDIENTE (Inicia el {item.fecha_inicio_uso.substring(5)} a las {startHour})
                                    </span>
                                  ) : isNoStockAlert ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white border border-rose-600/50 animate-pulse">
                                      🚨 0 STOCK (Sin sobres)
                                    </span>
                                  ) : isLowStockAlert ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white border border-amber-600/50 animate-pulse">
                                      ⚠️ RECARGA REQUERIDA (1 toma)
                                    </span>
                                  ) : remainingDays <= 1 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200/50">
                                      🟡 ALERTA (≤ 1 día)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                                      🟢 ESTABLE ({remainingDays.toFixed(1)} días)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium space-x-1.5 flex flex-wrap items-center">
                                  <span>Entregado: <strong>{item.cantidad_entregada} sobres</strong> ({item.fecha_entrega})</span>
                                  <span>•</span>
                                  <span>Dosis: <strong>{hasCustomDoses ? 'Varía por horario' : (item.dosis_gramos_dia > 0 ? `${item.dosis_gramos_dia}g/toma` : '0g (Reg Cero / SOS)')}</strong></span>
                                  <span>•</span>
                                  <span>Horarios: <strong className="text-purple-600">
                                    {hasCustomDoses 
                                      ? scheduleDetails.map(d => `${d.hour} (${d.doseGrams}g)`).join(', ') 
                                      : schedules.join(', ')}
                                  </strong></span>
                                  <span>•</span>
                                  <span>Administradas: <strong>{isPausedOrSos ? '0 tomas (Sin consumo)' : `${dosesPassed} tomas`}</strong></span>
                                </div>
                              </div>
                              
                              <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-3 shrink-0">
                                <div className="text-left xl:text-right shrink-0">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Stock Restante</span>
                                  <span className="text-xs font-black text-slate-800">
                                    {remainingSobres.toFixed(1)} sobres <span className="text-slate-400 font-semibold font-mono">({Number(remainingGrams.toFixed(1))}g)</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 flex-wrap">
                                  {item.status === 'paused' || item.status === 'sos' ? (
                                    <button
                                      onClick={() => handleResumePegPatient(item)}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-all text-[10px] border border-emerald-200 cursor-pointer animate-pulse"
                                      title="Reanudar la alimentación con descuento automático"
                                    >
                                      Realimentar
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handlePausePegPatient(item, remainingSobres)}
                                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg transition-all text-[10px] border border-amber-200 cursor-pointer"
                                        title="Pausar el descuento automático (Régimen Cero)"
                                      >
                                        Reg Cero
                                      </button>
                                      <button
                                        onClick={() => handleSosPegPatient(item, remainingSobres)}
                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all text-[10px] border border-indigo-200 cursor-pointer"
                                        title="Cambiar a modalidad SOS / A Pedido (Sin descuento automático)"
                                      >
                                        SOS
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDischargePegPatient(item, remainingSobres)}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-all text-[10px] border border-purple-200 cursor-pointer"
                                    title="Dar de alta al paciente y sumar sobres sobrantes a bodega"
                                  >
                                    Dar Alta
                                  </button>
                                  <button
                                    onClick={() => handleQuickAddSobres(item)}
                                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all text-[10px] border-none cursor-pointer"
                                    title="Agregar más sobres de PEG entregados (recarga rápida)"
                                  >
                                    ➕ PEG
                                  </button>
                                  <button
                                    onClick={() => {
                                      const parsed = parsePegPatientData(item);
                                      setEditingPeg(item);
                                      setNewPegForm({
                                        paciente_cama: parsed.cleanName,
                                        cantidad_entregada: item.cantidad_entregada,
                                        dosis_gramos_dia: item.dosis_gramos_dia,
                                        dosis_inicio_gramos: item.dosis_inicio_gramos,
                                        fecha_entrega: item.fecha_entrega,
                                        fecha_inicio_uso: item.fecha_inicio_uso,
                                        servicio: item.servicio
                                      });
                                      setPegStartHour(parsed.startHour);
                                      setPegSchedulesStr(parsed.schedules.join(', '));
                                      setUseCustomScheduleDoses(parsed.hasCustomDoses);
                                      const map: Record<string, number> = {};
                                      parsed.scheduleDetails.forEach(d => { map[d.hour] = d.doseGrams; });
                                      setCustomScheduleDoses(map);
                                    }}
                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Historial y Altas de Pacientes (Agrupado por Mes con Buscador Rápido) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4 flex-1">
                  {(() => {
                    const historicalPatients = pegDeliveries.filter(item => item.status === 'discharged');

                    // Filtrado por servicio y por buscador
                    const filteredHist = historicalPatients.filter(item => {
                      if (selectedPegServiceFilter !== 'Todos' && item.servicio !== selectedPegServiceFilter) return false;
                      if (!pegHistSearchQuery.trim()) return true;
                      const q = pegHistSearchQuery.toLowerCase().trim();
                      const parsed = parsePegPatientData(item);
                      const nameMatch = parsed.cleanName.toLowerCase().includes(q);
                      const rawMatch = (item.paciente_cama || '').toLowerCase().includes(q);
                      const serviceMatch = (item.servicio || '').toLowerCase().includes(q);
                      const dateMatch = (item.discharge_date || '').toLowerCase().includes(q);
                      return nameMatch || rawMatch || serviceMatch || dateMatch;
                    });

                    const totalDischargedSobres = historicalPatients
                      .reduce((acc, item) => acc + (item.leftover_sobres || 0), 0);
                    const roundedDischarged = Math.round(totalDischargedSobres * 2) / 2;
                    const filterLabelSuffix = selectedPegServiceFilter === 'Todos' ? '(Total)' : `(${selectedPegServiceFilter})`;

                    // Agrupar por MES (ej: "Agosto 2026", "Julio 2026")
                    const monthGroups: Record<string, any[]> = {};
                    filteredHist.forEach(item => {
                      const finishDate = getPatientFinishedDate(item);
                      const mKey = getMonthYearKey(finishDate);
                      if (!monthGroups[mKey]) monthGroups[mKey] = [];
                      monthGroups[mKey].push(item);
                    });

                    // Ordenar meses (el mes más reciente primero)
                    const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
                      const dateA = monthGroups[a][0]?.discharge_date || getPatientFinishedDate(monthGroups[a][0]);
                      const dateB = monthGroups[b][0]?.discharge_date || getPatientFinishedDate(monthGroups[b][0]);
                      return dateB.localeCompare(dateA);
                    });

                    const currentMonthKey = getMonthYearKey(new Date().toISOString().split('T')[0]);

                    return (
                      <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight">
                              📋 Historial y Altas de Pacientes
                            </h4>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              {filteredHist.length} altas
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Buscador Rápido */}
                            <div className="relative min-w-[200px] flex-1 sm:flex-none">
                              <input
                                type="text"
                                placeholder="🔍 Buscar por nombre o cama..."
                                value={pegHistSearchQuery}
                                onChange={(e) => setPegHistSearchQuery(e.target.value)}
                                className="w-full pl-3 pr-8 py-1.5 border border-slate-200 rounded-xl font-medium text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50"
                              />
                              {pegHistSearchQuery && (
                                <button
                                  onClick={() => setPegHistSearchQuery('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold border-none bg-transparent cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div className="px-2.5 py-1.5 bg-purple-50 border border-purple-100 rounded-xl text-[10px] text-purple-800 font-semibold flex items-center gap-1.5 shrink-0">
                              <span>Sobres sobrantes devueltos:</span>
                              <strong className="text-purple-900 font-black">{roundedDischarged.toFixed(1)} sobres</strong>
                              <span className="text-[9px] text-purple-600 font-medium">{filterLabelSuffix}</span>
                            </div>
                          </div>
                        </div>

                        {filteredHist.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            {pegHistSearchQuery ? `No se encontraron altas que coincidan con "${pegHistSearchQuery}".` : 'No hay pacientes en el historial.'}
                          </div>
                        ) : (
                          <div className="overflow-y-visible max-h-none pr-1 space-y-3">
                            {sortedMonthKeys.map(monthKey => {
                              const groupItems = monthGroups[monthKey];
                              // El mes actual viene desplegado por defecto (o todos desplegados si hay búsqueda)
                              const isDefaultOpen = monthKey === currentMonthKey || !!pegHistSearchQuery.trim();
                              const isExpanded = expandedPegHistMonths[monthKey] !== undefined ? expandedPegHistMonths[monthKey] : isDefaultOpen;
                              
                              const monthSobres = groupItems.reduce((acc, item) => acc + (item.leftover_sobres || 0), 0);

                              return (
                                <div key={monthKey} className="border border-purple-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                                  {/* Cabecera del Mes de Alta */}
                                  <button
                                    onClick={() => setExpandedPegHistMonths(prev => ({ ...prev, [monthKey]: !isExpanded }))}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50/60 hover:from-purple-100/60 hover:to-indigo-100/60 text-slate-800 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer border-none focus:outline-none border-b border-purple-100/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>📅</span>
                                      <span className="text-purple-950 font-black">{monthKey}</span>
                                      <span className="text-[10px] font-bold text-purple-700 bg-white/80 px-2 py-0.5 rounded-full border border-purple-200/60">
                                        {groupItems.length} paciente{groupItems.length > 1 ? 's' : ''}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-semibold text-purple-800 hidden sm:inline">
                                        Devueltos: <strong>{monthSobres.toFixed(1)} sobres</strong>
                                      </span>
                                      <ChevronDown className={"w-4 h-4 text-purple-600 transition-transform duration-200 " + (isExpanded ? "rotate-180" : "")} />
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="bg-white divide-y divide-slate-100 px-4 py-2">
                                      {(() => {
                                        // Agrupar items de este mes por servicio
                                        const itemsByService: Record<string, any[]> = {};
                                        groupItems.forEach(item => {
                                          const svc = item.servicio || 'Sin Servicio';
                                          if (!itemsByService[svc]) itemsByService[svc] = [];
                                          itemsByService[svc].push(item);
                                        });

                                        return Object.keys(itemsByService).map(svcKey => {
                                          const svcItems = itemsByService[svcKey];
                                          return (
                                            <div key={svcKey} className="py-2.5 first:pt-1 last:pb-1">
                                              {/* Título de sección de servicio */}
                                              <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
                                                <span className={"w-2 h-2 rounded-full " + (
                                                  svcKey === 'Lactantes' ? 'bg-blue-500' :
                                                  svcKey === 'Preescolares' ? 'bg-emerald-500' :
                                                  svcKey === 'Escolares' ? 'bg-purple-500' :
                                                  svcKey === 'Oncoped' ? 'bg-cyan-500' :
                                                  'bg-slate-500'
                                                )} />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{svcKey}</span>
                                                <span className="text-[9px] text-slate-400 font-semibold">({svcItems.length})</span>
                                              </div>

                                              {/* Pacientes de este servicio */}
                                              <div className="divide-y divide-slate-100/60 pl-3">
                                                {svcItems.map(item => {
                                                  const isDischarged = item.status === 'discharged';
                                                  const parsed = parsePegPatientData(item);
                                                  return (
                                                    <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 p-1.5 rounded-xl transition-colors">
                                                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="text-slate-900 font-bold text-xs break-words">{parsed.cleanName}</span>
                                                          {isDischarged ? (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                                              {"🔴 DE ALTA (Sobrante: " + (item.leftover_sobres || 0).toFixed(1) + " sobres)"}
                                                            </span>
                                                          ) : (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                                                              ⚪ SIN STOCK (Agotado)
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                                                          <span>Entregados: <strong>{item.cantidad_entregada} sobres</strong></span>
                                                          <span>•</span>
                                                          <span>Dosis: <strong>{item.dosis_gramos_dia}g/toma</strong></span>
                                                          <span>•</span>
                                                          <span>Horarios: <strong className="text-purple-600">{parsed.schedules.join(', ')}</strong></span>
                                                          {isDischarged && item.discharge_date && (
                                                            <>
                                                              <span>•</span>
                                                              <span className="text-slate-600 font-semibold">Fecha Alta: <strong>{item.discharge_date}</strong></span>
                                                            </>
                                                          )}
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                        <button
                                                          onClick={() => {
                                                            setSelectedPegAuditPatient(item);
                                                            setShowPegAuditModal(true);
                                                          }}
                                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all text-[10px] border border-slate-200 cursor-pointer flex items-center gap-1"
                                                          title="Ver bitácora e historial de movimientos de este paciente"
                                                        >
                                                          <span>📜</span>
                                                          <span>Bitácora</span>
                                                        </button>
                                                        <button
                                                          onClick={() => {
                                                            setEditingPeg(item);
                                                            setNewPegForm({
                                                              paciente_cama: parsed.cleanName,
                                                              cantidad_entregada: item.cantidad_entregada,
                                                              dosis_gramos_dia: item.dosis_gramos_dia,
                                                              dosis_inicio_gramos: item.dosis_inicio_gramos,
                                                              fecha_entrega: item.fecha_entrega,
                                                              fecha_inicio_uso: item.fecha_inicio_uso,
                                                              servicio: item.servicio
                                                            });
                                                            setPegStartHour(parsed.startHour);
                                                            setPegSchedulesStr(parsed.schedules.join(', '));
                                                          }}
                                                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                          title="Editar datos del paciente"
                                                        >
                                                          <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                          onClick={() => handleReactivatePegPatient(item)}
                                                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all text-[10px] shadow-sm border-none cursor-pointer flex items-center gap-1"
                                                          title="Reactivar a este paciente para una nueva estadía"
                                                        >
                                                          <span>↩️</span>
                                                          <span>Reactivar</span>
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeletePegDelivery(item.id)}
                                                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                          title="Eliminar del historial"
                                                        >
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 p-4 text-center shrink-0">
              <button
                onClick={() => {
                  setShowPegModal(false);
                  setEditingPeg(null);
                  setShowPegHelp(false);
                  setNewPegForm({ paciente_cama: '', cantidad_entregada: 0, dosis_gramos_dia: 0, dosis_inicio_gramos: 0, fecha_entrega: new Date().toISOString().split('T')[0], fecha_inicio_uso: new Date().toISOString().split('T')[0], servicio: 'Lactantes' });
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer border-none"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FOOTER GENERAL --- */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 mt-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl 2xl:max-w-[96vw] mx-auto px-4 space-y-2">
          <p>© 2026 Hospital Regional de Antofagasta - Todos los derechos reservados.</p>
          <p>Pagina web creada e impulsada por Equipo de nutricionistas clinicos HRA para el control de bodega STOCK</p>
          <p className="font-black text-slate-500 uppercase tracking-widest">STOCK SEDILE 2026 • Control Institucional de Fórmulas y Suministros</p>
        </div>
      </footer>
    </div>
  );
}





