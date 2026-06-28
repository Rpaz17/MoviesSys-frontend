import { z } from "zod";
import { apiClient } from "../lib/api-client";

export const asientoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fila: z.string(),
  columna: z.number(),
  codigo: z.string().optional(),
  id_sala: z.union([z.string(), z.number()]).optional(),
});
export type Asiento = z.infer<typeof asientoSchema>;

export const salaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  filas: z.number(),
  columnas: z.number(),
  id_cine: z.union([z.string(), z.number()]),
  asientos_generados: z.number().optional(),
  asientos: z.array(asientoSchema).optional(),
  funciones_activas: z.number().optional(),
  advertencia: z.string().optional(),
});
export type Sala = z.infer<typeof salaSchema>;

export const createSalaInputSchema = z.object({
  nombre: z.string().min(2).max(50),
  filas: z.number().int().min(1).max(26),
  columnas: z.number().int().min(1).max(30),
});
export type CreateSalaInput = z.infer<typeof createSalaInputSchema>;

export const updateSalaInputSchema = z.object({
  nombre: z.string().min(2).max(50).optional(),
});
export type UpdateSalaInput = z.infer<typeof updateSalaInputSchema>;

export const salasService = {
  async getAll(): Promise<Sala[]> {
    const { data } = await apiClient.get<Sala[]>("/cines/salas");
    return z.array(salaSchema).parse(data);
  },

  async getById(id: number | string): Promise<Sala> {
    const { data } = await apiClient.get<Sala>(`/cines/salas/${id}`);
    return salaSchema.parse(data);
  },

  async create(cineId: number | string, payload: CreateSalaInput): Promise<Sala> {
    const { data } = await apiClient.post<Sala>(`/cines/${cineId}/salas`, payload);
    return salaSchema.parse(data);
  },

  async update(id: number | string, payload: UpdateSalaInput): Promise<Sala> {
    const { data } = await apiClient.put<Sala>(`/cines/salas/${id}`, payload);
    return salaSchema.parse(data);
  },
};
