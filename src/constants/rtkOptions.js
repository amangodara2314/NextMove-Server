const rtkOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: parseDuration(REFRESH_TOKEN_EXPIRES_IN),
};

export default rtkOptions;
