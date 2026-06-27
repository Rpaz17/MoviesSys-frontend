// ─── Field validators ─────────────────────────────────────────────────────────
export const vName = (v: string) =>
  !v
    ? "El nombre es obligatorio."
    : v.trim().length < 2
      ? "Minimo 2 caracteres."
      : v.trim().length > 60
        ? "Maximo 60 caracteres."
        : "";

export const vEmail = (v: string) =>
  !v
    ? "El correo es obligatorio."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Ingresa un correo valido."
      : "";

export const vPass = (v: string) =>
  !v
    ? "La contrasena es obligatoria."
    : v.length < 8
      ? "Minimo 8 caracteres."
      : !/[A-Z]/.test(v)
        ? "Debe contener al menos una mayuscula."
        : !/[0-9]/.test(v)
          ? "Debe contener al menos un numero."
          : "";

export const vPassLogin = (v: string) => {
  if (!v) return "La contrasena es obligatoria.";
  return "";
};

export const vConfirm = (p: string, c: string) =>
  !c
    ? "Confirma tu contrasena."
    : p !== c
      ? "Las contrasenas no coinciden."
      : "";

export const vPhone = (v: string) =>
  !v
    ? ""
    : !/^[+]?[\d\s\-().]{7,20}$/.test(v)
      ? "Numero de telefono invalido."
      : "";

// ─── Password strength ────────────────────────────────────────────────────────
export function strength(v: string) {
  if (!v) return { score: 0, label: "", color: "" };
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  if (s <= 1) return { score: 1, label: "Muy debil", color: "#c8102e" };
  if (s === 2) return { score: 2, label: "Debil", color: "#e05a1a" };
  if (s === 3) return { score: 3, label: "Regular", color: "#c8a96e" };
  if (s === 4) return { score: 4, label: "Fuerte", color: "#4caf7d" };
  return { score: 5, label: "Muy fuerte", color: "#2e9e5b" };
}
