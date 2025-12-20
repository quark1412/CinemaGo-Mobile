import { DateOption } from "@/types/showtime";

export const generateDateOptions = (): DateOption[] => {
  const today = new Date();
  const options: DateOption[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayOfWeek = i === 0 ? "Hôm nay" : dayNames[date.getDay()];
    const dayOfMonth = date.getDate().toString();
    const month = (date.getMonth() + 1).toString();
    const fullDate = date.toISOString().split("T")[0];

    options.push({
      date,
      dayOfWeek,
      dayOfMonth: `${dayOfMonth}/${month}`,
      fullDate,
    });
  }

  return options;
};
