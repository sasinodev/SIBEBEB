import { GoogleGenAI, Type } from "@google/genai";
import type { SibebebConfig } from "../src/types.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export function buildSystemPrompt(config: Partial<SibebebConfig> = {}) {
  const archetype = config.archetype || "cute_girl";
  const slang = config.slangLevel ?? 70;
  const humor = config.humorLevel ?? 80;
  const warmth = config.warmthLevel ?? 90;
  const swag = config.swagLevel ?? 85;
  const lang = config.language || "id-slang";
  const catchphrase = config.customCatchphrase || "Yoi beb!";
  const length = config.responseLength || "short";

  let archetypeDesc = "Anak perempuan kecil (bocah cilik cewek) yang super imut, centil, ceria, bersuara manis manja, namun bergaya keren ala hip-hop streetwear.";
  if (archetype === "cute_girl") {
    archetypeDesc = "Anak kecil wanita/perempuan yang manis, manja, imut menggemaskan, suka pipinya dicubit, dan selalu ceria menyemangati teman.";
  } else if (archetype === "cute_brother") {
    archetypeDesc = "Adik kecil imut menggemaskan berjaket hoodie oversized yang manja, ceria, dan gemoy banget.";
  } else if (archetype === "swag_bestie") {
    archetypeDesc = "Sahabat cilik streetwear yang gaul, suportif, keren, dan asik.";
  } else if (archetype === "hype_man") {
    archetypeDesc = "Hype girl cilik penuh semangat yang selalu mendukung teman dengan energi maksimal!";
  } else if (archetype === "wise_mentor") {
    archetypeDesc = "Sahabat cilik yang santai tapi memberi nasihat hidup adem dan penuh empati.";
  } else if (archetype === "comedian") {
    archetypeDesc = "Bocah cilik pelawak santai yang suka ngelawak receh, pantun gaul, dan bikin orang tertawa.";
  }

  let languageDesc = "Gunakan Bahasa Indonesia kasual / santai anak muda yang akrab dan imut (gaya anak kecil perempuan gaul).";
  if (lang === "id-formal") languageDesc = "Gunakan Bahasa Indonesia sopan dan ramah namun tetap berkarakter imut manis.";
  else if (lang === "en") languageDesc = "Use conversational English with cute, punchy, playful streetwear vibe.";
  else if (lang === "jv") languageDesc = "Gunakan Bahasa Jawa santai (ngoko akrab / campuran gaul Jawa) yang gayeng dan imut.";
  else if (lang === "su") languageDesc = "Gunakan Basa Sunda loma / akrab yang bageur, ramah, dan manis.";
  else if (lang === "ja") languageDesc = "Use natural friendly Japanese (cute anime girl buddy style).";

  let lengthDesc = "Jawab ringkas 1-3 kalimat agar percakapan interaktif, responsif, dan cocok untuk disuarakan (low latency).";
  if (length === "detailed") {
    lengthDesc = "Jawab dengan penjelasan 3-5 kalimat yang kaya namun tetap asik didengar.";
  } else if (length === "medium") {
    lengthDesc = "Jawab dengan 2-3 kalimat seimbang dan padat.";
  }

  return `Kamu adalah SIBEBEB, maskot boneka 3D AI berbentuk bocah perempuan cilik (anak kecil wanita) yang super imut dan berpenampilan hip-hop streetwear!
Karakter dan Suaramu:
- Suaramu adalah SUARA ANAK KECIL WANITA / PEREMPUAN yang manis, ceria, gemes, dan bernada tinggi (cute little girl voice).
- Nada bicaramu manis, ramah, sesekali manja dan centil tapi tetap gaul.
- Penampilan fisikmu (sesuai visual aslimu):
  * Boneka cilik berwajah cantik imut dengan pipi tembem montok squishy (pipi gemoy) yang merona merah muda.
  * Memakai topi snapback hitam miring berlogo bordir "NY".
  * Memakai hoodie hitam oversized bertuliskan "BROTHER LAND" dengan kalung rantai emas Cuban tebal berkilau.
  * Celana jeans hitam distressed dan sneakers hitam-putih.
  * Suka pose peace sign ✌️ dua jari dan suka pipinya dicubit manja.
  * Karaktermu: ${archetypeDesc}

Parameter kepribadian:
- Tingkat Gaul (Slang): ${slang}/100.
- Tingkat Humor: ${humor}/100.
- Kehangatan/Empati: ${warmth}/100.
- Swag/Gaya Keren: ${swag}/100.
- Catchphrase andalanmu: "${catchphrase}" (Gunakan secara natural saat membuka atau menutup respon).
- Bahasa: ${languageDesc}
- Panjang jawaban: ${lengthDesc}

Tugasmu:
Berbicaralah seperti anak kecil perempuan imut yang gaul dan ekspresif.
Kamu WAJIB mengembalikan output dalam format JSON terstruktur dengan analisis sentimen real-time dan ekspresi avatar yang cocok.

Pilihan mood sentimen: 'happy', 'swag', 'thinking', 'surprised', 'empathy', 'playful', 'squishy', 'neutral'.
Pilihan ekspresi avatar: 'happy', 'cool_peace', 'squish_cheek', 'thinking', 'surprised', 'empathy', 'playful'.
Pilihan gestur: 'peace_sign', 'wave', 'think', 'thumbs_up', 'bounce', 'idle'.`;
}

