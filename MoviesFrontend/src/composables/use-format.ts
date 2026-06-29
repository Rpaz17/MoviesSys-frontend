export function useFormat() {
  function money(value: number) {
    return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(value);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const [y, m, d] = dateStr.split(/[-T]/);
      if (y && m && d) return `${d}/${m}/${y}`;
      return dateStr;
    }
    return new Intl.DateTimeFormat("es-HN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function imageUrl(id?: string) {
    if (id?.startsWith("data:") || id?.startsWith("http")) return id;
    return `https://images.unsplash.com/${id ?? "photo-1489599849927-2ee91cede3ba"}?auto=format&fit=crop&w=900&q=80`;
  }

  return { money, formatDate, imageUrl };
}
