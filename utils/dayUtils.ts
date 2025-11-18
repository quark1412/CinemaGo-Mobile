// utils/dayUtils.ts

export const generateNext7Days = () => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Định dạng ngày: dd/mm
    const key = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });

    // Nếu là hôm nay thì gắn label riêng
    const label =
      i === 0
        ? "Hôm nay"
        : date.toLocaleDateString("vi-VN", { weekday: "short" });

    return { key, label };
  });
};
