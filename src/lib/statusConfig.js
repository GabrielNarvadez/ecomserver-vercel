export const ORDER_STATUSES = [
  { value: "NEW", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  { value: "On Going", bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  { value: "Delivered", bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  { value: "RTS", bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  { value: "Cancel", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  { value: "Waiting Encashment", bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-300" },
  { value: "Paid Penalty Cancel", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  { value: "Paid Penalty RTS", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  { value: "Reship", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
];

export const ORDER_SOURCES = ["JNT", "LBC", "Rider", "Abandoned", "Upsell", "TikTok", "Chat Support", "Shopee"];
export const TEAM_DEPARTMENTS = ["Webcake 1", "Webcake 2", "Re-Order", "TikTok", "Legal", "Chat Support"];
export const PAYMENT_MODES = ["COD", "COP"];

export function getStatusStyle(status) {
  const s = ORDER_STATUSES.find(s => s.value === status);
  return s || { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" };
}
