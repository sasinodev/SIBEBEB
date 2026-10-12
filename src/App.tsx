/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Bot,
  RotateCcw,
  Smile,
  Zap,
  Info,
  CornerDownLeft,
  Volume1,
  Camera,
  Maximize2,
} from 'lucide-react';
import { Avatar3D } from './components/Avatar3D';
import { ConfigDashboard } from './components/ConfigDashboard';
import { SentimentHUD } from './components/SentimentHUD';
import { FullScreenVisionMode } from './components/FullScreenVisionMode';
import { globalAudioSystem } from './utils/audioSystem';
import type {
  ChatMessage,
  AvatarEmotion,
  AvatarGesture,
  SibebebConfig,
  ChatSentiment,
} from './types';

const DEFAULT_CONFIG: SibebebConfig = {
  archetype: 'cute_girl',
  slangLevel: 70,
  humorLevel: 80,
  warmthLevel: 90,
  swagLevel: 85,
  responseLength: 'short',
  language: 'id-slang',
  customCatchphrase: 'Yoi beb!',
  voiceEngine: 'gemini_tts',
  geminiVoice: 'Kore',
  speechPitch: 1.6, // High pitch cute little girl voice
  speechRate: 1.1,
  autoSpeak: true,
  backgroundTheme: 'street_night',
  squishSensitivity: 80,
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'sibebeb',
    text: 'Halo kak! SIBEBEB di sini! 👧 Topi NY miring udah pas, hoodie BROTHER LAND udah rapi, pipi gemoy siap disapa! Ada cerita seru apa hari ini bareng Bebeb? Gaskeun!',
    timestamp: Date.now(),
    expression: 'cool_peace',
    gesture: 'peace_sign',
    sentiment: {
      mood: 'swag',
      score: 0.9,
      label: 'Ceria & Gemoy',
      userEmotion: 'Menyapa',
    },
  },
];

