"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconLogo, IconArrowLeft, IconKey, IconCheck, IconX,
  IconSpinner, IconBolt, IconExternalLink, IconShield, IconWarning,
} from "./Icons";

interface Props {
  initialSettings: Record<string, string>;
}

const API_CONFIGS = [
  {
    key: "GROQ_API_KEY",
    name: "Groq AI",
    required: true,
    description: "Model AI untuk generate teks skripsi. Menggunakan Llama 3.3 70B — model open-source berkualitas tinggi.",
    steps: [
      "Buka console.groq.com",
      "Klik \"Sign Up\" — daftar pakai email atau Google (GRATIS, tanpa kartu kredit)",
      "Setelah login, buka menu \"API Keys\"",
      "Klik \"Create API Key\", beri nama (misal: skripsi-generator)",
      "Copy key yang muncul (dimulai dengan gsk_...)",
      "Paste di kolom input di bawah ini",
    ],
    registerUrl: "https://console.groq.com",
    placeholder: "gsk_xxxxxxxxxxxxxxxxxxxx",
    borderColor: "border-neon-lime",
    badgeColor: "bg-neon-lime",
    iconBg: "bg-neon-lime/15",
  },
  {
    key: "GOOGLE_BOOKS_API_KEY",
    name: "Google Books",
    required: false,
    description: "Opsional — untuk meningkatkan rate limit pencarian buku. Tanpa key pun tetap bisa berjalan.",
    steps: [
      "Buka console.cloud.google.com",
      "Buat project baru (atau pilih project yang ada)",
      "Buka menu \"APIs & Services\" > \"Library\"",
      "Cari \"Books API\" dan Enable",
      "Buka \"Credentials\" > \"Create Credentials\" > \"API Key\"",
      "Copy key dan paste di bawah ini",
    ],
    registerUrl: "https://console.cloud.google.com",
    placeholder: "AIzaSyxxxxxxxxxxxxxxxxx",
    borderColor: "border-neon-orange",
    badgeColor: "bg-neon-orange",
    iconBg: "bg-neon-orange/15",
  },
];

const FREE_APIS = [
  {
    name: "Crossref",
    description: "Database jurnal internasional — otomatis aktif tanpa API key.",
    status: "Aktif",
    borderColor: "border-neon-cyan",
    iconBg: "bg-neon-cyan/15",
  },
  {
    name: "Semantic Scholar",
    description: "Database paper akademik dari Allen AI Institute — otomatis aktif tanpa API key.",
    status: "Aktif",
    borderColor: "border-neon-purple",
    iconBg: "bg-neon-purple/15",
  },
];

