import { GoogleAuth } from "google-auth-library";

const googleAuth = new GoogleAuth({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

export default googleAuth;