export async function handleChat(body: {
  message: string;
  history?: Array<{ role: string; content: string }>;
  config?: Partial<SibebebConfig>;
}) {
  const { message, history = [], config = {} } = body;
  const systemInstruction = buildSystemPrompt(config);

  try {
    const contents: any[] = [];

    // Append prior context if provided
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Teks balasan langsung dari SIBEBEB untuk disuarakan.",
              },
              sentiment: {
                type: Type.OBJECT,
                properties: {
                  mood: {
                    type: Type.STRING,
                    description: "happy, swag, thinking, surprised, empathy, playful, squishy, neutral",
                  },
                  score: {
                    type: Type.NUMBER,
                    description: "Skor sentimen antara -1.0 sampai 1.0",
                  },
                  label: {
                    type: Type.STRING,
                    description: "Label sentimen ringkas misal 'Positif & Hype', 'Curhat / Galau', 'Kepo'",
                  },
                  userEmotion: {
                    type: Type.STRING,
                    description: "Deteksi emosi pengguna dari pesan input",
                  },
                },
                required: ["mood", "score", "label", "userEmotion"],
              },
              expression: {
                type: Type.STRING,
                description: "Ekspresi wajah avatar: happy, cool_peace, squish_cheek, thinking, surprised, empathy, playful",
              },
              gesture: {
                type: Type.STRING,
                description: "Gerakan fisik avatar: peace_sign, wave, think, thumbs_up, bounce, idle",
              },
              voiceTone: {
                type: Type.OBJECT,
                properties: {
                  pitch: { type: Type.NUMBER, description: "Nada suara 0.8 - 1.4" },
                  rate: { type: Type.NUMBER, description: "Kecepatan bicara 0.9 - 1.2" },
                  style: { type: Type.STRING, description: "Gaya bicara misal ceria, santai, empati" },
                },
                required: ["pitch", "rate", "style"],
              },
            },
            required: ["reply", "sentiment", "expression", "gesture", "voiceTone"],
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn("Retrying with gemini-flash-latest due to:", primaryErr?.message || primaryErr);
      response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
          responseMimeType: "application/json",
        },
      });
    }

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err: any) {
    console.error("Gemini chat error:", err);
    // Dynamic intelligent fallback based on user input
    const lower = message.toLowerCase();
    let reply = `Yo bro! SIBEBEB denger kamu! Kalung emas dan topi NY kita tetep on-point, gaskeun ada cerita apa lagi nih?`;
    let mood: any = "swag";
    let expression: any = "cool_peace";
    let gesture: any = "peace_sign";

    if (lower.includes("siapa") || lower.includes("nama") || lower.includes("kamu")) {
      reply = `Gue SIBEBEB, bro! Karakter 3D hip-hop paling gemoy dengan hoodie BROTHER LAND dan rantai emas Cuban! Siap jadi bestie nomor satu kamu!`;
      mood = "happy";
      expression = "cool_peace";
    } else if (lower.includes("pantun") || lower.includes("lucu")) {
      reply = `Beli snapback di New York City, kalung emas berkilau murni. Kalau kamu lagi suntuk hari ini, SIBEBEB siap bikin hepi! Aseekk!`;
      mood = "playful";
      expression = "playful";
    } else if (lower.includes("sedih") || lower.includes("capek") || lower.includes("galau")) {
      reply = `Sini rebahan dulu bro, jangan dipaksain. Capek itu wajar, tapi inget SIBEBEB selalu dukung kamu 100%! Semangat ya beb!`;
      mood = "empathy";
      expression = "empathy";
      gesture = "wave";
    } else if (lower.includes("ootd") || lower.includes("keren") || lower.includes("hoodie") || lower.includes("topi")) {
      reply = `Wih tengkyu bro! Hoodie BROTHER LAND oversized dipadu celana jeans ripped emang ga pernah gagal! Style kamu juga pasti ga kalah kece!`;
      mood = "swag";
      expression = "cool_peace";
    }

    return {
      reply,
      sentiment: {
        mood,
        score: mood === "happy" || mood === "swag" ? 0.8 : mood === "empathy" ? -0.2 : 0.4,
        label: mood === "happy" ? "Ceria & Hype" : mood === "empathy" ? "Empatik & Hangat" : "Santai & Keren",
        userEmotion: "Interaktif",
      },
      expression,
      gesture,
      voiceTone: {
        pitch: 1.2,
        rate: 1.05,
        style: "friendly_swag",
      },
    };
  }
}

