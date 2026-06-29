import { z } from "zod";
import { apiClient } from "../lib/api-client";

const cineSalaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  filas: z.number().optional(),
  columnas: z.number().optional(),
});

export const cineSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  direccion: z.string().optional().default(""),
  id_ciudad: z.union([z.string(), z.number()]).optional(),
  activo: z.boolean().optional(),
  created_at: z.string().optional(),
  salas: z.array(cineSalaSchema).optional(),
});
export type Cine = z.infer<typeof cineSchema>;

export const createCineInputSchema = z.object({
  nombre: z.string().min(1),
  direccion: z.string().optional(),
  id_ciudad: z.number(),
});
export type CreateCineInput = z.infer<typeof createCineInputSchema>;

export const updateCineInputSchema = z.object({
  nombre: z.string().min(1).optional(),
  direccion: z.string().optional(),
  id_ciudad: z.number().optional(),
});
export type UpdateCineInput = z.infer<typeof updateCineInputSchema>;

export const cinesService = {
  async getAll(): Promise<Cine[]> {
    const { data } = await apiClient.get<Cine[]>("/cines");
    return z.array(cineSchema).parse(data);
  },

  async getById(id: number | string): Promise<Cine> {
    const { data } = await apiClient.get<Cine>(`/cines/${id}`);
    return cineSchema.parse(data);
  },

  async create(payload: CreateCineInput): Promise<Cine> {
    const { data } = await apiClient.post("/cines", payload);
    return cineSchema.parse(data);
  },

  async update(id: number | string, payload: UpdateCineInput): Promise<Cine> {
    const { data } = await apiClient.put(`/cines/${id}`, payload);
    return cineSchema.parse(data);
  },

  async delete(id: number | string): Promise<void> {
    await apiClient.delete(`/cines/${id}`);
  },

  async reactivar(id: number | string): Promise<void> {
    await apiClient.patch(`/cines/${id}/reactivar`);
  },
};
