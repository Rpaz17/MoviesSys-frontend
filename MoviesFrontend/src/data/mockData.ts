import type { SessionUser, Customer, CatalogMovie, MovieForm, MovieStatus, Cinema, Room, AdminStatus, Showtime } from "../types";

// ─── Auth users ───────────────────────────────────────────────────────────────
export const MOCK_USERS: (SessionUser & { password: string })[] = [
  { email: "valeria@moviesys.com", password: "Cinema2024", name: "Valeria Montoya", avatar: "VM", role: "cliente" },
  { email: "carlos@moviesys.com",  password: "Cine1234A",  name: "Carlos Herrera",  avatar: "CH", role: "administrador" },
  { email: "recepcion@moviesys.com", password: "Caja2024A", name: "Recepcion Caja", avatar: "RC", role: "recepcionista" },
];

// ─── Carousel films (guest left panel) ───────────────────────────────────────
export const CAROUSEL_FILMS = [
  { title: "Dune: Parte Dos",  genre: "Ciencia ficcion · 2h 46m", rating: "9.1", tag: "IMAX",    tagColor: "#1a6ef5", img: "photo-1589903308904-1010c2294adc" },
  { title: "Pobres Criaturas", genre: "Drama · Comedia · 2h 21m", rating: "8.6", tag: "ESTRENO", tagColor: "#c8102e", img: "photo-1512070679279-8988d32161be" },
  { title: "Oppenheimer",      genre: "Drama · Historia · 3h",     rating: "8.9", tag: "OSCAR",   tagColor: "#b8872a", img: "photo-1536440136628-849c177e76a1" },
];

// ─── Customers ────────────────────────────────────────────────────────────────
export const CUSTOMERS_DATA: Customer[] = [
  { id: "C001", name: "Valeria Montoya",  email: "valeria@moviesys.com",   phone: "+57 310 555 0192", status: "activo",     registeredAt: "2023-03-12", reservations: 17, spent: "$124.50", avatar: "VM" },
  { id: "C002", name: "Carlos Herrera",   email: "carlos@moviesys.com",    phone: "+57 315 822 4401", status: "activo",     registeredAt: "2023-07-05", reservations: 9,  spent: "$67.20",  avatar: "CH" },
  { id: "C003", name: "Isabella Torres",  email: "isa.torres@gmail.com",    phone: "+57 300 114 7733", status: "activo",     registeredAt: "2024-01-20", reservations: 4,  spent: "$31.00",  avatar: "IT" },
  { id: "C004", name: "Andres Rios",      email: "andres.rios@outlook.com", phone: "+57 321 988 6610", status: "inactivo",   registeredAt: "2022-11-08", reservations: 2,  spent: "$14.00",  avatar: "AR" },
  { id: "C005", name: "Mariana Salcedo",  email: "msalcedo@yahoo.com",      phone: "+57 316 203 9944", status: "activo",     registeredAt: "2024-02-14", reservations: 6,  spent: "$48.75",  avatar: "MS" },
  { id: "C006", name: "Felipe Guerrero",  email: "fguerrero@proton.me",     phone: "+57 302 771 5520", status: "suspendido", registeredAt: "2023-05-30", reservations: 11, spent: "$89.00",  avatar: "FG" },
  { id: "C007", name: "Laura Castillo",   email: "laura.c@gmail.com",       phone: "+57 311 430 8812", status: "activo",     registeredAt: "2023-09-17", reservations: 22, spent: "$178.40", avatar: "LC" },
  { id: "C008", name: "Daniel Moreno",    email: "dmoreno@empresa.co",      phone: "+57 320 665 3391", status: "activo",     registeredAt: "2024-03-01", reservations: 3,  spent: "$22.50",  avatar: "DM" },
  { id: "C009", name: "Sofia Prada",      email: "sofia.prada@gmail.com",   phone: "+57 313 887 0045", status: "inactivo",   registeredAt: "2022-08-22", reservations: 0,  spent: "$0.00",   avatar: "SP" },
  { id: "C010", name: "Juan Velasquez",   email: "jvelasquez@hotmail.com",  phone: "+57 318 556 2230", status: "activo",     registeredAt: "2023-12-09", reservations: 8,  spent: "$61.00",  avatar: "JV" },
  { id: "C011", name: "Camila Restrepo",  email: "camila.r@moviesys.com",   phone: "+57 317 224 6618", status: "activo",     registeredAt: "2024-04-03", reservations: 5,  spent: "$39.00",  avatar: "CR" },
  { id: "C012", name: "Miguel Ospina",    email: "mospina@gmail.com",       phone: "+57 304 993 1127", status: "suspendido", registeredAt: "2023-01-15", reservations: 7,  spent: "$55.25",  avatar: "MO" },
];