const QUICK_PROMPTS = [
  'Siapa kamu sebenarnya, Bebeb?',
  'Coba cubit pipi gemoy kamu dong!',
  'Lagi suntuk nih, hibur aku pake suara imutmu!',
  'Gaya OOTD hoodie kamu kece banget!',
  'Coba pose ✌️ dua jari andalanmu!',
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<SibebebConfig>(DEFAULT_CONFIG);
  const [mobileTab, setMobileTab] = useState<'avatar' | 'chat'>('avatar');
  const [isFullScreenVisionOpen, setIsFullScreenVisionOpen] = useState(false);

  // Avatar reactive states
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>('cool_peace');
  const [avatarGesture, setAvatarGesture] = useState<AvatarGesture>('peace_sign');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const speechRecognizerRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Real-time typing sentiment preview
  const [typingSentiment, setTypingSentiment] = useState<{
    score: number;
    label: string;
    mood: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bind audio system volume callback for real-time 3D mouth lip sync
  useEffect(() => {
    globalAudioSystem.setVolumeCallback((vol) => {
      setAudioVolume(vol);
    });

    return () => {
      globalAudioSystem.stopSpeaking();
    };
  }, []);

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Live typing sentiment analysis
  useEffect(() => {
    if (!inputText.trim()) {
      setTypingSentiment(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        });
        const data = await res.json();
        setTypingSentiment(data);

        // Preview reactive emotion on avatar while typing
        if (data.mood === 'happy') setAvatarEmotion('happy');
        else if (data.mood === 'empathy') setAvatarEmotion('empathy');
        else if (data.mood === 'thinking') setAvatarEmotion('thinking');
      } catch {}
    }, 250);

    return () => clearTimeout(timer);
  }, [inputText]);

  // Play audio speech for a specific message
  const speakMessage = async (msg: ChatMessage) => {
    if (!config.autoSpeak && !msg.text) return;

    setIsSpeaking(true);

    if (config.voiceEngine === 'gemini_tts') {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msg.text,
            voiceName: config.geminiVoice,
          }),
        });
        const data = await res.json();

        if (data.success && data.audioBase64) {
          await globalAudioSystem.playGeminiWav(data.audioBase64);
          setIsSpeaking(false);
          return;
        }
      } catch (e) {
        console.warn('Gemini TTS failed, fallback to Web Speech:', e);
      }
    }

    // Web Speech API fallback
    globalAudioSystem.speakWebSpeech(msg.text, {
      pitch: config.speechPitch,
      rate: config.speechRate,
      language: config.language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  // Stop currently playing speech
  const stopSpeech = () => {
    globalAudioSystem.stopSpeaking();
    setIsSpeaking(false);
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setTypingSentiment(null);

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setAvatarEmotion('thinking');
    setAvatarGesture('think');

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          config,
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'sibebeb',
        text: data.reply || 'Yoi bro! Mantap!',
        timestamp: Date.now(),
        sentiment: data.sentiment,
        expression: data.expression,
        gesture: data.gesture,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Trigger Avatar facial emotion and gesture
      if (data.expression) setAvatarEmotion(data.expression);
      if (data.gesture) setAvatarGesture(data.gesture);

      // Trigger Audio Speech if enabled
      if (config.autoSpeak) {
        speakMessage(botMsg);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'sibebeb',
        text: 'Waduh bro, sinyal beat-nya agak goyang nih! Tapi tenang, SIBEBEB tetep standby. Coba tanya lagi deh!',
        timestamp: Date.now(),
        expression: 'cool_peace',
        gesture: 'peace_sign',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setAvatarEmotion('cool_peace');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Voice Input (Microphone Speech-to-Text)
  const toggleListening = () => {
    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognizer = globalAudioSystem.initSpeechRecognition(
      config.language,
      (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal) {
          setIsListening(false);
          handleSendMessage(transcript);
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      }
    );

    speechRecognizerRef.current = recognizer;
    recognizer.start();
    setIsListening(true);
  };

  // Interactive Squish Cheek Reaction
  const handleCheekSquish = () => {
    setAvatarEmotion('squish_cheek');
    setAvatarGesture('bounce');

    const squishPhrases = [
      'Aduh gemoy banget pipiku ditarik! 🤏 Hehe, cubit lagi dong biar makin montok!',
      'Hahaha! Pipiku emang empuk kayak mochi bro! Lucu banget deh kamu!',
      'Pipi SIBEBEB emang no. 1 paling squishy se-Indonesia!',
    ];
    const phrase = squishPhrases[Math.floor(Math.random() * squishPhrases.length)];

    const squishMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'sibebeb',
      text: phrase,
      timestamp: Date.now(),
      expression: 'squish_cheek',
      gesture: 'bounce',
      sentiment: {
        mood: 'squishy',
        score: 0.95,
        label: 'Pipi Gemoy Dicubit',
        userEmotion: 'Gemas & Ceria',
      },
    };

    setMessages((prev) => [...prev, squishMsg]);
    if (config.autoSpeak) {
      speakMessage(squishMsg);
    }
  };

  // Update Pose from buttons
  const handlePoseChange = (pose: AvatarGesture) => {
    setAvatarGesture(pose);
    if (pose === 'peace_sign') {
      setAvatarEmotion('cool_peace');
      const peaceMsg: ChatMessage = {
        id: String(Date.now()),
        sender: 'sibebeb',
        text: 'Peace out bro! ✌️ Tetap santuy dan stylish bareng SIBEBEB!',
        timestamp: Date.now(),
        expression: 'cool_peace',
        gesture: 'peace_sign',
        sentiment: {
          mood: 'swag',
          score: 0.9,
          label: 'Peace Sign ✌️',
          userEmotion: 'Santai',
        },
      };
      setMessages((prev) => [...prev, peaceMsg]);
      if (config.autoSpeak) speakMessage(peaceMsg);
    }
  };

  const latestSentiment = messages.filter((m) => m.sentiment).slice(-1)[0]?.sentiment;

  return (
    <div className="flex flex-col h-screen w-full bg-[#080b12] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo Badge */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 shadow-lg shadow-amber-500/20 text-black font-black text-xl tracking-tighter">
            <span>SB</span>
            <span className="absolute -top-1 -right-1 text-xs">✨</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white font-mono">
                SIBEBEB
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                3D Street Chibi
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Interactive 3D Talking Character • Responsive Voice & Sentiment AI
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Speaking Status / Stop Button */}
          {isSpeaking ? (
            <button
              onClick={stopSpeech}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all animate-pulse"
              title="Hentikan suara bicara"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Suara</span>
            </button>
          ) : (
            <button
              onClick={() => setConfig((c) => ({ ...c, autoSpeak: !c.autoSpeak }))}
              className={`p-2 rounded-xl border transition-colors ${
                config.autoSpeak
                  ? 'bg-slate-900 border-amber-500/30 text-amber-400 hover:bg-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={config.autoSpeak ? 'Suara otomatis aktif' : 'Suara otomatis nonaktif'}
            >
              {config.autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* Mode Full Screen Vision (Camera & Mic Active) */}
          <button
            onClick={() => setIsFullScreenVisionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            title="Buka Mode Full Screen dengan Kamera & Mikrofon aktif"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Screen Vision 👁️</span>
            <span className="sm:hidden">Full Screen</span>
          </button>

          {/* Config Dashboard Button */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Dasbor</span>
          </button>
        </div>
      </header>

      {/* Mobile Screen Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/60 p-1.5 shrink-0">
        <button
          onClick={() => setMobileTab('avatar')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'avatar'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Karakter SIBEBEB 3D</span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'chat'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Percakapan & Suara</span>
        </button>
      </div>

      {/* Main Dual-Panel Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: 3D Interactive Avatar Stage */}
        <div
          className={`w-full lg:w-[50%] h-full p-3 md:p-4 flex flex-col gap-3 shrink-0 overflow-hidden ${
            mobileTab === 'avatar' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* 3D Avatar Viewport */}
          <div className="flex-1 w-full min-h-[380px] lg:min-h-0 relative rounded-2xl overflow-hidden shadow-2xl">
            <Avatar3D
              emotion={avatarEmotion}
              gesture={avatarGesture}
              isSpeaking={isSpeaking}
              audioVolume={audioVolume}
              theme={config.backgroundTheme}
              customAvatarImage={config.customAvatarImage}
              onCheekSquish={handleCheekSquish}
              onPoseChange={handlePoseChange}
              onUploadImage={(img) => setConfig((c) => ({ ...c, customAvatarImage: img }))}
            />
          </div>

          {/* Under-Avatar: Real-Time Sentiment HUD */}
          <div className="shrink-0">
            <SentimentHUD
              currentSentiment={latestSentiment}
              avatarEmotion={avatarEmotion}
              isTypingSentiment={typingSentiment || undefined}
            />
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div
          className={`flex-1 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-[#090d16] overflow-hidden ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Chat Stream Header Info */}
          <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-slate-300">
                Mode: {config.archetype === 'swag_bestie' ? 'Swag Bestie' : config.archetype}
              </span>
              <span>•</span>
              <span className="text-amber-400 font-mono">
                Slang {config.slangLevel}% | {config.responseLength === 'short' ? 'Low Latency' : 'Standard'}
              </span>
            </div>

            <button
              onClick={() => setMessages(INITIAL_MESSAGES)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
              title="Reset Percakapan"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Bersihkan Chat</span>
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar Mini Icon */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shrink-0 shadow-md">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400 font-black text-xs font-mono">
                        SB
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-lg ${
                      isUser
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {/* Header for Bot message with Sentiment Chip */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800/80">
                        <span className="font-bold text-xs text-amber-300 font-mono">SIBEBEB</span>
                        {msg.sentiment && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium">
                            {msg.sentiment.label}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Audio Playback button for Bot Messages */}
                    {!isUser && (
                      <div className="mt-2 pt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <button
                          onClick={() => speakMessage(msg)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                          title="Dengarkan suara SIBEBEB"
                        >
                          <Volume1 className="w-3 h-3" />
                          <span>Suarakan</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium p-3 rounded-2xl bg-slate-900/80 border border-amber-500/20 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>SIBEBEB lagi mikir beat dan nada jawaban...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-slate-800/40 bg-slate-950/40 overflow-x-auto">
            <div className="flex items-center gap-1.5 w-max">
              <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Coba:
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-amber-950/30 hover:border-amber-500/40 border border-slate-800 text-xs text-slate-300 hover:text-amber-300 whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-950/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl border transition-all duration-200 shrink-0 ${
                  isListening
                    ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-400/40'
                }`}
                title={isListening ? 'Mendengarkan suara... Klik untuk kirim' : 'Bicara lewat Mikrofon'}
              >
                {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Sedang mendengarkan suaramu...'
                      : 'Ketik pesan untuk SIBEBEB (misal: halo bro, lagi apa?)...'
                  }
                  disabled={isLoading}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 transition-all font-medium"
                />

                {/* Real-time sentiment pill on input */}
                {typingSentiment && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-amber-300 font-medium">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span>{typingSentiment.label}</span>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-500/20 shrink-0 active:scale-95"
                title="Kirim pesan"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Configuration Dashboard Modal */}
      <ConfigDashboard
        config={config}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onUpdateConfig={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
        onResetDefaults={() => setConfig(DEFAULT_CONFIG)}
      />

      {/* Full Screen Interactive Camera Vision Mode */}
      <FullScreenVisionMode
        isOpen={isFullScreenVisionOpen}
        onClose={() => setIsFullScreenVisionOpen(false)}
        config={config}
        onSpeak={async (text) => {
          await speakMessage({
            id: String(Date.now()),
            sender: 'sibebeb',
            text,
            timestamp: Date.now(),
          });
        }}
        onSendMessage={async (text) => {
          await handleSendMessage(text);
        }}
        avatarEmotion={avatarEmotion}
        avatarGesture={avatarGesture}
        isSpeaking={isSpeaking}
        audioVolume={audioVolume}
        setAvatarEmotion={setAvatarEmotion}
        setAvatarGesture={setAvatarGesture}
      />
    </div>
  );
}
