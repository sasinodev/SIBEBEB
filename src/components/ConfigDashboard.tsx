import React from 'react';
import type { SibebebConfig, PersonalityArchetype, LanguageCode } from '../types';
import { Sparkles, Sliders, Volume2, Globe, Palette, Bot, X, Check, RotateCcw } from 'lucide-react';

interface ConfigDashboardProps {
  config: SibebebConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (updated: Partial<SibebebConfig>) => void;
  onResetDefaults: () => void;
}

export const ConfigDashboard: React.FC<ConfigDashboardProps> = ({
  config,
  isOpen,
  onClose,
  onUpdateConfig,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const archetypes: Array<{
    id: PersonalityArchetype;
    title: string;
    icon: string;
    tagline: string;
    desc: string;
  }> = [
    {
      id: 'cute_girl',
      title: 'Adik Cewek Gemoy',
      icon: '👧',
      tagline: 'Anak Kecil Perempuan',
      desc: 'Bocah perempuan cilik yang super imut, bersuara manis manja, centil, dan menggemaskan.',
    },
    {
      id: 'swag_bestie',
      title: 'Swag Bestie',
      icon: '🧢',
      tagline: 'Gaul & Asik',
      desc: 'Sahabat cilik streetwear yang santuy, humble, dan selalu ada buat diajak nongkrong.',
    },
    {
      id: 'cute_brother',
      title: 'Adik Gemes',
      icon: '👶',
      tagline: 'Imut & Gemoy',
      desc: 'Bocah lucu hoodie kebesaran yang manja, ceria, dan suka pipinya dicubit.',
    },
    {
      id: 'hype_man',
      title: 'Hype Man',
      icon: '🎧',
      tagline: 'Penuh Energi',
      desc: 'Support system nomor 1! Penuh semangat membakar motivasi kamu.',
    },
    {
      id: 'wise_mentor',
      title: 'Wise Lil Bro',
      icon: '🧘',
      tagline: 'Bijak & Adem',
      desc: 'Pendengar yang baik dengan nasehat hidup yang mendalam dan menyejukkan.',
    },
    {
      id: 'comedian',
      title: 'Komedian Santai',
      icon: '🎭',
      tagline: 'Suka Ngelawak',
      desc: 'Jago pantun gaul, tebak-tebakan receh, dan selalu bikin ketawa.',
    },
  ];

  const languages: Array<{ code: LanguageCode; name: string; flag: string }> = [
    { code: 'id-slang', name: 'Bahasa Indonesia (Gaul / Santai)', flag: '🇮🇩' },
    { code: 'id-formal', name: 'Bahasa Indonesia (Sopan & Ramah)', flag: '🇮🇩' },
    { code: 'en', name: 'English (Urban / Streetwear)', flag: '🇺🇸' },
    { code: 'su', name: 'Basa Sunda (Akrab & Bageur)', flag: '🇮🇩' },
    { code: 'jv', name: 'Basa Jawa (Gayeng & Hangat)', flag: '🇮🇩' },
    { code: 'ja', name: 'Japanese (Casual Buddy)', flag: '🇯🇵' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0f1422] border border-amber-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Dasbor Konfigurasi SIBEBEB
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Deep Settings
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Atur kepribadian, gaya bicara, suara, dan tampilan avatar sesuai seleramu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Kepribadian Avatar */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-3">
              <Bot className="w-4 h-4" />
              1. Karakter & Kepribadian (Archetype)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {archetypes.map((arch) => {
                const isSelected = config.archetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => onUpdateConfig({ archetype: arch.id })}
                    className={`text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{arch.icon}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{arch.title}</div>
                      <div className="text-[11px] text-amber-400 font-medium mb-1">{arch.tagline}</div>
                      <div className="text-[11px] text-slate-400 leading-tight">{arch.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Slider Gaya Bicara */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              2. Penyetelan Gaya Bicara Mendalam
            </h3>

            {/* Slider: Slang / Gaul */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Level Gaul (Slang & Street Tone)</span>
                <span className="text-amber-400 font-mono font-semibold">
                  {config.slangLevel}% {config.slangLevel > 70 ? '(Gaul Parah)' : config.slangLevel > 30 ? '(Santai)' : '(Baku)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.slangLevel}
                onChange={(e) => onUpdateConfig({ slangLevel: Number(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider: Humor */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Tingkat Humor & Candaan</span>
                <span className="text-amber-400 font-mono font-semibold">
                  {config.humorLevel}% {config.humorLevel > 60 ? '(Kocak & Receh)' : '(Netral)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.humorLevel}
                onChange={(e) => onUpdateConfig({ humorLevel: Number(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider: Kehangatan & Empati */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Kehangatan & Empati</span>
                <span className="text-amber-400 font-mono font-semibold">
                  {config.warmthLevel}% {config.warmthLevel > 70 ? '(Perhatian Banget)' : '(Cool)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.warmthLevel}
                onChange={(e) => onUpdateConfig({ warmthLevel: Number(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Catchphrase */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Catchphrase / Slogan Khas SIBEBEB
              </label>
              <input
                type="text"
                value={config.customCatchphrase}
                onChange={(e) => onUpdateConfig({ customCatchphrase: e.target.value })}
                placeholder="misal: Yoi bro!, Gaskeun!, Paham gak beb?"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            {/* Latency / Response Length */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Panjang Respons & Optimasi Latensi Rendah
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['short', 'medium', 'detailed'] as const).map((len) => (
                  <button
                    key={len}
                    onClick={() => onUpdateConfig({ responseLength: len })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      config.responseLength === len
                        ? 'bg-amber-400 text-black border-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {len === 'short' ? '⚡ Cepat (1-2 kalimat)' : len === 'medium' ? 'Seimbang (2-3)' : 'Detail (3-5)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Bahasa & Aksesibilitas */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2">
              <Globe className="w-4 h-4" />
              3. Bahasa & Aksesibilitas Multi-Bahasa
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onUpdateConfig({ language: l.code })}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs text-left transition-colors ${
                    config.language === l.code
                      ? 'bg-amber-500/20 border-amber-400 text-white font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{l.flag}</span>
                  <span className="truncate">{l.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Suara & Integrasi Voice API */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              4. Integrasi Suara & Audio Engine
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateConfig({ voiceEngine: 'gemini_tts' })}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                  config.voiceEngine === 'gemini_tts'
                    ? 'bg-amber-500/20 border-amber-400 text-white font-semibold'
                    : 'bg-slate-950 border-slate-850 text-slate-400'
                }`}
              >
                <div className="font-bold text-amber-300">Gemini Cloud TTS</div>
                <div className="text-[11px] text-slate-400">Studio quality AI WAV speech</div>
              </button>

              <button
                onClick={() => onUpdateConfig({ voiceEngine: 'web_speech' })}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                  config.voiceEngine === 'web_speech'
                    ? 'bg-amber-500/20 border-amber-400 text-white font-semibold'
                    : 'bg-slate-950 border-slate-850 text-slate-400'
                }`}
              >
                <div className="font-bold text-amber-300">Web Speech API</div>
                <div className="text-[11px] text-slate-400">Zero latency instant talking</div>
              </button>
            </div>

            {config.voiceEngine === 'gemini_tts' && (
              <div>
                <label className="block text-xs text-slate-300 mb-1">Pilihan Karakter Suara Gemini</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Puck', 'Kore', 'Fenrir', 'Zephyr', 'Charon'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => onUpdateConfig({ geminiVoice: v })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-colors ${
                        config.geminiVoice === v
                          ? 'bg-amber-400 text-black border-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pitch & Rate */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Pitch (Tinggi Suara)</span>
                  <span className="text-amber-400 font-mono">{config.speechPitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.6"
                  step="0.05"
                  value={config.speechPitch}
                  onChange={(e) => onUpdateConfig({ speechPitch: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Kecepatan Bicara</span>
                  <span className="text-amber-400 font-mono">{config.speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.05"
                  value={config.speechRate}
                  onChange={(e) => onUpdateConfig({ speechRate: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Otomatis Suarakan Respon (Auto-Speak)</span>
              <input
                type="checkbox"
                checked={config.autoSpeak}
                onChange={(e) => onUpdateConfig({ autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Section 5: Tema Background 3D */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2">
              <Palette className="w-4 h-4" />
              5. Tema Panggung Avatar 3D
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'street_night', name: 'Tokyo/JKT Night', desc: 'Urban Neon' },
                { id: 'cyber_gold', name: 'Cyber Gold', desc: 'Luxury Skena' },
                { id: 'neon_studio', name: 'Hip-Hop Studio', desc: 'Purple Cyan' },
                { id: 'cozy_room', name: 'Chill Room', desc: 'Warm Loft' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateConfig({ backgroundTheme: t.id as any })}
                  className={`p-2.5 rounded-xl border text-center transition-colors ${
                    config.backgroundTheme === t.id
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[10px] opacity-75">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-400/20 transition-all duration-200"
          >
            <Check className="w-4 h-4" />
            Simpan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
