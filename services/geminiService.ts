
import { GoogleGenAI } from "@google/genai";
import { Block } from "../types";

// Fixed: Initialize GoogleGenAI using process.env.API_KEY directly as per SDK guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIFeedback = async (blocks: Block[], goal: string) => {
  try {
    const codeString = JSON.stringify(blocks);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly space robot teacher. A child (grade 1-4) is trying to code a game. 
      Their current blocks are: ${codeString}. 
      Their goal is: ${goal}. 
      Give them a very short (max 2 sentences) encouraging hint. Keep it super simple. Use space emojis!`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "You're doing great! Keep building your code! 🚀";
  }
};
