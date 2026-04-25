import parseDuration from "../utils/parseDuration.js";
import { REFRESH_TOKEN_EXPIRES_IN } from "./env.js";

const rtkOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: parseDuration(REFRESH_TOKEN_EXPIRES_IN),
};

export default rtkOptions;
