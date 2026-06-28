import { z } from "zod";
import { apiClient } from "../lib/api-client";

export const reporteReservaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  numero_reserva: z.string(),
  estado: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  total_asientos: z.number(),
  usuario: z.object({
    id: z.union([z.string(), z.number()]),
    nombre: z.string(),
    email: z.string(),
  }),
  funcion: z.object({
    id: z.union([z.string(), z.number()]),
    fecha_hora: z.string(),
    estado: z.string(),
    pelicula: z.object({
      id: z.union([z.string(), z.number()]),
      titulo: z.string(),
    }),
    sala: z.object({
      id: z.union([z.string(), z.number()]),
      nombre: z.string(),
      cine: z.object({
        id: z.union([z.string(), z.number()]),
        nombre: z.string(),
      }),
    }),
  }),
});
export type ReporteReserva = z.infer<typeof reporteReservaSchema>;

export const reporteReservasResponseSchema = z.object({
  total: z.number(),
  pagina: z.number(),
  limite: z.number(),
  total_paginas: z.number(),
  data: z.array(reporteReservaSchema),
});
export type ReporteReservasResponse = z.infer<
  typeof reporteReservasResponseSchema
>;

export interface ReporteReservasFilters {
  id_pelicula?: number;
  id_cine?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  pagina?: number;
  limite?: number;
}

export const reportesService = {
  async getReservas(
    filters: ReporteReservasFilters = {},
  ): Promise<ReporteReservasResponse> {
    const { data } = await apiClient.get("/admin/reportes/reservas", {
      params: filters,
    });
    return reporteReservasResponseSchema.parse(data);
  },
};
