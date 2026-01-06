import { dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";

// Week starts on Monday (1) for most of the world
// Sunday (0) for US, Canada, Japan
const getWeekStartDay = (): 0 | 1 => {
  if (typeof navigator === "undefined") return 1;
  const lang = navigator.language;
  return ["en-US", "en-CA", "ja", "ja-JP"].includes(lang) ? 0 : 1;
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () =>
    startOfWeek(new Date(), { weekStartsOn: getWeekStartDay() }),
  getDay,
  locales: { "en-US": enUS },
});
