/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { 
  Search, 
  Send, 
  Globe, 
  Briefcase, 
  Zap, 
  Calendar, 
  Newspaper, 
  ChevronRight,
  Loader2,
  ExternalLink,
  Sparkles,
  Info,
  MapPin,
  BrainCircuit,
  Navigation,
  User,
  Settings,
  Target,
  CheckCircle2,
  X,
  BookOpen,
  Users,
  MessageSquare,
  Trophy,
  History,
  Compass,
  Lightbulb,
  Rocket,
  ArrowRight,
  TrendingUp,
  Award,
  Mic,
  Paperclip,
  Trash2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GlobalMap } from './components/GlobalMap';
import { SkillRadarChart } from './components/SkillRadarChart';
import { CertificationTracker } from './components/CertificationTracker';
import { fetchRegionalIntelligence, fetchGlobalIntelligence, type RegionalIntelligence, type GlobalIntelligence } from './services/intelligence';

// --- Constants & Types ---

const SYSTEM_INSTRUCTION = `Your name is Janu. You are a high-intelligence Google expert. Your mission is to provide the world with the most accurate, real-time updates on Google programs, product launches, and career news.

FORMATTING GUIDELINES (STRICT ADHERENCE REQUIRED):
- Use clear, bold headings (### Heading) for each major section.
- Use bullet points for lists to ensure scannability.
- Add double line breaks between sections to create visual breathing room.
- Highlight key terms, dates, or numbers in **bold**.
- Maintain a professional, data-dense, yet scannable output suitable for Google professionals.
- Use horizontal rules (---) to separate distinct topics if the response is long.

USER CONTEXT:
- Country: {country}
- Interest: {interest}

REGIONAL INTELLIGENCE:
- Always prioritize content relevant to the user's selected country ({country}).
- Focus on local Google initiatives, regional product availability, and hiring trends in {country}.

CAREER GUIDANCE:
- For the user's interest ({interest}), provide specialized "fully real data".
- Include specific internship programs (STEP, APM, etc.) and full-time roles relevant to {interest}.

SKILL GAP ANALYSIS:
- If a user provides their skills or resume, analyze it against Google's standard requirements for {interest}.
- Provide a "Readiness Score" and a specific list of missing skills or certifications.

ROADMAP GENERATION:
- If asked for a roadmap, provide a structured, step-by-step guide to mastering {interest} at Google.
- Include specific Google Cloud certifications or Coursera courses.

INTERVIEW PREP:
- If asked for interview prep, act as a Google interviewer for {interest}.
- Ask one technical or behavioral question at a time and wait for the user's response.

GROUNDING:
- Use Google Search for real-time accuracy.
- Use Google Maps for locations.
- Cite your sources.`;

interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: { title: string; uri: string }[];
  type?: 'thinking' | 'maps' | 'standard' | 'analysis';
}

interface UserPreferences {
  country: string;
  interest: string;
  onboarded: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
}

const COUNTRIES = ["Global", "India", "United States", "United Kingdom", "Canada", "Germany", "Singapore", "Japan", "Australia", "Brazil"];
const INTERESTS = ["Software Engineering", "Product Management", "UX Design", "Data Science", "Cloud Architecture", "Digital Marketing", "Sales & Operations"];

// --- Components ---

const SourceLink = ({ title, uri }: { title: string; uri: string }) => (
  <a 
    href={uri} 
    target="_blank" 
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
  >
    <ExternalLink size={10} />
    <span className="truncate max-w-[120px]">{title}</span>
  </a>
);

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />
);

const GhostMode = () => (
  <div className="space-y-6 w-full">
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="pt-4 flex gap-2">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </div>
);

const PulseSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 bg-black/20 w-full" />
    <Skeleton className="h-4 bg-black/20 w-5/6" />
    <Skeleton className="h-4 bg-black/20 w-4/6" />
  </div>
);

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'discovery'>('dashboard');
  const [location, setLocation] = useState<Location | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>({
    country: 'Global',
    interest: 'Software Engineering',
    onboarded: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [dailyPulse, setDailyPulse] = useState<string>('');
  const [detailedPulse, setDetailedPulse] = useState<string | null>(null);
  const [isPulseLoading, setIsPulseLoading] = useState(false);
  const [isDetailedLoading, setIsDetailedLoading] = useState(false);
  const [regionalIntel, setRegionalIntel] = useState<RegionalIntelligence | null>(null);
  const [isRegionalLoading, setIsRegionalLoading] = useState(false);
  const [globalIntel, setGlobalIntel] = useState<GlobalIntelligence | null>(null);
  const [isGlobalIntelLoading, setIsGlobalIntelLoading] = useState(false);
  const [globalInfo, setGlobalInfo] = useState<string>('');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [discoveryTab, setDiscoveryTab] = useState<'stories' | 'careers' | 'innovation' | 'community' | 'certifications' | 'startups'>('stories');
  const [discoveryContent, setDiscoveryContent] = useState<{ [key: string]: string }>({});
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'interview' | 'roadmap' | 'analysis'>('general');
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const QUICK_SUGGESTIONS = {
    general: [
      "Latest Google Cloud news in India",
      "Google STEP program 2026 details",
      "Hiring trends for Software Engineers",
      "Upcoming GDG events nearby"
    ],
    interview: [
      "Ask me a behavioral question",
      "Technical question for Frontend role",
      "How to prepare for a Google interview",
      "Practice system design question"
    ],
    roadmap: [
      "Roadmap for AI/ML Engineer",
      "Learning path for Cloud Architect",
      "Best certifications for 2026",
      "How to become a Google Developer Expert"
    ],
    analysis: [
      "Analyze my skills for Backend role",
      "What skills am I missing for SRE?",
      "Check my readiness for Google Cloud",
      "Improve my technical profile"
    ]
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDetailedPulse = async () => {
    if (isDetailedLoading) return;
    setIsDetailedLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Current Date: March 12, 2026. Provide a detailed, inspiring report on the latest Google news for ${prefs.interest} in ${prefs.country}. Include 3 key takeaways and why they matter for a career at Google. Use a professional yet encouraging tone. IMPORTANT: Avoid providing external links unless they are absolutely essential official Google resources.` }] }],
        config: { tools: [{ googleSearch: {} }] },
      });
      setDetailedPulse(response.text || 'No detailed updates available.');
    } catch (e) {
      console.error(e);
      setDetailedPulse('Unable to fetch detailed report.');
    } finally {
      setIsDetailedLoading(false);
    }
  };

  const fetchDiscoveryContent = async (tab: 'stories' | 'careers' | 'innovation' | 'community' | 'certifications' | 'startups') => {
    if (discoveryContent[tab] || isDiscoveryLoading) return;
    setIsDiscoveryLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let prompt = "";
      const datePrefix = "Current Date: March 12, 2026. ";
      if (tab === 'stories') {
        prompt = `${datePrefix}Share 3 deeply inspiring stories about Google's impact on humanity or revolutionary projects (like Project Starline, DeepMind's AlphaFold, or sustainability efforts). Make them sound visionary, emotional, and world-changing. Use Markdown. IMPORTANT: Avoid providing external links unless they are absolutely essential official Google resources.`;
      } else if (tab === 'careers') {
        prompt = `${datePrefix}Provide an immersive, high-energy breakdown of what it's like to be a ${prefs.interest} at Google. Focus on the "Googleyness", the scale of impact, and the freedom to innovate. Make it sound like a dream career. Use Markdown. IMPORTANT: Avoid providing external links unless they are absolutely essential official Google resources.`;
      } else if (tab === 'innovation') {
        prompt = `${datePrefix}Highlight 3 mind-blowing innovations from Google Research or Open Source that are defining the next decade of ${prefs.interest}. Explain why these should inspire someone to join Google today. Use Markdown. IMPORTANT: Avoid providing external links unless they are absolutely essential official Google resources.`;
      } else if (tab === 'community') {
        prompt = `${datePrefix}Find and list upcoming Google Developer Group (GDG) events, Google Cloud Summits, or developer meetups in ${prefs.country}. If no specific dates are found, provide general information on how to join the community and why it's the best way to grow. Use Markdown. IMPORTANT: Avoid providing external links unless they are absolutely essential official Google resources.`;
      } else if (tab === 'certifications') {
        prompt = `${datePrefix}Provide a comprehensive guide to Google Cloud and Android certifications for ${prefs.interest}. Include the path from Associate to Professional, and mention any free training or scholarship opportunities available globally. Use Markdown.`;
      } else if (tab === 'startups') {
        prompt = `${datePrefix}Detail Google for Startups programs, including the Accelerator, Cloud for Startups credits, and regional startup hubs in ${prefs.country}. Explain how a developer can leverage these to build their own company. Use Markdown.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { tools: [{ googleSearch: {} }] },
      });
      setDiscoveryContent(prev => ({ ...prev, [tab]: response.text || 'Content not found.' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiscoveryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discovery') {
      fetchDiscoveryContent(discoveryTab);
    }
  }, [activeTab, discoveryTab]);

  const fetchDailyPulse = async (p = prefs) => {
    if (isPulseLoading) return;
    setIsPulseLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Current Date: March 12, 2026. Give me a 2-sentence summary of the most important Google news today for someone interested in ${p.interest} in ${p.country}. Be very specific and factual. IMPORTANT: Avoid providing external links.` }] }],
        config: { tools: [{ googleSearch: {} }] },
      });
      setDailyPulse(response.text || 'No updates found for today.');
    } catch (e) {
      console.error(e);
      setDailyPulse('Unable to fetch daily updates.');
    } finally {
      setIsPulseLoading(false);
    }
  };

  const fetchGlobalInfo = async () => {
    if (isGlobalLoading) return;
    setIsGlobalLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Current Date: March 12, 2026. Provide a 3-bullet point summary of the most significant Google global infrastructure or AI improvements happening outside of ${prefs.country} that are relevant to the tech world. Focus on high-impact news. Use Markdown.` }] }],
        config: { tools: [{ googleSearch: {} }] },
      });
      setGlobalInfo(response.text || 'No global updates available.');
    } catch (e) {
      console.error(e);
      setGlobalInfo('Unable to fetch global intelligence.');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (prefs.onboarded) {
      fetchDailyPulse(prefs);
      fetchGlobalInfo();
      
      setIsRegionalLoading(true);
      fetchRegionalIntelligence(prefs.country, prefs.interest).then(intel => {
        setRegionalIntel(intel);
        setIsRegionalLoading(false);
      });

      setIsGlobalIntelLoading(true);
      fetchGlobalIntelligence().then(intel => {
        setGlobalIntel(intel);
        setIsGlobalIntelLoading(false);
      });
    }
  }, [prefs.country, prefs.interest, prefs.onboarded]);

  useEffect(() => {
    // Load preferences
    const saved = localStorage.getItem('janu_prefs');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPrefs(parsed);
    }

    // Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        }
      );
    }
  }, []);

  const savePrefs = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem('janu_prefs', JSON.stringify(newPrefs));
  };

  const handleSendMessage = async (text: string = input, customType?: Message['type']) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setActiveTab('chat');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const lowerText = text.toLowerCase();
      const isMapQuery = lowerText.includes('where') || lowerText.includes('nearby') || lowerText.includes('location') || lowerText.includes('office');
      const isComplexQuery = customType === 'analysis' || lowerText.includes('career') || lowerText.includes('roadmap') || lowerText.length > 150;

      let modelName = "gemini-3-flash-preview";
      let config: any = {
        systemInstruction: SYSTEM_INSTRUCTION
          .replace(/{country}/g, prefs.country)
          .replace(/{interest}/g, prefs.interest),
        tools: [{ googleSearch: {} }],
      };

      if (isMapQuery) {
        modelName = "gemini-2.5-flash";
        config.tools = [{ googleMaps: {} }, { googleSearch: {} }];
        if (location) {
          config.toolConfig = {
            retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } }
          };
        }
      } else if (isComplexQuery) {
        modelName = "gemini-3.1-pro-preview";
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [...messages, userMessage].map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        config: config,
      });

      const allSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web || chunk.maps)
        .filter((s): s is { title: string; uri: string } => !!s) || [];

      const modelMessage: Message = {
        role: 'model',
        content: response.text || "I'm sorry, I couldn't process that.",
        sources: allSources.length > 0 ? allSources : undefined,
        type: customType || (isComplexQuery ? 'thinking' : (isMapQuery ? 'maps' : 'standard'))
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "Error connecting to Janu's core. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!prefs.onboarded) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 md:p-14 shadow-xl border border-gray-100"
        >
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
              <Sparkles size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">Welcome to Janu</h1>
            <p className="text-gray-500">Your personalized Google Intelligence Hub.</p>
          </div>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="label-caps block mb-3">Region</label>
                <select 
                  value={prefs.country}
                  onChange={(e) => setPrefs({ ...prefs, country: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label-caps block mb-3">Career Focus</label>
                <select 
                  value={prefs.interest}
                  onChange={(e) => setPrefs({ ...prefs, interest: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium"
                >
                  {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => savePrefs({ ...prefs, onboarded: true })}
                className="w-full btn-google py-5 text-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Sparkles size={20} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tighter leading-none">Janu</h1>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Intelligence</span>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 border-l border-gray-100 pl-6">
              <div className="flex flex-col">
                <span className="label-caps text-[8px]">Region</span>
                <span className="text-xs font-semibold">{prefs.country}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <nav className="flex items-center bg-gray-100 p-1 rounded-2xl">
              {(['dashboard', 'chat', 'discovery'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 md:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="md:col-span-8 md:row-span-2 bg-white rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group min-h-[400px] md:min-h-0 shadow-sm border border-gray-100"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none text-blue-600">
                <Globe size={400} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="label-caps">Executive Intelligence</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[0.9]">
                  Mastering <br />
                  <span className="text-blue-600">{prefs.interest}</span>
                </h2>
                <p className="text-gray-500 max-w-md text-xl leading-relaxed font-medium">
                  Real-time tracking of Google programs and specialized career intelligence for {prefs.country}.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-12 relative z-10">
                <button 
                  onClick={() => handleSendMessage(`What are the latest Google programs for ${prefs.interest} in ${prefs.country}?`)}
                  className="btn-google"
                >
                  Regional Updates
                </button>
                <button 
                  onClick={() => handleSendMessage(`Show me the nearest Google offices in ${prefs.country}.`)}
                  className="px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-semibold hover:bg-gray-100 transition-all"
                >
                  Locate Offices
                </button>
              </div>
            </motion.div>

            {/* Daily Pulse Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                if (!detailedPulse) fetchDetailedPulse();
                setDetailedPulse(detailedPulse || 'Generating detailed report...');
              }}
              className="md:col-span-4 md:row-span-1 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group relative border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="label-caps">Daily Pulse</div>
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                  <Zap size={16} />
                </div>
              </div>
              <div>
                {isPulseLoading ? (
                  <PulseSkeleton />
                ) : (
                  <p className="text-lg font-bold leading-tight text-gray-800">
                    {dailyPulse || "Initializing regional intelligence..."}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Interview Prep Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 md:row-span-1 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group border border-gray-100 shadow-sm"
              onClick={() => {
                setChatMode('interview');
                handleSendMessage(`I want to start a mock interview for a ${prefs.interest} role at Google. Please ask me the first question.`);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="label-caps">Mock Sessions</div>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
                  <MessageSquare size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">Interview Prep</div>
                <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-all" />
              </div>
            </motion.div>

            {/* Roadmap Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 md:row-span-1 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group border border-gray-100 shadow-sm"
              onClick={() => {
                setChatMode('roadmap');
                handleSendMessage(`Generate a personalized learning roadmap for mastering ${prefs.interest} to get into Google.`);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="label-caps">Career Path</div>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                  <BookOpen size={16} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-bold">Roadmap</div>
                <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-all" />
              </div>
            </motion.div>

            {/* Analysis Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 md:row-span-2 bg-white rounded-[2.5rem] p-8 flex flex-col border border-gray-100 shadow-sm"
            >
              <div className="label-caps mb-4">Skill Analysis</div>
              <SkillRadarChart />
              <p className="text-gray-400 text-[10px] mt-6 leading-relaxed font-medium uppercase tracking-widest text-center">
                Real-time Skill Gap Visualization
              </p>
              <div className="mt-8 pt-8 border-t border-gray-50">
                <textarea 
                  placeholder="Update skills..."
                  className="w-full bg-gray-50 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setChatMode('analysis');
                      handleSendMessage(`Analyze my skills for a ${prefs.interest} role at Google: ${e.currentTarget.value}`, 'analysis');
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </motion.div>

            {/* Bento Grid Items */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 md:row-span-1 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group relative border border-gray-100 shadow-sm"
              onClick={() => handleSendMessage(`What are the current active Google programs (like STEP, APM, Hash Code, etc.) available in ${prefs.country}?`)}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="label-caps">Opportunities</div>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                  <Trophy size={16} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold leading-none mb-1">Programs</div>
                <div className="label-caps opacity-40">Regional Feed</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 md:row-span-1 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group relative border border-gray-100 shadow-sm"
              onClick={() => handleSendMessage(`Find the nearest Google Developer Groups (GDG) and upcoming community events in ${prefs.country}.`)}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="label-caps">Community</div>
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                  <Users size={16} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold leading-none mb-1">GDG Hub</div>
                <div className="label-caps opacity-40">Local Events</div>
              </div>
            </motion.div>

            {/* Global Info Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-8 md:row-span-2 bg-white rounded-[2.5rem] p-8 md:p-12 flex flex-col min-h-[400px] md:min-h-0 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Global Intelligence</h3>
                </div>
                <div className="label-caps">World-Wide Updates</div>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                {isGlobalIntelLoading || isGlobalLoading ? (
                  <GhostMode />
                ) : globalIntel ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {globalIntel.majorAnnouncements.map((ann, i) => (
                        <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <div className="label-caps text-[8px] mb-2">{ann.date}</div>
                          <h4 className="font-bold text-sm mb-2">{ann.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{ann.summary}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div className="label-caps">Trending Tech</div>
                      <div className="flex flex-wrap gap-2">
                        {globalIntel.trendingTech.map((tech, i) => (
                          <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose-professional">
                    <ReactMarkdown>{globalInfo}</ReactMarkdown>
                  </div>
                )}
              </div>
              <button 
                onClick={fetchGlobalInfo}
                className="mt-8 self-start px-6 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Refresh
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 md:row-span-2 bg-white rounded-[2.5rem] p-8 flex flex-col border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="label-caps">Recent Activity</div>
                <Newspaper size={16} className="text-gray-300" />
              </div>
              <div className="space-y-6 flex-1">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20">
                    <MessageSquare size={32} strokeWidth={1} />
                    <div className="label-caps">No activity</div>
                  </div>
                ) : (
                  messages.slice(-3).map((m, i) => (
                    <div key={i} className="group/item relative">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        <div className="label-caps text-[8px]">{m.role}</div>
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 group-hover/item:text-gray-900 transition-all pl-4 border-l border-gray-100 leading-relaxed">
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setActiveTab('chat')}
                className="mt-8 w-full py-4 bg-gray-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                Open Full Terminal
              </button>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-12"
            >
              <GlobalMap />
            </motion.div>

            {/* Regional Market Section */}
            {isRegionalLoading ? (
              <div className="md:col-span-12 bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm">
                <GhostMode />
              </div>
            ) : regionalIntel && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp size={20} className="text-blue-600" />
                    <div className="label-caps">Market Trends</div>
                  </div>
                  <ul className="space-y-4">
                    {regionalIntel.marketTrends.map((trend, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Award size={20} className="text-green-600" />
                    <div className="label-caps">Top Skills</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {regionalIntel.topSkills.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Briefcase size={20} className="text-red-600" />
                    <div className="label-caps">Hiring Status</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-sm font-bold text-red-600 leading-relaxed">
                      {regionalIntel.hiringStatus}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : activeTab === 'discovery' ? (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="label-caps">Knowledge Base</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Discovery Hub</h2>
              </div>
              
              <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                {(['stories', 'careers', 'innovation', 'community', 'certifications', 'startups'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => {
                      setDiscoveryTab(tab);
                      if (!discoveryContent[tab]) fetchDiscoveryContent(tab);
                    }}
                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${discoveryTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <motion.div 
                key={discoveryTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="md:col-span-8 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 min-h-[500px]"
              >
                {isDiscoveryLoading ? (
                  <GhostMode />
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose-professional"
                  >
                    <ReactMarkdown>
                      {discoveryContent[discoveryTab] || "Select a tab to begin exploring."}
                    </ReactMarkdown>
                    {discoveryTab === 'certifications' && <CertificationTracker />}
                  </motion.div>
                )}
              </motion.div>

              <div className="md:col-span-4 space-y-12">
                {globalIntel && (
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy size={20} className="text-purple-600" />
                      <div className="label-caps">Global Opportunities</div>
                    </div>
                    <div className="space-y-4">
                      {globalIntel.globalOpportunities.map((opp, i) => (
                        <div key={i} className="group cursor-pointer">
                          <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{opp.title}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{opp.type}</span>
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Due: {opp.deadline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight">Why Google?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    Google isn't just a workplace; it's a place where you can solve problems that matter to billions of people.
                  </p>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-6">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight">Innovation Mindset</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    From 10x thinking to "Moonshots," learn how Google fosters a culture of radical innovation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Chat View */
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[calc(100dvh-10rem)] md:h-[calc(100vh-12rem)] bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl border border-gray-100"
          >
            {/* Intelligence Sub-Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-6 p-6 border-b border-gray-50 bg-gray-50/30">
              <div className="flex items-center gap-6">
                <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                  {(['general', 'interview', 'roadmap', 'analysis'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => {
                        setChatMode(mode);
                        if (mode === 'interview') handleSendMessage(`I want to start a mock interview for a ${prefs.interest} role at Google. Please ask me the first question.`);
                        if (mode === 'roadmap') handleSendMessage(`Generate a personalized learning roadmap for mastering ${prefs.interest} to get into Google.`);
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${chatMode === mode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="hidden md:block h-4 w-px bg-gray-200" />
                <div className="label-caps text-[8px]">
                  Active Mode: <span className="text-blue-600">{chatMode}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setMessages([])}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear Conversation</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 md:space-y-12 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-12">
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-lg shadow-blue-500/10 mx-auto">
                      <Sparkles size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight mb-3">Regional Intelligence</h3>
                      <p className="text-gray-500 font-medium">
                        Janu is optimized for {prefs.country} and {prefs.interest}. Ask anything about Google's ecosystem.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {QUICK_SUGGESTIONS[chatMode].map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-100 rounded-2xl text-xs font-semibold text-gray-600 hover:text-blue-600 transition-all text-left flex items-center justify-between group"
                      >
                        {suggestion}
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[95%] md:max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-[2rem] rounded-tr-none p-6 md:p-8 shadow-lg shadow-blue-500/20' 
                      : 'bg-gray-50 rounded-[2rem] rounded-tl-none p-6 md:p-8 border border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-blue-600'}`} />
                      <div className={`label-caps text-[8px] ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                        {msg.role === 'user' ? 'You' : (msg.type === 'analysis' ? 'Skill Analysis' : 'Janu Intelligence')}
                      </div>
                    </div>
                    <div className={`prose-professional ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.sources && (
                      <div className={`mt-8 pt-6 border-t ${msg.role === 'user' ? 'border-white/10' : 'border-gray-200'}`}>
                        <div className={`label-caps text-[8px] mb-4 ${msg.role === 'user' ? 'text-white/40' : 'text-gray-300'}`}>Verified Sources</div>
                        <div className="flex flex-wrap gap-3">
                          {msg.sources.map((source, idx) => (
                            <SourceLink key={idx} {...source} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] w-full bg-gray-50 rounded-[2rem] rounded-tl-none p-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <div className="label-caps text-[8px]">Janu is thinking...</div>
                    </div>
                    <GhostMode />
                  </div>
                </motion.div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 md:p-10 bg-white border-t border-gray-100">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                  <button 
                    className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
                    title="Upload File"
                  >
                    <Paperclip size={20} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Ask about ${prefs.interest} at Google...`}
                      className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] py-4 px-6 pr-28 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none min-h-[60px] max-h-[200px] font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button 
                        onClick={() => setIsRecording(!isRecording)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <Mic size={18} />
                      </button>
                      <button 
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-20 shadow-lg shadow-blue-500/20"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">AI Grounding Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-600" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Real-time Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-600" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Maps Integration</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/10 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-gray-100 relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-8 right-8 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Settings size={20} />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="label-caps block mb-3">Region</label>
                  <select 
                    value={prefs.country}
                    onChange={(e) => savePrefs({ ...prefs, country: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label-caps block mb-3">Career Focus</label>
                  <select 
                    value={prefs.interest}
                    onChange={(e) => savePrefs({ ...prefs, interest: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium"
                  >
                    {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full btn-google py-5"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Pulse Modal */}
      <AnimatePresence>
        {detailedPulse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/10 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-4xl w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setDetailedPulse(null)}
                className="absolute top-8 right-8 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                  <Zap size={20} />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Google Pulse</h2>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-10 leading-tight">
                Regional Intelligence: <br />
                <span className="text-blue-600">{prefs.country}</span>
              </h2>

              {isDetailedLoading ? (
                <div className="py-12">
                  <GhostMode />
                </div>
              ) : (
                <div className="prose-professional">
                  <ReactMarkdown>
                    {detailedPulse}
                  </ReactMarkdown>
                </div>
              )}

              <div className="mt-12 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="label-caps text-[8px] opacity-60">
                  Verified by Janu Intelligence • {new Date().toLocaleDateString()}
                </div>
                <button 
                  onClick={() => setDetailedPulse(null)}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-100 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Sparkles size={20} />
              </div>
              <span className="text-2xl font-bold tracking-tighter">Janu</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs font-medium">
              A professional intelligence hub for mastering the Google ecosystem, tailored for global excellence.
            </p>
          </div>
          
          <div className="md:col-span-4 space-y-6">
            <div className="label-caps">Resources</div>
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-400">
              <a href="#" className="hover:text-blue-600 transition-colors">9to5Google</a>
              <a href="#" className="hover:text-blue-600 transition-colors">The Keyword</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Workspace Blog</a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="label-caps">System Status</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-bold text-gray-600">All Systems Operational</span>
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                © 2026 JANU INTELLIGENCE HUB <br />
                {prefs.country.toUpperCase()} EDITION <br />
                LATENCY: 24MS • UPTIME: 99.9%
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
