import { z } from "zod";
import { apiClient } from "../lib/api-client";

// ── Zod schemas ────────────────────────────────────────────────────────────────

const salaDisponibilidadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  filas: z.number(),
  columnas: z.number(),
});

const disponibilidadSchema = z.object({
  total: z.number(),
  disponibles: z.number(),
  ocupados: z.number(),
  porcentaje_disponibilidad: z.number(),
});

export const funcionDisponibilidadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fecha_hora: z.string(),
  sala: salaDisponibilidadSchema,
  disponibilidad: disponibilidadSchema,
});
export type FuncionDisponibilidad = z.infer<typeof funcionDisponibilidadSchema>;

export const asientoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fila: z.number().optional(),
  columna: z.number().optional(),
  estado: z.string().optional(),
  id_asiento: z.union([z.string(), z.number()]).optional(),
  id_funcion: z.union([z.string(), z.number()]).optional(),
});
export type Asiento = z.infer<typeof asientoSchema>;

export const createFuncionInputSchema = z.object({
  id_pelicula: z.string(),
  id_sala: z.string(),
  fecha_hora: z.string(),
});
export type CreateFuncionInput = z.infer<typeof createFuncionInputSchema>;

export const updateFuncionInputSchema = z.object({
  id_pelicula: z.string().optional(),
  id_sala: z.string().optional(),
  fecha_hora: z.string().optional(),
});
export type UpdateFuncionInput = z.infer<typeof updateFuncionInputSchema>;

export const bloquearAsientoInputSchema = z.object({
  id_asiento: z.string(),
});
export type BloquearAsientoInput = z.infer<typeof bloquearAsientoInputSchema>;

export const bloqueoResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  id_asiento: z.string(),
  id_funcion: z.union([z.string(), z.number()]),
  estado: z.string(),
});

// ── Service ────────────────────────────────────────────────────────────────────

export const funcionesService = {
  async getFuncionesDisponibilidad(
    peliculaId: number | string,
    cineId: number | string,
  ): Promise<FuncionDisponibilidad[]> {
    const { data } = await apiClient.get(
      `/funciones/${peliculaId}/cines/${cineId}/funciones`,
    );
    return z.array(funcionDisponibilidadSchema).parse(data);
  },

  async getAsientos(funcionId: number | string): Promise<Asiento[]> {
    const { data } = await apiClient.get(`/funciones/${funcionId}/asientos`);
    return z.array(asientoSchema).parse(data);
  },

  async bloquearAsiento(
    funcionId: number | string,
    payload: BloquearAsientoInput,
  ): Promise<z.infer<typeof bloqueoResponseSchema>> {
    const { data } = await apiClient.post(
      `/funciones/${funcionId}/asientos/bloquear`,
      payload,
    );
    return bloqueoResponseSchema.parse(data);
  },

  async create(payload: CreateFuncionInput): Promise<{ id: number | string }> {
    const { data } = await apiClient.post("/funciones", payload);
    return z.object({ id: z.union([z.string(), z.number()]) }).parse(data);
  },

  async edit(
    id: number | string,
    payload: UpdateFuncionInput,
  ): Promise<{ id: number | string }> {
    const { data } = await apiClient.put(`/funciones/${id}`, payload);
    return z.object({ id: z.union([z.string(), z.number()]) }).parse(data);
  },

  async cancel(id: number | string): Promise<void> {
    await apiClient.patch(`/funciones/${id}/cancelar`);
  },
};
