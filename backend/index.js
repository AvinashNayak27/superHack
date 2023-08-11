const express = require("express");
const { Issuer, generators } = require("openid-client");
const jose = require("jose");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const { Schema } = mongoose;
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

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to the database successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the application on database connection failure
  }
}

connectToDatabase();

// User Schema
const userSchema = new Schema({
  sub: {
    type: String,
    unique: true, // Ensure the 'sub' is unique
    required: true,
  },
  walletAddress: {
    type: String,
    unique: true, // Ensure the 'walletAddress' is unique
  },
});

const videoSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId, // Assuming the user's ID is an ObjectId in MongoDB
    ref: "User", // This refers to the User model, assuming you named it 'User'
    required: true,
  },
  playbackId: {
    type: String,
    required: true,
    unique: true, // Ensure the 'playbackId' is unique
  },
  playbackUrl: {
    type: String,
    required: true,
  },
});

// Create the models
const User = mongoose.model("User", userSchema);
const Video = mongoose.model("Video", videoSchema);

const createUser = async (sub) => {
  const user = await User.create({ sub });
  return user;
};

const getUsers = async () => {
  const users = await User.find();
  return users;
};
const getVideos = async () => {
  const videos = await Video.find();
  return videos;
};
const getVideosByUser = async (userId) => {
  const videos = await Video.find({ userId: userId });
  return videos;
};

const createVideo = async (videoData) => {
  const video = await Video.create(videoData);
  return video;
};

const getUserBySub = async (sub) => {
  const user = await User.findOne({ sub: sub });
  return user;
};

const app = express();

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cors());

app.use(express.json());

// Middleware to ensure the user is authenticated
async function ensureAuthenticated(req, res, next) {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
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
  res.json({ authenticated: true, user: req.user });
});

app.get("/users", async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

app.get("/videos", async (req, res) => {
  const videos = await getVideos();
  res.json(videos);
});

app.get("/videos/:userId", async (req, res) => {
  const videos = await getVideosByUser(req.params.userId);
  res.json(videos);
});

app.post("/videos", async (req, res) => {
  const video = await createVideo(req.body);
  res.json(video);
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
    const payload = await verifyJwt(tokenSet?.access_token);

    // Check if the user already exists in the database
    let user = await getUserBySub(payload.sub);
    if (!user) {
      // If the user doesn't exist, create a new one
      user = await createUser(payload.sub);
    }

    res.json({ token: tokenSet?.access_token, user });
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
