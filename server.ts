import express from "express";
import path from "path";
import dotenv from "dotenv";
import { handleChat, handleTTS, handleQuickSentiment, handleVisionChat } from "./server/api.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "25mb" }));

// Vision chat endpoint (Camera object recognition)
app.post("/api/vision-chat", async (req, res) => {
  try {
    const result = await handleVisionChat(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Vision error" });
  }
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const result = await handleChat(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// TTS endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const result = await handleTTS(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "TTS error", fallback: true });
  }
});

// Sentiment endpoint
app.post("/api/sentiment", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await handleQuickSentiment(text || "");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Sentiment error" });
  }
});

// Static files in production
const distPath = path.resolve(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SIBEBEB Server running on port ${PORT}`);
});
