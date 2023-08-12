const express = require("express");
const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const ffmpeg = require("ffmpeg-static");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
const livepeer = require("@livepeer/react");
const app = express();
const ffprobe = require("ffprobe");
const ffprobeStatic = require("ffprobe-static");
const rimraf = require("rimraf");
const axios = require('axios');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

app.use(cors());
const port = 3000;
tf.enableProdMode();
app.use(fileUpload());
app.use(express.json());

const { provider } = livepeer.createClient({
  provider: livepeer.studioProvider({
    apiKey: "c4285fc2-fd7f-4e37-8e80-21c53f8e7308",
  }),
});
// Output directory to save the snapshots
const outputDirectory = "data";
const videoDirectory = "video";


// Generate snapshots using FFmpeg
let snapshotsGeneratedPromise = Promise.resolve();

const generateSnapshots = async (videoPath) => {
  // Get video duration
  const probeData = await ffprobe(videoPath, { path: ffprobeStatic.path });
  const duration = probeData.streams[0].duration;

  // Generate 10 random timestamps
  const timestamps = Array.from({ length: 10 }, () => Math.floor(Math.random() * (duration - 2))+3);
  console.log("timestamps: ", timestamps);

  // Get the video name and create a directory for the snapshots
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const snapshotDirectory = path.join(outputDirectory, videoName);
  if (!fs.existsSync(snapshotDirectory)) {
    fs.mkdirSync(snapshotDirectory);
  }

  // Delete existing snapshots
  const existingSnapshots = fs
    .readdirSync(snapshotDirectory)
    .filter((file) => file.startsWith("snapshot_"));
  existingSnapshots.forEach((snapshot) => {
    const snapshotPath = path.join(snapshotDirectory, snapshot);
    fs.unlinkSync(snapshotPath);
  });

  // Generate snapshots at the random timestamps
  const promises = timestamps.map((timestamp, index) => {
    const snapshotFilename = `snapshot_${index + 1}.jpg`;
    const ffmpegCommand = [
      "-i",
      videoPath,
      "-ss",
      timestamp,
      "-vframes",
      "1",
      path.join(snapshotDirectory, snapshotFilename),
    ];

    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpeg, ffmpegCommand);

      ffmpegProcess.on("error", (error) => {
        console.error("FFmpeg process error:", error);
        reject(error);
      });

      ffmpegProcess.on("close", (code) => {
        if (code === 0) {
          console.log(`Snapshot ${index + 1} generated successfully!`);
          resolve();
        } else {
          console.error(`Snapshot ${index + 1} generation failed with code:`, code);
          reject(`Snapshot ${index + 1} generation failed with code: ${code}`);
        }
      });
    });
  });

  // Wait for all snapshots to be generated
  await Promise.all(promises);
};

async function uploadAsset(video) {
  console.log("Uploading asset to livepeer..");

   const uploadingVideo = fs.createReadStream(video.videoUrl);

  const asset = await provider.createAsset({
    sources: [
      {
        name: video.name,
        file: uploadingVideo,
      },
    ],
  });
  console.log("Asset uploaded successfully to livepeer");

  return asset;
}

app.get("/", (req, res) => {
  res.send("Hello World!");
}
);


app.post("/upload", async (req, res) => {
  if (!req.files && !req.body.videoUrl) {
    return res.status(400).send("No video file or URL provided");
  }

  if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory);
  }
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
  }

  let uploadPath;

  if (req.files && req.files.video) {
    const video = req.files.video;
    if (video.mimetype !== "video/mp4") {
      return res
        .status(400)
        .send("Invalid file format. Only .mp4 files are allowed");
    }

    uploadPath = path.join(__dirname, videoDirectory, video.name);

    // Move the video file to the desired location on the server
    try {
      await video.mv(uploadPath);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send("An error occurred while uploading the video");
    }
  } else if (req.body.videoUrl) {
    const videoUrl = req.body.videoUrl;
    const videoName = videoUrl.split('/').pop();

    uploadPath = path.join(__dirname, videoDirectory, videoName);

    // Download the video file from the provided URL
    try {
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
      });

      await pipeline(response.data, fs.createWriteStream(uploadPath));
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send("An error occurred while downloading the video");
    }
  }

  res.send({ uploadPath });
});


app.post("/uploadtolivepeer", async (req, res) => {
  try {
    const { name, description, videoUrl } = req.body;
    const asset = await uploadAsset({ name, description, videoUrl });
    res.json({ asset });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Livepeer upload" });
  }
});

app.post("/nsfwcheck", async (req, res) => {
  try {
    const { videoPath } = req.body;
    console.log("Video path:", videoPath);

    await snapshotsGeneratedPromise;
    snapshotsGeneratedPromise = generateSnapshots(videoPath);

    // Wait for snapshots to be generated
    await snapshotsGeneratedPromise;

    // Get the video name and the snapshot directory
    const videoName = path.basename(videoPath, path.extname(videoPath));
    const snapshotDirectory = path.join(outputDirectory, videoName);

    const snapshotFiles = fs.readdirSync(snapshotDirectory);
    const snapshotCount = snapshotFiles.length;
    console.log("Number of snapshots generated:", snapshotCount);

    if (snapshotCount) {
      const data = [];
      const nsfwContent = [];
      const model = await nsfw.load();

      for (let index = 1; index <= snapshotCount; index++) {
        const imageBuffer = fs.readFileSync(
          path.join(snapshotDirectory, `snapshot_${index}.jpg`)
        );

        // Decode the image buffer into a tf.Tensor3D
        const image = tf.tidy(() => {
          return tf.node.decodeImage(imageBuffer, 3);
        });
        const predictions = await model.classify(image);
        console.log(index);
        data.push(predictions);

        image.dispose();
        tf.dispose(predictions);
      }

      const classVotes = { Sexy: 0, Hentai: 0, Porn: 0, Drawing: 0, Neutral: 0 };
      const thresholds = { Sexy: 0.7, Hentai: 0.7, Porn: 0.7, Drawing: 0.3, Neutral: 0.3 };

      for (let i = 0; i < data.length; i++) {
        const maxClass = data[i].reduce((prev, current) => (prev.probability > current.probability) ? prev : current);
        if (maxClass.probability > thresholds[maxClass.className]) {
          classVotes[maxClass.className]++;
        }
      }

      const maxVoteClass = Object.keys(classVotes).reduce((a, b) => classVotes[a] > classVotes[b] ? a : b);

      if (["Sexy", "Hentai", "Porn"].includes(maxVoteClass)) {
        console.log("Your post contains NSFW content:", maxVoteClass);
        nsfwContent.push("Your post contains NSFW content:", maxVoteClass);
      } else {
        console.log("Your post is safe for work");
        nsfwContent.push("Your post is safe for work");
      }

      tf.disposeVariables();

      res.json({ classVotes, nsfwContent });
    } else {
      res.json({ classVotes: {}, nsfwContent: [] });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during NSFW check" });
  }
});



app.delete("/delete/:videoName", (req, res) => {
  const { videoName } = req.params;

  // Paths to the video and snapshot directory
  const videoPath = path.join(__dirname, videoDirectory, videoName + ".mp4");
  const snapshotDirectory = path.join(__dirname, outputDirectory, videoName);

  // Delete the video
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  } else {
    return res.status(404).send("Video not found");
  }

  // Delete the snapshot directory
  if (fs.existsSync(snapshotDirectory)) {
    rimraf.sync(snapshotDirectory);
  } else {
    return res.status(404).send("Snapshots not found");
  }

  res.send("Video and snapshots deleted successfully");
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
