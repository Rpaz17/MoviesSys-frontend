import { z } from "zod";
import { apiClient } from "../lib/api-client";

export const ciudadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  activo: z.boolean().optional(),
});
export type Ciudad = z.infer<typeof ciudadSchema>;

export const createCiudadInputSchema = z.object({
  nombre: z.string().min(1),
});
export type CreateCiudadInput = z.infer<typeof createCiudadInputSchema>;

export const updateCiudadInputSchema = z.object({
  nombre: z.string().min(1),
});
export type UpdateCiudadInput = z.infer<typeof updateCiudadInputSchema>;

export const ciudadesService = {
  async getAll(): Promise<Ciudad[]> {
    const { data } = await apiClient.get<Ciudad[]>("/ciudades");
    return z.array(ciudadSchema).parse(data);
  },

  async createCiudad(payload: CreateCiudadInput): Promise<Ciudad> {
    const { data } = await apiClient.post("/ciudades", payload);
    return ciudadSchema.parse(data);
  },

  async updateCiudad(
    id: number | string,
    payload: UpdateCiudadInput,
  ): Promise<Ciudad> {
    const { data } = await apiClient.patch(`/ciudades/${id}`, payload);
    return ciudadSchema.parse(data);
  },

  async deleteCiudad(id: number | string): Promise<void> {
    await apiClient.delete(`/ciudades/${id}`);
  },

  async reactivarCiudad(id: number | string): Promise<void> {
    await apiClient.patch(`/ciudades/${id}/reactivar`);
  },
};
