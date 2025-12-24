import { DateOption } from "@/types/showtime";

export const generateDateOptions = (): DateOption[] => {
  const today = new Date();
  const options: DateOption[] = [];

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayOfWeek = i === 0 ? "Hôm nay" : dayNames[date.getDay()];
    const dayOfMonth = date.getDate().toString();
    const month = (date.getMonth() + 1).toString();
    const fullDate = formatLocalDate(date);

    options.push({
      date,
      dayOfWeek,
      dayOfMonth: `${dayOfMonth}/${month}`,
      fullDate,
    });
  }

  return options;
};

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}
