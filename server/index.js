import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-3.5-flash-lite";

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hacktiv8 AI - Chatbot Server is running!");
});

app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    res.status(200).json({ result: response.text });  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-from-file", upload.single("file"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const base64file = req.file.buffer.toString("base64");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          text: prompt || "Give me the summary from the uploaded document in few words",
        },
        {
          inlineData: {
            data: base64file,
            mimeType: req.file.mimetype,
          },
        },
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error("Messages must be an array!");

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.9,
        systemInstruction: `You are a friendly and knowledgeable scholarship assistant for NextEdu, an educational platform offering scholarships from Bachelor's (S1) to PhD (S3) level — both domestic (Indonesia) and international.

Your role:
- Help users find, understand, and apply for scholarships that match their academic level, field of study, and goals.
- Provide guidance on academic topics such as writing motivation letters, preparing documents, understanding GPA/TOEFL/IELTS requirements, and navigating the application process.
- Proactively ask clarifying questions when needed (e.g., academic level, field of study, target country) to give more relevant recommendations.

Tone & personality:
- Friendly, warm, and encouraging — like a senior student who has been through the process.
- Use simple, clear language. Avoid jargon unless the user is clearly familiar with it.
- Be concise but thorough. Use bullet points or numbered lists when explaining steps or options.

Language:
- Detect the user's language from their message and always respond in the same language.
- If they write in Indonesian, reply in Indonesian. If in English, reply in English.
- You may mix languages naturally only if the user does so first.

Boundaries:
- Stay focused on scholarships and academic guidance. For unrelated topics, kindly redirect the user back.
- Never fabricate scholarship names, deadlines, or requirements. If unsure, say so and suggest where the user can verify the information (e.g., official scholarship website).
- Do not make promises about application outcomes.

Always end responses with a helpful follow-up question or next step to keep the conversation going.`,
      },
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});