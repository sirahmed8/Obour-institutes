
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Video, Mic, Wand2, Loader2, Play, Download, AlertCircle, StopCircle, Upload, Zap, Key } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { toast } from 'react-hot-toast';

// --- HELPER: Audio Utils for Live API ---
const AudioUtils = {
  floatTo16BitPCM: (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  },
  base64ToFloat32Array: (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  }
};

// Retrieve API Key strictly from process.env as per instructions
const getApiKey = () => process.env.API_KEY;

// --- SUB-COMPONENT: Image Studio ---
const ImageStudio = () => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Configs
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [size, setSize] = useState('1K');
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files?.[0];
      setBaseImage(file);
      setBaseImagePreview(URL.createObjectURL(file));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleGenerate = async () => {
    if (!prompt) return toast.error("Please enter a prompt");
    const apiKey = getApiKey();
    if (!apiKey) return toast.error("API Key missing");

    setLoading(true);
    setResultImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey });

      if (mode === 'generate') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: { aspectRatio: aspectRatio as any, imageSize: size as any }
          }
        });
        
        let found = false;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    setResultImage(`data:image/png;base64,${part.inlineData.data}`);
                    found = true;
                    break;
                }
            }
        }
        if(!found) throw new Error("No image generated");

      } else {
        if (!baseImage) return toast.error("Please upload a base image");
        const b64 = await fileToBase64(baseImage);
        const base64Data = b64.split(',')[1];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType: baseImage.type, data: base64Data } },
              { text: prompt }
            ]
          }
        });

        let found = false;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    setResultImage(`data:image/png;base64,${part.inlineData.data}`);
                    found = true;
                    break;
                }
            }
        }
        if(!found) throw new Error("No image generated");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
          <button onClick={() => setMode('generate')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'generate' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}>Generate (Pro)</button>
          <button onClick={() => setMode('edit')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'edit' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}>Edit (Flash)</button>
        </div>

        {mode === 'edit' && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer relative overflow-hidden">
            <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
            {baseImagePreview ? (
              <img src={baseImagePreview} alt="Base" className="h-32 mx-auto rounded-lg object-cover" />
            ) : (
              <div className="text-gray-500">
                <Upload className="mx-auto mb-2" />
                <p className="text-sm">Upload Base Image</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Prompt</label>
            <textarea 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              placeholder={mode === 'generate' ? "A futuristic university campus on Mars..." : "Add a cyberpunk neon filter..."}
              className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 dark:text-white h-32 resize-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {mode === 'generate' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Ratio</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:text-white">
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Size</label>
                <select value={size} onChange={e => setSize(e.target.value)} className="w-full p-2 rounded-lg border dark:bg-gray-800 dark:text-white">
                  <option value="1K">1K</option>
                  <option value="2K">2K (HD)</option>
                  <option value="4K">4K (UHD)</option>
                </select>
              </div>
            </div>
          )}

          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mr-2"/> : <Wand2 className="mr-2"/>}
            {mode === 'generate' ? 'Generate Image' : 'Edit Image'}
          </button>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 rounded-3xl flex items-center justify-center p-4 min-h-[400px]">
        {resultImage ? (
          <div className="relative group">
            <img src={resultImage} alt="Result" className="max-w-full max-h-[500px] rounded-xl shadow-2xl" />
            <a href={resultImage} download="generated.png" className="absolute bottom-4 right-4 p-3 bg-white text-gray-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Download size={20} />
            </a>
          </div>
        ) : (
          <div className="text-gray-400 text-center">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50"/>
            <p>Result will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Video Studio (Veo) ---
const VideoStudio = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [refImage, setRefImage] = useState<File | null>(null);
  const [keySelected, setKeySelected] = useState(false);

  // Check initial key status
  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setKeySelected(has);
    } else {
        // Fallback for dev environments without the specific extension/wrapper
        setKeySelected(true); 
    }
  };

  const handleSelectKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.openSelectKey) {
          await (window as any).aistudio.openSelectKey();
          // Assume success to mitigate race condition
          setKeySelected(true);
      }
  };

  const handleGenerate = async () => {
    if (!prompt) return toast.error("Prompt required");
    
    // Ensure Key Selection before proceeding
    if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        if (!has) {
            await handleSelectKey();
        }
    }

    const apiKey = getApiKey();
    if (!apiKey) return toast.error("API Key missing");

    setLoading(true);
    setVideoUrl(null);
    setStatusMsg("Initializing Veo...");

    try {
      // Create new instance per call to ensure fresh key usage
      const ai = new GoogleGenAI({ apiKey });

      let payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      };

      if (refImage) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(refImage);
        });
        payload.image = {
            imageBytes: base64.split(',')[1],
            mimeType: refImage.type
        };
      }

      setStatusMsg("Submitting to Veo...");
      let operation = await ai.models.generateVideos(payload);

      setStatusMsg("Veo is dreaming... (this takes ~1-2 mins)");
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setStatusMsg("Rendering frames...");
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const uri = operation.response.generatedVideos[0].video.uri;
        const finalUrl = `${uri}&key=${apiKey}`;
        setVideoUrl(finalUrl);
        setStatusMsg("Complete!");
      } else {
        throw new Error("Video generation failed (No URI)");
      }

    } catch (e: any) {
      console.error(e);
      // Reset state if Entity Not Found (Key issue)
      if (e.message?.includes("Requested entity was not found")) {
          setKeySelected(false);
          toast.error("API Key Session Expired. Please select key again.");
      } else {
          toast.error("Video generation failed: " + e.message);
      }
      setStatusMsg("Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        {!keySelected && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center"><Key className="mr-2"/> Action Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    Veo requires a paid API key selection to proceed.
                </p>
                <button 
                    onClick={handleSelectKey}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700"
                >
                    Select Paid API Key
                </button>
                <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">View Billing Documentation</a>
                </div>
            </div>
        )}

        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Video Prompt</label>
            <textarea 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              placeholder="Cinematic drone shot of a futuristic city..."
              className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 dark:text-white h-32 resize-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Upload size={20} className="text-gray-400"/>
                <span className="text-sm text-gray-500 dark:text-gray-400">{refImage ? refImage.name : "Optional Reference Image"}</span>
            </div>
            <input type="file" onChange={(e) => setRefImage(e.target.files?.[0] || null)} className="w-24 text-xs" />
        </div>

        <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center disabled:opacity-50"
        >
            {loading ? <Loader2 className="animate-spin mr-2"/> : <Video className="mr-2"/>}
            Generate with Veo
        </button>
      </div>

      <div className="bg-black rounded-3xl flex items-center justify-center overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="text-center text-white/70 animate-pulse">
                <Loader2 size={48} className="mx-auto mb-4 animate-spin"/>
                <p className="font-mono text-sm">{statusMsg}</p>
            </div>
        ) : videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
        ) : (
            <div className="text-gray-500 flex flex-col items-center">
                <Play size={48} className="mb-2 opacity-50"/>
                <p>Preview Screen</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Live Voice ---
const LiveVoice = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);

  const startSession = async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) return toast.error("API Key missing");

      setStatus("Connecting...");
      const ai = new GoogleGenAI({ apiKey });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("Live");
            setActive(true);
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
                setVolume(Math.sqrt(sum/inputData.length) * 10);

                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const bytes = new Uint8Array(int16.buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const b64 = btoa(binary);

                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: "audio/pcm;rate=16000",
                            data: b64
                        }
                    });
                });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
            workletNodeRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
             const b64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (b64Audio) {
                 nextStartTimeRef.current = Math.max(
                    nextStartTimeRef.current,
                    outputCtx.currentTime,
                 );
                 const float32 = AudioUtils.base64ToFloat32Array(b64Audio);
                 const buffer = outputCtx.createBuffer(1, float32.length, 24000);
                 buffer.getChannelData(0).set(float32);
                 
                 const source = outputCtx.createBufferSource();
                 source.buffer = buffer;
                 source.connect(outputCtx.destination);
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current = nextStartTimeRef.current + buffer.duration;
             }
          },
          onclose: () => {
             setStatus("Disconnected");
             cleanup();
          },
          onerror: (e) => {
             console.error(e);
             setStatus("Error");
             cleanup();
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });

    } catch (e: any) {
        console.error(e);
        toast.error("Failed to start Live session");
        setStatus("Failed");
    }
  };

  const cleanup = () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (workletNodeRef.current) workletNodeRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      setActive(false);
      setVolume(0);
      nextStartTimeRef.current = 0;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 py-10">
        <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'bg-indigo-100 dark:bg-indigo-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {active && (
                <>
                    <motion.div animate={{ scale: [1, 1.2 + volume, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="absolute inset-0 rounded-full border-4 border-indigo-500/30" />
                    <motion.div animate={{ scale: [1, 1.5 + volume, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 rounded-full border-2 border-indigo-500/10" />
                </>
            )}
            <Mic size={64} className={active ? "text-indigo-600" : "text-gray-400"} />
        </div>

        <div className="text-center">
            <h3 className="text-2xl font-bold dark:text-white mb-2">{status}</h3>
            <p className="text-gray-500">Gemini 2.5 Native Audio Live</p>
        </div>

        {!active ? (
            <button onClick={startSession} className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center">
                <Zap className="mr-2" /> Start Conversation
            </button>
        ) : (
            <button onClick={cleanup} className="px-8 py-4 bg-red-500 text-white rounded-full font-bold text-lg shadow-xl hover:bg-red-600 hover:scale-105 transition-all flex items-center">
                <StopCircle className="mr-2" /> End Session
            </button>
        )}
    </div>
  );
};

// --- MAIN PAGE ---
export const AIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('image');

  const tabs = [
    { id: 'image', label: 'Image Studio', icon: ImageIcon },
    { id: 'video', label: 'Video Studio', icon: Video },
    { id: 'voice', label: 'Live Voice', icon: Mic },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen dark:text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">AI Studio</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Next-gen creative tools powered by Gemini 2.5 & 3.0</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                <tab.icon className="mr-2" size={18} />
                {tab.label}
            </button>
        ))}
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px]"
      >
        {activeTab === 'image' && <ImageStudio />}
        {activeTab === 'video' && <VideoStudio />}
        {activeTab === 'voice' && <LiveVoice />}
      </motion.div>
    </div>
  );
};