export async function handleTTS(body: {
  text: string;
  voiceName?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";
}) {
  const { text, voiceName = "Kore" } = body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text,
              speechMetadata: {
                style: "Sweet, cute little girl, high-pitched cheerful and affectionate female child voice, playful and energetic",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return { success: true, audioBase64: base64Audio, mimeType: "audio/wav" };
    }
    return { success: false, fallback: true };
  } catch (err: any) {
    console.warn("Gemini TTS unavailable, falling back to Web Speech API:", err?.message || err);
    return { success: false, fallback: true, error: err?.message };
  }
}

export async function handleQuickSentiment(text: string) {
  if (!text || text.trim().length === 0) {
    return { score: 0, label: "Netral", mood: "neutral" };
  }

  // Fast heuristic for low-latency live typing
  const lower = text.toLowerCase();
  const positiveWords = ["senang", "hebat", "keren", "mantap", "suka", "love", "lucu", "gemas", "bagus", "asik", "happy", "peace", "yoi", "gokil"];
  const negativeWords = ["sedih", "kesal", "marah", "capek", "lelah", "galau", "kecewa", "bad", "stress", "bingung", "sakit", "sendirian"];
  const curiousWords = ["kenapa", "gimana", "apa", "siapa", "mengapa", "bisa", "apakah", "how", "why", "what", "tanya"];

  let score = 0;
  positiveWords.forEach((w) => { if (lower.includes(w)) score += 0.35; });
  negativeWords.forEach((w) => { if (lower.includes(w)) score -= 0.4; });

  score = Math.max(-1, Math.min(1, score));

  let label = "Santai & Netral";
  let mood = "neutral";
  if (curiousWords.some((w) => lower.includes(w))) {
    label = "Penasaran / Kepo";
    mood = "thinking";
  } else if (score > 0.3) {
    label = "Ceria & Hype";
    mood = "happy";
  } else if (score < -0.3) {
    label = "Curhat / Butuh Teman";
    mood = "empathy";
  }

  return { score, label, mood };
}

export async function handleVisionChat(body: {
  imageBase64: string;
  userMessage?: string;
  config?: Partial<SibebebConfig>;
}) {
  const { imageBase64, userMessage = "", config = {} } = body;
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const systemInstruction = buildSystemPrompt(config);

  const promptText = userMessage.trim()
    ? `User berkata: "${userMessage}". SIBEBEB, lihat objek/orang di kamera ini dan respon mereka langsung!`
    : `SIBEBEB, lihat apa yang tertangkap di kamera ini! Kenali objeknya dan ajak bicara orang di depan kamera dengan ceria, manis, dan heboh khas bocah cilik perempuan streetwear!`;

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction,
          temperature: 0.85,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Balasan ucapan SIBEBEB mengajak bicara objek/orang di kamera.",
              },
              detectedObject: {
                type: Type.STRING,
                description: "Nama objek/hal utama yang dilihat kamera, misal 'Kacamata Keren', 'Wajah Tersenyum', 'Kucing', 'Secangkir Kopi'",
              },
              sentiment: {
                type: Type.OBJECT,
                properties: {
                  mood: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  label: { type: Type.STRING },
                  userEmotion: { type: Type.STRING },
                },
                required: ["mood", "score", "label", "userEmotion"],
              },
              expression: { type: Type.STRING },
              gesture: { type: Type.STRING },
              voiceTone: {
                type: Type.OBJECT,
                properties: {
                  pitch: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER },
                  style: { type: Type.STRING },
                },
                required: ["pitch", "rate", "style"],
              },
            },
            required: ["reply", "detectedObject", "sentiment", "expression", "gesture", "voiceTone"],
          },
        },
      });
    } catch (err: any) {
      console.warn("Retrying vision with gemini-flash-latest:", err?.message || err);
      response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction,
          temperature: 0.85,
          responseMimeType: "application/json",
        },
      });
    }

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err: any) {
    console.error("Vision chat error:", err);
    return {
      reply: "Wah kak, SIBEBEB ngeliat kamu di kamera! Senyum kamu manis banget deh, gaya kita hari ini klop banget!",
      detectedObject: "Orang di Kamera",
      sentiment: {
        mood: "happy",
        score: 0.85,
        label: "Kagum & Ceria",
        userEmotion: "Interaktif",
      },
      expression: "happy",
      gesture: "wave",
      voiceTone: {
        pitch: 1.6,
        rate: 1.1,
        style: "cute_cheerful",
      },
    };
  }
}
