export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          porcentaje: number;
          tiene_tope: boolean;
          monto_tope_maximo: number | null;
          categoria_rebose_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          porcentaje: number;
          tiene_tope?: boolean;
          monto_tope_maximo?: number | null;
          categoria_rebose_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          porcentaje?: number;
          tiene_tope?: boolean;
          monto_tope_maximo?: number | null;
          categoria_rebose_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categorias_rebose_fk";
            columns: ["categoria_rebose_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          }
        ];
      };
      ingresos: {
        Row: {
          id: string;
          user_id: string;
          monto_total: number;
          tipo: "fijo" | "variable";
          descripcion: string | null;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monto_total: number;
          tipo?: "fijo" | "variable";
          descripcion?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monto_total?: number;
          tipo?: "fijo" | "variable";
          descripcion?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      distribuciones: {
        Row: {
          id: string;
          ingreso_id: string;
          categoria_id: string;
          monto_asignado: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          ingreso_id: string;
          categoria_id: string;
          monto_asignado: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          ingreso_id?: string;
          categoria_id?: string;
          monto_asignado?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "distribuciones_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "distribuciones_ingreso_id_fkey";
            columns: ["ingreso_id"];
            isOneToOne: false;
            referencedRelation: "ingresos";
            referencedColumns: ["id"];
          }
        ];
      };
      movimientos: {
        Row: {
          id: string;
          user_id: string;
          categoria_id: string | null;
          tipo: "gasto" | "ahorro" | "inversion" | "transferencia";
          monto: number;
          descripcion: string | null;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          categoria_id?: string | null;
          tipo: "gasto" | "ahorro" | "inversion" | "transferencia";
          monto: number;
          descripcion?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          categoria_id?: string | null;
          tipo?: "gasto" | "ahorro" | "inversion" | "transferencia";
          monto?: number;
          descripcion?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "movimientos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Categoria = Database["public"]["Tables"]["categorias"]["Row"];
export type CategoriaInsert = Database["public"]["Tables"]["categorias"]["Insert"];
export type CategoriaUpdate = Database["public"]["Tables"]["categorias"]["Update"];

export type Ingreso = Database["public"]["Tables"]["ingresos"]["Row"];
export type IngresoInsert = Database["public"]["Tables"]["ingresos"]["Insert"];

export type Distribucion = Database["public"]["Tables"]["distribuciones"]["Row"];
export type DistribucionInsert = Database["public"]["Tables"]["distribuciones"]["Insert"];

export type Movimiento = Database["public"]["Tables"]["movimientos"]["Row"];
export type MovimientoInsert = Database["public"]["Tables"]["movimientos"]["Insert"];
