const express = require("express");
const { Issuer, generators } = require("openid-client");
const jose = require("jose");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();
let client;

// Initialize the OIDC client
Issuer.discover("https://id.worldcoin.org")
  .then((worldcoinIssuer) => {
    client = new worldcoinIssuer.Client({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [process.env.REDIRECT_URI],
      response_types: ["code"],
    });
  })
  .catch((err) => {
    console.error("Failed to discover the issuer:", err);
  });

const app = express();

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cors())

app.use(express.json());

// Middleware to ensure the user is authenticated
async function ensureAuthenticated(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  try {
    const payload = await verifyJwt(token);
    console.log("payload", payload);
    req.user = payload; // Store the payload in the request for use in the route if needed.
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).send("Unauthorized: Invalid token");
  }
}
app.get("/auth/check", ensureAuthenticated, (req, res) => {
  res.json({ authenticated: true });
});

app.get("/login", (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
    scope: "openid",
    nonce,
    state,
  });

  res.redirect(authUrl);
});

app.post("/exchange", async (req, res) => {
  const { code, state } = req.body;
  console.log("code", code);

  try {
    const tokenSet = await client.callback(process.env.REDIRECT_URI, { code });
    console.log("tokenSet", tokenSet);
    res.json({ token: tokenSet?.access_token });

  } catch (err) {
    console.error("Error exchanging code for token:", err);
    res.sendStatus(500);
  }
});

const verifyJwt = async (token) => {
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://id.worldcoin.org/jwks.json")
  );

  const { payload, header } = await jose.jwtVerify(token, JWKS, {
    issuer: "https://id.worldcoin.org",
    aud: process.env.CLIENT_ID,
  });

  return payload;
};

app.listen(3000, () => console.log("App listening on port 3000"));