export default function SettingsClient({ initialSettings }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>(initialSettings);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const handleSave = async (key: string) => {
    const value = values[key]?.trim();
    if (!value) return;
    setSavingKey(key);
    setFeedback((prev) => ({ ...prev, [key]: { ok: false, msg: "" } }));
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      setSavedKeys((prev) => ({ ...prev, [key]: data.masked }));
      setValues((prev) => ({ ...prev, [key]: "" }));
      setFeedback((prev) => ({ ...prev, [key]: { ok: true, msg: "Berhasil disimpan!" } }));
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [key]: { ok: false, msg: err instanceof Error ? err.message : "Gagal" } }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen stripe-bg">
      {/* Header */}
      <header className="bg-white border-b-4 border-brutal-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconLogo className="w-10 h-10 text-brutal-border brutal-shadow-sm" />
            <div>
              <h1 className="font-bold text-xl tracking-tight text-brutal-border">Pengaturan API</h1>
              <p className="text-xs text-brutal-border/50 font-medium">Kelola API key untuk menjalankan aplikasi</p>
            </div>
          </div>
          <button onClick={() => router.push("/")}
            className="bg-brutal-border text-white font-bold text-xs px-4 py-2 border-2 border-brutal-border brutal-shadow-sm brutal-btn flex items-center gap-1.5 uppercase">
            <IconArrowLeft className="w-3.5 h-3.5" /> Kembali
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Info */}
        <div className="bg-neon-lime/15 border-3 border-brutal-border brutal-shadow p-5">
          <div className="flex gap-3 items-start">
            <IconBolt className="w-6 h-6 text-neon-lime flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-brutal-border text-sm">Semua API yang digunakan GRATIS</p>
              <p className="text-brutal-border/60 text-xs mt-1 leading-relaxed">
                Anda hanya perlu mengisi <strong>Groq API Key</strong> (wajib) untuk mulai generate skripsi.
                Crossref dan Semantic Scholar otomatis aktif tanpa key. Google Books opsional.
                Semua key tersimpan di database server — tidak dikirim ke pihak lain.
              </p>
            </div>
          </div>
        </div>

        {/* API Keys yang perlu diisi */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide mb-4 text-brutal-border flex items-center gap-2">
            <IconKey className="w-5 h-5 text-neon-purple" />
            API Key yang Perlu Diisi
          </h2>

          <div className="space-y-6">
            {API_CONFIGS.map((api) => (
              <div key={api.key} className={`bg-white border-3 ${api.borderColor} brutal-shadow p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${api.iconBg} border-2 border-brutal-border flex items-center justify-center`}>
                    <IconKey className="w-5 h-5 text-brutal-border" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-brutal-border">{api.name}</h3>
                      <span className={`${api.badgeColor} text-brutal-border text-[10px] font-bold px-2 py-0.5 border border-brutal-border`}>
                        {api.required ? "WAJIB" : "OPSIONAL"}
                      </span>
                      {savedKeys[api.key] && (
                        <span className="bg-neon-green/20 text-neon-green text-[10px] font-bold px-2 py-0.5 border border-neon-green/30 flex items-center gap-0.5">
                          <IconCheck className="w-3 h-3" /> TERSIMPAN
                        </span>
                      )}
                    </div>
                    <p className="text-brutal-border/50 text-xs mt-0.5">{api.description}</p>
                  </div>
                </div>

                {/* Saved value */}
                {savedKeys[api.key] && (
                  <div className="mb-3 bg-brutal-bg border border-brutal-border/20 px-3 py-2 flex items-center gap-2">
                    <span className="text-xs font-mono text-brutal-border/50">Key tersimpan:</span>
                    <code className="text-xs font-mono font-bold text-brutal-border">{savedKeys[api.key]}</code>
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={values[api.key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [api.key]: e.target.value }))}
                    placeholder={savedKeys[api.key] ? "Masukkan key baru untuk mengganti..." : api.placeholder}
                    className="flex-1 bg-brutal-bg border-2 border-brutal-border text-brutal-border px-3 py-2.5 text-sm font-mono placeholder-brutal-border/25 focus:outline-none focus:border-neon-pink focus:bg-neon-pink/5 transition-colors"
                  />
                  <button
                    onClick={() => handleSave(api.key)}
                    disabled={!values[api.key]?.trim() || savingKey === api.key}
                    className="bg-brutal-border hover:bg-neon-lime disabled:bg-gray-300 text-white hover:text-brutal-border disabled:text-gray-500 font-bold text-xs px-5 py-2.5 border-2 border-brutal-border brutal-shadow-sm brutal-btn flex items-center gap-1.5 uppercase transition-colors"
                  >
                    {savingKey === api.key ? <IconSpinner className="w-4 h-4" /> : <IconCheck className="w-4 h-4" />}
                    Simpan
                  </button>
                </div>

                {/* Feedback */}
                {feedback[api.key] && (
                  <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${feedback[api.key].ok ? "text-neon-green" : "text-neon-pink"}`}>
                    {feedback[api.key].ok ? <IconCheck className="w-3.5 h-3.5" /> : <IconX className="w-3.5 h-3.5" />}
                    {feedback[api.key].msg}
                  </div>
                )}

                {/* Steps */}
                <details className="mt-4">
                  <summary className="text-xs font-bold text-brutal-border/60 cursor-pointer hover:text-brutal-border transition uppercase tracking-wide">
                    Cara mendapatkan API Key
                  </summary>
                  <div className="mt-3 space-y-1.5 pl-1">
                    {api.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="bg-brutal-border text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-xs text-brutal-border/70">{step}</span>
                      </div>
                    ))}
                    <a href={api.registerUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-neon-cyan underline hover:text-neon-pink transition">
                      Buka {api.registerUrl} <IconExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>

        {/* Free APIs */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide mb-4 text-brutal-border flex items-center gap-2">
            <IconShield className="w-5 h-5 text-neon-green" />
            API Gratis Otomatis (Tanpa Key)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FREE_APIS.map((api) => (
              <div key={api.name} className={`bg-white border-2 ${api.borderColor} p-4 flex items-start gap-3`}>
                <div className={`w-8 h-8 ${api.iconBg} border border-brutal-border flex items-center justify-center flex-shrink-0`}>
                  <IconCheck className="w-4 h-4 text-neon-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-brutal-border">{api.name}</h3>
                    <span className="bg-neon-green/20 text-neon-green text-[10px] font-bold px-1.5 py-0.5 border border-neon-green/30">{api.status}</span>
                  </div>
                  <p className="text-brutal-border/50 text-xs mt-1">{api.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="bg-brutal-bg border-2 border-brutal-border/20 p-4 flex items-start gap-3">
          <IconWarning className="w-5 h-5 text-neon-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-brutal-border">Keamanan</p>
            <p className="text-brutal-border/50 text-xs mt-1 leading-relaxed">
              API key tersimpan di database server lokal. Key hanya digunakan untuk berkomunikasi langsung dengan
              API provider (Groq, Google). Key tidak dikirim ke pihak ketiga manapun dan tidak terekspos ke browser.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
