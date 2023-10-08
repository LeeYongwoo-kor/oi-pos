import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export function getTokyoTime() {
  return dayjs().tz("Asia/Tokyo");
}

export function getTokyoUtcTime() {
  return getTokyoTime().utc();
}
