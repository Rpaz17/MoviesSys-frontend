export function useFormat() {
  function money(value: number) {
    return new Intl.NumberFormat("es-HN", { style: "currency", currency: "USD" }).format(value);
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function imageUrl(id?: string) {
    if (id?.startsWith("data:") || id?.startsWith("http")) return id;
    return `https://images.unsplash.com/${id ?? "photo-1489599849927-2ee91cede3ba"}?auto=format&fit=crop&w=900&q=80`;
  }

  return { money, formatDate, imageUrl };
}