// ─── Catalog movies ───────────────────────────────────────────────────────────
export const CATALOG_MOVIES: CatalogMovie[] = [
  { id: "M001", title: "Dune: Parte Dos",         genre: "Ciencia ficcion", language: "Ingles",   rating: "PG-13", duration: "166 min", releaseDate: "2024-03-01", director: "Denis Villeneuve",  status: "en-cartelera", reservations: 842,  revenue: "$6.240",  img: "photo-1446776877081-d282a0f896e2" },
  { id: "M002", title: "Oppenheimer",              genre: "Drama",           language: "Ingles",   rating: "R",     duration: "180 min", releaseDate: "2023-07-21", director: "Christopher Nolan", status: "en-cartelera", reservations: 1204, revenue: "$9.120",  img: "photo-1536440136628-849c177e76a1" },
  { id: "M003", title: "Pobres Criaturas",         genre: "Comedia",         language: "Ingles",   rating: "R",     duration: "141 min", releaseDate: "2024-01-12", director: "Yorgos Lanthimos",  status: "en-cartelera", reservations: 391,  revenue: "$2.890",  img: "photo-1485846234645-a62644f84728" },
  { id: "M004", title: "Kung Fu Panda 4",          genre: "Animacion",       language: "Espanol",  rating: "PG",    duration: "94 min",  releaseDate: "2024-03-08", director: "Mike Mitchell",     status: "proximamente", reservations: 0,    revenue: "$0",      img: "photo-1518676590629-3dcbd9c5a5c9" },
  { id: "M005", title: "La Quimera",               genre: "Drama",           language: "Italiano", rating: "PG-13", duration: "131 min", releaseDate: "2024-03-28", director: "Alice Rohrwacher",  status: "proximamente", reservations: 0,    revenue: "$0",      img: "photo-1524985069026-dd778a71c7b4" },
  { id: "M006", title: "Furiosa",                  genre: "Accion",          language: "Ingles",   rating: "R",     duration: "148 min", releaseDate: "2024-05-24", director: "George Miller",     status: "inactivo",     reservations: 214,  revenue: "$1.580",  img: "photo-1489599849927-2ee91cede3ba" },
  { id: "M007", title: "Inside Out 2",             genre: "Animacion",       language: "Espanol",  rating: "PG",    duration: "100 min", releaseDate: "2024-06-14", director: "Kelsey Mann",       status: "en-cartelera", reservations: 1567, revenue: "$11.940", img: "photo-1507003211169-0a1dd7228f2d" },
  { id: "M008", title: "Bitelchus Bitelchus",      genre: "Comedia",         language: "Ingles",   rating: "PG-13", duration: "104 min", releaseDate: "2024-09-06", director: "Tim Burton",        status: "inactivo",     reservations: 89,   revenue: "$640",    img: "photo-1561132235-59695a79c98b" },
  { id: "M009", title: "Alien: Romulus",           genre: "Horror",          language: "Ingles",   rating: "R",     duration: "119 min", releaseDate: "2024-08-16", director: "Fede Alvarez",      status: "proximamente", reservations: 0,    revenue: "$0",      img: "photo-1594909122845-11baa439b7bf" },
  { id: "M010", title: "El Especialista",          genre: "Accion",          language: "Ingles",   rating: "PG-13", duration: "126 min", releaseDate: "2024-07-26", director: "David Leitch",      status: "en-cartelera", reservations: 723,  revenue: "$5.420",  img: "photo-1578662996442-48f60103fc96" },
  { id: "M011", title: "Deadpool & Wolverine",     genre: "Accion",          language: "Ingles",   rating: "R",     duration: "127 min", releaseDate: "2024-07-26", director: "Shawn Levy",        status: "en-cartelera", reservations: 2031, revenue: "$15.640", img: "photo-1512070679279-8988d32161be" },
  { id: "M012", title: "El Planeta de los Simios", genre: "Ciencia ficcion", language: "Ingles",   rating: "PG-13", duration: "145 min", releaseDate: "2024-05-10", director: "Wes Ball",          status: "inactivo",     reservations: 304,  revenue: "$2.280",  img: "photo-1507003211169-0a1dd7228f2d" },
];

