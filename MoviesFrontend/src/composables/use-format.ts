export function useFormat() {
  const UTC_MINUS_6 = -6 * 60;

  function toUTC(date: string, time: string): string {
    const [h, m] = time.split(":").map(Number);
    const utc = new Date(Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      h - UTC_MINUS_6 / 60,
      m,
    ));
    return utc.toISOString();
  }

  function fromUTC(isoString: string): { date: string; time: string } {
    const dt = new Date(isoString);
    if (isNaN(dt.getTime())) {
      const d = isoString.split("T")[0] ?? isoString;
      const t = (isoString.split("T")[1] ?? "").slice(0, 5);
      return { date: d, time: t };
    }
    const local = new Date(dt.getTime() + UTC_MINUS_6 * 60000);
    const date = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
    const time = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
    return { date, time };
  }

  function money(value: number) {
    return new Intl.NumberFormat("es-HN", { style: "currency", currency: "USD" }).format(value);
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

  return { toUTC, fromUTC, money, formatDate, imageUrl };
}
