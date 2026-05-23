export function formatCountdown(targetDate: Date): string {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return "Started";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${String(days).padStart(2, "0")}d : ${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m`;
}

export function formatContestDate(date: Date): { month: string; day: string } {
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  return { month, day };
}

export function formatAnnouncementDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
