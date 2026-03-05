import { GoogleGenAI, Type } from "@google/genai";
import { BiologicalDetection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const detectionSchema = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING, description: "Common name of the organism" },
    scientificName: { type: Type.STRING, description: "Scientific name (Genus species)" },
    kingdom: { type: Type.STRING },
    phylum: { type: Type.STRING },
    class: { type: Type.STRING },
    order: { type: Type.STRING },
    family: { type: Type.STRING },
    genus: { type: Type.STRING },
    species: { type: Type.STRING },
    description: { type: Type.STRING, description: "A brief overview of the organism" },
    habitat: { type: Type.STRING, description: "Where it is typically found" },
    conservationStatus: { type: Type.STRING, description: "IUCN status or general status" },
    funFact: { type: Type.STRING, description: "An interesting fact about this organism" },
  },
  required: [
    "commonName",
    "scientificName",
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species",
    "description",
    "habitat",
    "conservationStatus",
    "funFact",
  ],
};

export async function detectOrganism(base64Image: string): Promise<BiologicalDetection> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1],
            },
          },
          {
            text: "Identify the biological organism in this image. Provide detailed taxonomic information and a brief description. If multiple organisms are present, focus on the most prominent one.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: detectionSchema,
    },
  });

  if (!response.text) {
    throw new Error("Failed to get response from AI");
  }

  return JSON.parse(response.text) as BiologicalDetection;
}
