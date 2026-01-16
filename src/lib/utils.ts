import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playBeep(frequency = 880, duration = 120) {
  if (typeof window === "undefined") return
  const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
  const ctx = new Ctx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.value = frequency
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  osc.start()
  setTimeout(() => { osc.stop(); ctx.close() }, duration)
}

export function playAggressiveAlert() {
  if (typeof window === "undefined") return
  const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
  const ctx = new Ctx()

  const playSiren = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sawtooth" // More aggressive than sine
    osc.frequency.setValueAtTime(freq, startTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
    gain.gain.linearRampToValueAtTime(0, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  // Play a sequence of 3 rapid siren chirps
  const now = ctx.currentTime
  playSiren(400, now, 0.2)
  playSiren(600, now + 0.25, 0.2)
  playSiren(400, now + 0.5, 0.3)

  setTimeout(() => ctx.close(), 1000)
}

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  if (typeof document === "undefined") return
  const containerId = "toast-container-global"
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement("div")
    container.id = containerId
    container.className = "fixed top-4 right-4 z-[1000] space-y-2"
    document.body.appendChild(container)
  }
  const toast = document.createElement("div")
  const base = "rounded-lg shadow-lg px-4 py-2 text-sm"
  const color = type === "success" ? "bg-green-600 text-white" : type === "error" ? "bg-red-600 text-white" : "bg-slate-800 text-white"
  toast.className = `${base} ${color}`
  toast.textContent = message
  container.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}


// Keep a global reference to prevent garbage collection of the utterance
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakKitchenAlert(message: string, forceHindi: boolean = true) {
  if (typeof window === "undefined") return;

  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn("[TTS] Speech Synthesis not supported.");
    return;
  }

  const performSpeak = () => {
    if (synth.speaking) {
      synth.cancel();
    }
    setTimeout(() => speakNow(), 100);
  };

  const speakNow = () => {
    const voices = synth.getVoices();
    if (voices.length === 0) {
      const voicesChangedListener = () => {
        synth.removeEventListener('voiceschanged', voicesChangedListener);
        speakNow();
      };
      synth.addEventListener('voiceschanged', voicesChangedListener);
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', voicesChangedListener);
        if (synth.getVoices().length === 0) performFinalSpeak([]);
      }, 2000);
      return;
    }
    performFinalSpeak(voices);
  };

  const performFinalSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utterance = new SpeechSynthesisUtterance(message);
    currentUtterance = utterance;

    let selectedVoice = null;
    const voicePriorities = [
      'Google हिन्दी', // Google Hindi (Very natural)
      'Google', // Other Google voices (usually high quality)
      'Microsoft Swara', // Microsoft Hindi Natural
      'Microsoft Zira', // Microsoft English Natural
      'Microsoft', // Other Microsoft voices
      'Natural', // Any voice marked as "Natural"
      'Premium' // Any voice marked as "Premium"
    ];

    if (forceHindi) {
      // 1. Try exact Hindi matches from high-quality providers
      selectedVoice = voices.find(v =>
        v.lang.startsWith('hi') &&
        voicePriorities.some(p => v.name.includes(p))
      );

      // 2. Try generic Hindi
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('hi'));
      }

      // 3. Fallback to English with Indian accent preference
      if (!selectedVoice) {
        selectedVoice = voices.find(v =>
          v.lang.startsWith('en') && (
            v.name.includes('India') ||
            v.name.includes('Sangeeta') ||
            v.name.includes('Rishi')
          )
        );
      }
    }

    // 4. General High Quality Fallback (English or otherwise)
    if (!selectedVoice) {
      selectedVoice = voices.find(v =>
        voicePriorities.some(p => v.name.includes(p)) &&
        !v.name.toLowerCase().includes('male') // Prefer female by default
      );
    }

    // 5. Absolute Last Resort
    if (!selectedVoice) {
      selectedVoice = voices.find(v => !v.name.toLowerCase().includes('male')) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      console.log(`[TTS] Selected Voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    }

    utterance.pitch = 1.05; // Slightly higher pitch often sounds clearer/friendlier
    utterance.rate = 0.9;   // Slightly slower for better enunciation
    utterance.volume = 1.0;

    utterance.onend = () => { currentUtterance = null; };
    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      if (e.error === 'not-allowed') {
        showToast("🔊 Click anywhere to enable kitchen audio alerts", "info");
      }
    };

    synth.speak(utterance);
  };

  if (synth.getVoices().length > 0) {
    performSpeak();
  } else {
    const onVoices = () => {
      synth.removeEventListener('voiceschanged', onVoices);
      performSpeak();
    };
    synth.addEventListener('voiceschanged', onVoices);
    // Fallback if event never fires
    setTimeout(() => {
      if (!synth.speaking && currentUtterance === null) performSpeak();
    }, 1000);
  }
}
