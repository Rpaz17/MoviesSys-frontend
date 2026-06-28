import { z } from "zod";
import { apiClient } from "../lib/api-client";

export const pagoHistorialSchema = z.object({
  id: z.string(),
  monto_original: z.string(),
  monto_descuento: z.string(),
  monto_final: z.string(),
  metodo: z.string(),
  estado: z.string(),
  referencia_externa: z.string().nullable(),
  created_at: z.string(),
  reserva: z.object({
    id: z.string(),
    numero_reserva: z.string(),
    usuario: z.object({
      id: z.string(),
      nombre: z.string(),
      email: z.string(),
    }),
  }),
  reembolso: z
    .object({
      id: z.string(),
      monto: z.string(),
      estado: z.string(),
      fecha_procesado: z.string().nullable(),
    })
    .nullable(),
});
export type PagoHistorial = z.infer<typeof pagoHistorialSchema>;

export const historialResponseSchema = z.object({
  total: z.number(),
  pagina: z.number(),
  limite: z.number(),
  total_paginas: z.number(),
  data: z.array(pagoHistorialSchema),
});
export type HistorialResponse = z.infer<typeof historialResponseSchema>;

export interface HistorialFilters {
  estado?: string;
  metodo?: string;
  cliente?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  pagina?: number;
  limite?: number;
}

export const pagosService = {
  async getHistorial(filters: HistorialFilters = {}): Promise<HistorialResponse> {
    const { data } = await apiClient.get("/pagos/historial", {
      params: filters,
    });
    return historialResponseSchema.parse(data);
  },
};