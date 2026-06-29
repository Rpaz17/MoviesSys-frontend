import { z } from "zod";
import { apiClient } from "../lib/api-client";

// ── Zod schemas ────────────────────────────────────────────────────────────────

export const peliculaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  titulo: z.string(),
  sinopsis: z.string().nullable().optional(),
  poster_url: z.string().nullable(),
  id_idioma: z.union([z.string(), z.number()]).nullable().optional(),
  id_genero: z.union([z.string(), z.number()]).nullable().optional(),
  fecha_estreno: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  id_usuario: z.union([z.string(), z.number()]).optional(),
});
export type Pelicula = z.infer<typeof peliculaSchema>;

export const idiomaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  activo: z.boolean().optional(),
});
export type Idioma = z.infer<typeof idiomaSchema>;

export const generoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  activo: z.boolean().optional(),
});
export type Genero = z.infer<typeof generoSchema>;

export const createPeliculaInputSchema = z.object({
  titulo: z.string().min(1).max(200),
  sinopsis: z.string(),
  poster_url: z.string(),
  idioma: z.string().optional(),
  genero: z.string().optional(),
  fecha_estreno: z.string().optional(),
  uploaded_by: z.string(),
});
export type CreatePeliculaInput = z.infer<typeof createPeliculaInputSchema>;

export const updatePeliculaInputSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  sinopsis: z.string().optional(),
  poster_url: z.string().optional(),
  fecha_estreno: z.string().optional(),
  id_idioma: z.number().optional(),
  id_genero: z.number().optional(),
  activo: z.boolean().optional(),
});
export type UpdatePeliculaInput = z.infer<typeof updatePeliculaInputSchema>;

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

  async getIdiomas(): Promise<Idioma[]> {
    const { data } = await apiClient.get<Idioma[]>("/idiomas");
    return z.array(idiomaSchema).parse(data);
  },

  async getGeneros(): Promise<Genero[]> {
    const { data } = await apiClient.get<Genero[]>("/generos");
    return z.array(generoSchema).parse(data);
  },

  async create(payload: CreatePeliculaInput): Promise<Pelicula> {
    const { data } = await apiClient.post("/peliculas", payload);
    return peliculaSchema.parse(data);
  },

  async update(
    id: number | string,
    payload: UpdatePeliculaInput,
  ): Promise<Pelicula> {
    const { data } = await apiClient.put(`/peliculas/${id}`, payload);
    return peliculaSchema.parse(data);
  },

  async getFunciones(
    id: number | string,
    cineId: number | string,
  ): Promise<FuncionCine[]> {
    const { data } = await apiClient.get(
      `/peliculas/${id}/cines/${cineId}/funciones`,
    );
    return z.array(funcionCineSchema).parse(data);
  },
};
