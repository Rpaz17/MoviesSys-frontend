import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "../stores/session";
import AuthView from "../views/AuthView.vue";
import HomeView from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import AdminCatalogView from "../views/AdminCatalogView.vue";
import ReservationsView from "../views/ReservationsView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/reservas/funciones" },
    { path: "/login", name: "login", component: AuthView, meta: { guest: true, mode: "login" } },
    { path: "/register", name: "register", component: AuthView, meta: { guest: true, mode: "register" } },
    { path: "/forgot", name: "forgot", component: AuthView, meta: { guest: true, mode: "forgot" } },
    { path: "/reset", name: "reset", component: AuthView, meta: { guest: true, mode: "reset" } },
    { path: "/home", name: "home", component: HomeView, meta: { auth: true } },
    { path: "/profile", name: "profile", component: ProfileView, meta: { auth: true, mode: "profile" } },
    { path: "/change-password", name: "change-password", component: ProfileView, meta: { auth: true, mode: "password" } },
    { path: "/reservas/funciones", name: "available-functions", component: ReservationsView, meta: { mode: "functions" } },
    { path: "/reservas/mis-reservas", name: "my-reservations", component: ReservationsView, meta: { auth: true, role: "cliente", mode: "mine" } },
    { path: "/admin/clientes", name: "admin-customers", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "customers" } },
    { path: "/admin/peliculas", name: "admin-movies", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "movies" } },
    { path: "/admin/peliculas/crear", name: "admin-create-movie", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "createMovie" } },
    { path: "/admin/peliculas/editar", name: "admin-edit-movie", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "editMovie" } },
    { path: "/admin/cines", name: "admin-cinemas", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "cinemas" } },
    { path: "/admin/cines/crear", name: "admin-create-cinema", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "createCinema" } },
    { path: "/admin/salas", name: "admin-rooms", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "rooms" } },
    { path: "/admin/salas/crear", name: "admin-create-room", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "createRoom" } },
    { path: "/admin/ciudades", name: "admin-cities", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "cities" } },
    { path: "/admin/funciones", name: "admin-showtimes", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "showtimes" } },
    { path: "/admin/reportes", name: "admin-reports", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "reports" } },
    { path: "/admin/cupones", name: "admin-coupons", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "coupons" } },
    { path: "/admin/cancelaciones", name: "admin-cancellations", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "cancellations" } },
  ],
});

router.beforeEach((to) => {
  const session = useSessionStore();
  if (to.meta.auth && !session.user) return "/login";
  if (to.meta.guest && session.user) return "/home";
  if (to.meta.role && session.user?.role !== to.meta.role) return "/home";
  return true;
});
