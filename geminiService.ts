
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIMode, Message } from "./types";
import { SYSTEM_INSTRUCTIONS } from "./constants";

const getAI = () => {
  // @ts-ignore
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  return new GoogleGenerativeAI(apiKey);
};

// sophisticated Demo Brain for when API key is missing
const DEMO_RESPONSES: Record<AIMode, string[]> = {
  general: [
    "MUZGPT Neural Sync: I'm currently running on local backup compute. My full intelligence requires an active VITE_GEMINI_API_KEY in your .env.local file. However, I can still guide you through my features!",
    "Searching local clusters... It seems the primary neural link is offline. To enable my real-time adaptive thinking, please add your Gemini API key to .env.local. What can I help you with in the meantime?",
    "System Update: I've detected a placeholder API key. I'm MUZGPT, and once you connect my full brain via AI Studio, I'll be able to solve complex problems, write code, and more. Try asking about my 'Student' or 'Startup' modes!"
  ],
  student: [
    "Student Mode (Simulated): Quantum mechanics is easier than it looks! I can help you break down any subject. Note: To get real-time explanations, please activate my neural link by adding your API key to the environment.",
    "Hey! Learning is a journey. I'm currently in 'Lite' mode. Once my API key is linked, I can generate full study plans and memory hacks tailored specifically to you."
  ],
  game: [
    "QUEST ACCEPETED! You just earned +100 XP for exploring the interface. To turn your real tasks into level-ups, I need my full neural link (API KEY) active. Ready to quest?",
    "HYPE! You're leveling up fast. I'm MUZGPT (Game Mode). I turn every chat into an adventure. Add the API key to .env.local to unlock my full quest engine!"
  ],
  startup: [
    "Founder Insights: Every great MVP starts with a solid foundation. You've built the UI, now let's activate the brain. Add your GEMINI_API_KEY to see how I can analyze your market fit in real-time.",
    "Strategic Simulation: I'm ready to brainstorm your next big thing. While we wait for the neural link (API Key) to stabilize, what industry are you disrupting today?"
  ]
};

export const generateResponseStream = async (
  mode: AIMode,
  message: string,
  history: Message[],
  onChunk: (chunk: string) => void
) => {
  // @ts-ignore
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

  // High-fidelity fallback for demo purposes
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.length < 10) {
    await new Promise(r => setTimeout(r, 800)); // Simulate neural processing
    const responses = DEMO_RESPONSES[mode];
    const base = responses[Math.floor(Math.random() * responses.length)];

    // Stream the demo response character by character for "Perfect" feel
    const words = base.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + ' ');
      await new Promise(r => setTimeout(r, 40));
    }
    onChunk("\n\n---\n[NEURAL STATUS: SIMULATION MODE // Add GEMINI_API_KEY to .env.local for full intelligence]");
    return;
  }

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTIONS[mode]
    });

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const result = await model.generateContentStream({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
      }
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) onChunk(text);
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("not valid")) {
      onChunk("\n\n[System ERROR: The API key provided is INVALID. Please update .env.local with a fresh key from https://aistudio.google.com/]");
    } else {
      onChunk("\n\n[Neural Link Error: " + error.message + "]");
    }
  }
};
