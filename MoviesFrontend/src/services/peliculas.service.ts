import { z } from "zod";
import { apiClient } from "../lib/api-client";

// ── Zod schemas ────────────────────────────────────────────────────────────────

const idiomaSchema = z.object({
  nombre: z.string(),
});

const generoSchema = z.object({
  nombre: z.string(),
});

export const peliculaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  titulo: z.string(),
  sinopsis: z.string(),
  poster_url: z.string(),
  fecha_estreno: z.string(),
  idiomas: idiomaSchema.nullable().optional(),
  generos: generoSchema.nullable().optional(),
  activo: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  updated_by: z.string().optional(),
});
export type Pelicula = z.infer<typeof peliculaSchema>;

export const createPeliculaInputSchema = z.object({
  titulo: z.string().min(1),
  sinopsis: z.string(),
  poster_url: z.string(),
  idioma: z.string().optional(),
  genero: z.string().optional(),
  fecha_estreno: z.string().optional(),
  uploaded_by: z.string(),
});
export type CreatePeliculaInput = z.infer<typeof createPeliculaInputSchema>;

export const updatePeliculaInputSchema = z.object({
  titulo: z.string().optional(),
  sinopsis: z.string().optional(),
  poster_url: z.string().optional(),
  fecha_estreno: z.string().optional(),
  id_idioma: z.number().optional(),
  id_genero: z.number().optional(),
  activo: z.boolean().optional(),
});
export type UpdatePeliculaInput = z.infer<typeof updatePeliculaInputSchema>;

export const uploadPosterInputSchema = z.object({
  posterUrl: z.string().url(),
});
export type UploadPosterInput = z.infer<typeof uploadPosterInputSchema>;

const cineEnFuncionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
});

const salaEnFuncionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  cines: cineEnFuncionSchema,
});

export const funcionCineSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fecha_hora: z.string(),
  estado: z.string(),
  salas: salaEnFuncionSchema,
  _count: z.object({
    asientosFuncions: z.number(),
  }),
});
export type FuncionCine = z.infer<typeof funcionCineSchema>;

// ── Service ────────────────────────────────────────────────────────────────────

export const peliculasService = {
  async search(titulo?: string): Promise<Pelicula[]> {
    const { data } = await apiClient.get<Pelicula[]>("/peliculas", {
      params: titulo ? { titulo } : undefined,
    });
    return z.array(peliculaSchema).parse(data);
  },

  async create(payload: CreatePeliculaInput): Promise<Pelicula> {
    const { data } = await apiClient.post("/peliculas", payload);
    return peliculaSchema.parse(data);
  },

  async update(id: number | string, payload: UpdatePeliculaInput): Promise<Pelicula> {
    const { data } = await apiClient.put(`/peliculas/${id}`, payload);
    return peliculaSchema.parse(data);
  },

  async uploadPoster(id: number | string, payload: UploadPosterInput): Promise<void> {
    await apiClient.post(`/peliculas/${id}/poster`, payload);
  },

  async getFunciones(id: number | string, cineId: number | string): Promise<FuncionCine[]> {
    const { data } = await apiClient.get(`/peliculas/${id}/cines/${cineId}/funciones`);
    return z.array(funcionCineSchema).parse(data);
  },
};
