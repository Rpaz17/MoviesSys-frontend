import { z } from "zod";
import { apiClient } from "../lib/api-client";

export const ciudadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
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

  async create(payload: CreateCiudadInput): Promise<Ciudad> {
    const { data } = await apiClient.post("/ciudades", payload);
    return ciudadSchema.parse(data);
  },

  async update(
    id: number | string,
    payload: UpdateCiudadInput,
  ): Promise<Ciudad> {
    const { data } = await apiClient.patch(`/ciudades/${id}`, payload);
    return ciudadSchema.parse(data);
  },
};