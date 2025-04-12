import { pino } from "pino";

export const log = pino({
  transport: {
    target: "pino-pretty",
  },
});
export default log;