export const STATUS_CFG: Record<MovieStatus, { label: string; color: string; bg: string; border: string }> = {
  "en-cartelera": { label: "En cartelera", color: "#4caf7d", bg: "rgba(76,175,125,0.12)",  border: "rgba(76,175,125,0.3)" },
  "proximamente": { label: "Proximamente", color: "#c8a96e", bg: "rgba(200,169,110,0.12)", border: "rgba(200,169,110,0.3)" },
  "inactivo":     { label: "Inactivo",     color: "#7a7590", bg: "rgba(122,117,144,0.12)", border: "rgba(122,117,144,0.25)" },
};

// ─── Movie form defaults ──────────────────────────────────────────────────────
export const EMPTY_MOVIE_FORM: MovieForm = {
  title: "", originalTitle: "", synopsis: "", genres: [], language: "",
  subtitles: "", rating: "", duration: "", releaseDate: "",
  director: "", cast: "", trailer: "", status: "sin-publicar", imageUrl: "",
  roomIds: [],
};

export const POSTER_SAMPLES = [
  { label: "Sci-Fi",    url: "photo-1446776877081-d282a0f896e2" },
  { label: "Drama",     url: "photo-1536440136628-849c177e76a1" },
  { label: "Accion",    url: "photo-1489599849927-2ee91cede3ba" },
  { label: "Romance",   url: "photo-1507003211169-0a1dd7228f2d" },
  { label: "Animacion", url: "photo-1518676590629-3dcbd9c5a5c9" },
  { label: "Horror",    url: "photo-1561132235-59695a79c98b" },
];

// ─── Cinema ───────────────────────────────────────────────────────────────────
export const CITIES = [
  "San Pedro Sula", "Tegucigalpa", "Choloma", "La Ceiba", "Comayagua",
];

export const CINEMA_EMPTY = { name: "", address: "", city: "" };

export const ADMIN_STATUS_CFG: Record<AdminStatus, { label: string; color: string; bg: string; border: string }> = {
  activo:          { label: "Activo",          color: "#4caf7d", bg: "rgba(76,175,125,0.12)",  border: "rgba(76,175,125,0.3)" },
  mantenimiento:   { label: "Mantenimiento",   color: "#c8a96e", bg: "rgba(200,169,110,0.12)", border: "rgba(200,169,110,0.3)" },
  inactivo:        { label: "Inactivo",        color: "#7a7590", bg: "rgba(122,117,144,0.12)", border: "rgba(122,117,144,0.25)" },
};

export const CINEMAS_DATA: Cinema[] = [
  { id: "CI001", name: "MovieSys Galerias",      city: "San Pedro Sula", address: "Mall Galerias, segundo nivel",      status: "activo",        rooms: 8, functions: 54, revenue: "$18.420", img: "photo-1489599849927-2ee91cede3ba" },
  { id: "CI002", name: "MovieSys Multiplaza",    city: "Tegucigalpa",    address: "Boulevard Juan Pablo II",           status: "activo",        rooms: 10, functions: 68, revenue: "$22.780", img: "photo-1517604931442-7e0c8ed2963c" },
  { id: "CI003", name: "MovieSys Plaza Norte",   city: "Choloma",        address: "Centro comercial Plaza Norte",      status: "mantenimiento", rooms: 5, functions: 18, revenue: "$6.940",  img: "photo-1505686994434-e3cc5abf1330" },
  { id: "CI004", name: "MovieSys Atlantida",     city: "La Ceiba",       address: "Avenida San Isidro",                status: "activo",        rooms: 6, functions: 36, revenue: "$10.260", img: "photo-1478720568477-152d9b164e26" },
  { id: "CI005", name: "MovieSys Colonial",      city: "Comayagua",      address: "Casco historico, plaza central",    status: "inactivo",      rooms: 4, functions: 0,  revenue: "$0",      img: "photo-1524985069026-dd778a71c7b4" },
  { id: "CI006", name: "MovieSys City Center",   city: "San Pedro Sula", address: "Boulevard del Norte",               status: "activo",        rooms: 7, functions: 42, revenue: "$13.880", img: "photo-1536440136628-849c177e76a1" },
];

