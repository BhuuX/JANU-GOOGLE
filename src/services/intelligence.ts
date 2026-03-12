import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface RegionalIntelligence {
  marketTrends: string[];
  topSkills: string[];
  upcomingEvents: { title: string; date: string; type: string; link?: string }[];
  localCommunities: { name: string; location: string }[];
  hiringStatus: string;
}

export interface GlobalIntelligence {
  majorAnnouncements: { title: string; summary: string; date: string }[];
  trendingTech: string[];
  globalOpportunities: { title: string; deadline: string; type: string }[];
}

export const fetchRegionalIntelligence = async (country: string, interest: string): Promise<RegionalIntelligence> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Current Date: March 12, 2026. Act as a Google Ecosystem expert. Provide a detailed intelligence report for ${interest} professionals in ${country}. 
    Return the data in JSON format with the following structure:
    {
      "marketTrends": ["trend1", "trend2"],
      "topSkills": ["skill1", "skill2"],
      "upcomingEvents": [{"title": "...", "date": "...", "type": "..."}],
      "localCommunities": [{"name": "...", "location": "..."}],
      "hiringStatus": "High/Medium/Low with brief reason"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse regional intelligence", e);
    return {
      marketTrends: ["Cloud Migration", "AI Integration"],
      topSkills: ["Go", "Kubernetes", "Vertex AI"],
      upcomingEvents: [{ title: "GDG DevFest", date: "Oct 2026", type: "Conference" }],
      localCommunities: [{ name: "GDG " + country, location: "Main City" }],
      hiringStatus: "Steady growth in Cloud sectors"
    };
  }
};

export const fetchGlobalIntelligence = async (): Promise<GlobalIntelligence> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Current Date: March 12, 2026. Provide a global update on the Google Ecosystem (Cloud, Android, AI, Workspace). 
    Focus on major announcements from the last 3 months and upcoming global opportunities (scholarships, certifications, challenges).
    Return the data in JSON format:
    {
      "majorAnnouncements": [{"title": "...", "summary": "...", "date": "..."}],
      "trendingTech": ["...", "..."],
      "globalOpportunities": [{"title": "...", "deadline": "...", "type": "..."}]
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse global intelligence", e);
    return {
      majorAnnouncements: [{ title: "Gemini 3.1 Released", summary: "New reasoning capabilities...", date: "2026-03-01" }],
      trendingTech: ["Generative AI", "Rust for Android", "Carbon-free Cloud"],
      globalOpportunities: [{ title: "Google Cloud Innovators Challenge", deadline: "June 2026", type: "Competition" }]
    };
  }
};
