import { formatDistanceToNow } from "date-fns";

export const timeAgo = (date: string | Date) => {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};