export const ROOMS_DATA: Room[] = [
  { id: "S001", name: "Sala 1",        cinemaId: "CI001", cinema: "MovieSys Galerias",    type: "2D",   rows: 8,  cols: 12, status: "activo",        functions: 0, occupancy: 72 },
  { id: "S002", name: "Sala VIP",      cinemaId: "CI001", cinema: "MovieSys Galerias",    type: "VIP",  rows: 6,  cols: 10, status: "activo",        functions: 0, occupancy: 64 },
  { id: "S003", name: "IMAX Norte",    cinemaId: "CI002", cinema: "MovieSys Multiplaza",  type: "IMAX", rows: 14, cols: 24, status: "activo",        functions: 0, occupancy: 88 },
  { id: "S004", name: "Sala 3D",       cinemaId: "CI002", cinema: "MovieSys Multiplaza",  type: "3D",   rows: 10, cols: 16, status: "mantenimiento", functions: 0, occupancy: 19 },
  { id: "S005", name: "Sala Colonial", cinemaId: "CI005", cinema: "MovieSys Colonial",    type: "2D",   rows: 7,  cols: 10, status: "inactivo",      functions: 0, occupancy: 0 },
  { id: "S006", name: "Sala Atlantida",cinemaId: "CI004", cinema: "MovieSys Atlantida",   type: "2D",   rows: 9,  cols: 12, status: "activo",        functions: 0, occupancy: 58 },
  { id: "S007", name: "Sala Premium",  cinemaId: "CI006", cinema: "MovieSys City Center", type: "VIP",  rows: 8,  cols: 11, status: "activo",        functions: 0, occupancy: 75 },
  { id: "S008", name: "Sala Familiar", cinemaId: "CI003", cinema: "MovieSys Plaza Norte", type: "2D",   rows: 6,  cols: 12, status: "mantenimiento", functions: 0, occupancy: 32 },
];

export const SHOWTIMES_DATA: Showtime[] = [
  { id: "F001", movieId: "M001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", format: "2D",   status: "activo",        reservations: 69,  revenue: "$520" },
  { id: "F002", movieId: "M002", cinemaId: "CI001", roomId: "S002", date: "2026-06-16", time: "17:45", format: "VIP",  status: "activo",        reservations: 38,  revenue: "$610" },
  { id: "F003", movieId: "M011", cinemaId: "CI002", roomId: "S003", date: "2026-06-16", time: "19:00", format: "IMAX", status: "activo",        reservations: 294, revenue: "$2.940" },
  { id: "F004", movieId: "M007", cinemaId: "CI002", roomId: "S004", date: "2026-06-17", time: "15:15", format: "3D",   status: "mantenimiento", reservations: 31,  revenue: "$280" },
  { id: "F005", movieId: "M010", cinemaId: "CI004", roomId: "S006", date: "2026-06-17", time: "20:30", format: "2D",   status: "activo",        reservations: 63,  revenue: "$480" },
  { id: "F006", movieId: "M003", cinemaId: "CI006", roomId: "S007", date: "2026-06-18", time: "18:20", format: "VIP",  status: "activo",        reservations: 66,  revenue: "$990" },
  { id: "F007", movieId: "M004", cinemaId: "CI003", roomId: "S008", date: "2026-06-18", time: "13:00", format: "2D",   status: "mantenimiento", reservations: 23,  revenue: "$160" },
  { id: "F008", movieId: "M001", cinemaId: "CI001", roomId: "S001", date: "2026-06-18", time: "21:15", format: "2D",   status: "activo",        reservations: 74,  revenue: "$560" },
  { id: "F009", movieId: "M002", cinemaId: "CI002", roomId: "S003", date: "2026-06-19", time: "21:45", format: "IMAX", status: "activo",        reservations: 306, revenue: "$3.060" },
  { id: "F010", movieId: "M005", cinemaId: "CI005", roomId: "S005", date: "2026-06-19", time: "16:00", format: "2D",   status: "inactivo",      reservations: 0,   revenue: "$0" },
];
