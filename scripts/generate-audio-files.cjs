/**
 * Audio File Generator for DEORA Plaza
 * Generates notification sounds using Web Audio API concepts
 * Run with: node scripts/generate-audio-files.js
 */

const fs = require('fs');
const path = require('path');

// WAV file header generator
function createWavHeader(dataLength, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
  const buffer = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

// Generate a tone with envelope
function generateTone(frequency, duration, sampleRate = 44100, options = {}) {
  const {
    attack = 0.01,
    decay = 0.1,
    sustain = 0.7,
    release = 0.2,
    waveform = 'sine',
    harmonics = [],
    volume = 0.5
  } = options;

  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const phase = 2 * Math.PI * frequency * t;

    // Generate waveform
    let sample = 0;
    switch (waveform) {
      case 'sine':
        sample = Math.sin(phase);
        break;
      case 'square':
        sample = Math.sin(phase) > 0 ? 1 : -1;
        break;
      case 'triangle':
        sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
        break;
      case 'sawtooth':
        sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
        break;
    }

    // Add harmonics
    for (const h of harmonics) {
      sample += h.amplitude * Math.sin(2 * Math.PI * frequency * h.ratio * t);
    }

    // Apply ADSR envelope
    let envelope = 0;
    const attackEnd = attack;
    const decayEnd = attack + decay;
    const sustainEnd = duration - release;

    if (t < attackEnd) {
      envelope = t / attack;
    } else if (t < decayEnd) {
      envelope = 1 - (1 - sustain) * (t - attackEnd) / decay;
    } else if (t < sustainEnd) {
      envelope = sustain;
    } else {
      envelope = sustain * (1 - (t - sustainEnd) / release);
    }

    samples[i] = sample * envelope * volume;
  }

  return samples;
}

// Generate chord (multiple frequencies)
function generateChord(frequencies, duration, sampleRate = 44100, options = {}) {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (const freq of frequencies) {
    const toneSamples = generateTone(freq, duration, sampleRate, {
      ...options,
      volume: (options.volume || 0.5) / frequencies.length
    });
    for (let i = 0; i < numSamples; i++) {
      samples[i] += toneSamples[i];
    }
  }

  return samples;
}

// Convert float samples to 16-bit PCM
function floatTo16BitPCM(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), i * 2);
  }
  return buffer;
}

// Save WAV file
function saveWav(filename, samples, sampleRate = 44100) {
  const pcmData = floatTo16BitPCM(samples);
  const header = createWavHeader(pcmData.length, sampleRate);
  const wavBuffer = Buffer.concat([header, pcmData]);
  
  const outputPath = path.join(__dirname, '..', 'public', 'audio', filename);
  fs.writeFileSync(outputPath, wavBuffer);
  console.log(`✅ Generated: ${filename}`);
}

// Ensure audio directory exists
const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

console.log('🎵 Generating DEORA Plaza Audio Files...\n');

// 1. Order New - Kitchen bell (C5 + E5 + G5 chord)
const orderNew = generateChord([523.25, 659.25, 783.99], 0.5, 44100, {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.6,
  release: 0.3,
  volume: 0.6
});
saveWav('order-new.wav', orderNew);

// 2. Order Ready - Bright chime (G5 + B5 + D6)
const orderReady = generateChord([783.99, 987.77, 1174.66], 0.4, 44100, {
  attack: 0.005,
  decay: 0.05,
  sustain: 0.5,
  release: 0.3,
  volume: 0.5
});
saveWav('order-ready.wav', orderReady);

// 3. Order Delivered - Soft bell (E5)
const orderDelivered = generateTone(659.25, 0.6, 44100, {
  attack: 0.02,
  decay: 0.15,
  sustain: 0.4,
  release: 0.4,
  volume: 0.4,
  harmonics: [{ ratio: 2, amplitude: 0.3 }, { ratio: 3, amplitude: 0.1 }]
});
saveWav('order-delivered.wav', orderDelivered);

// 4. Payment Success - Cash register (C6 + E6 ascending)
const paymentSuccess1 = generateTone(1046.5, 0.15, 44100, { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.05, volume: 0.5 });
const paymentSuccess2 = generateTone(1318.51, 0.25, 44100, { attack: 0.01, decay: 0.05, sustain: 0.6, release: 0.15, volume: 0.5 });
const paymentSuccess = new Float32Array(paymentSuccess1.length + paymentSuccess2.length);
paymentSuccess.set(paymentSuccess1, 0);
paymentSuccess.set(paymentSuccess2, paymentSuccess1.length);
saveWav('payment-success.wav', paymentSuccess);

// 5. Payment Failed - Error tone (D4 + F4 diminished)
const paymentFailed = generateChord([293.66, 349.23], 0.5, 44100, {
  attack: 0.01,
  decay: 0.2,
  sustain: 0.3,
  release: 0.25,
  volume: 0.5,
  waveform: 'triangle'
});
saveWav('payment-failed.wav', paymentFailed);

// 6. Booking New - Gong sound (C4 with harmonics)
const bookingNew = generateTone(261.63, 1.0, 44100, {
  attack: 0.01,
  decay: 0.3,
  sustain: 0.4,
  release: 0.6,
  volume: 0.5,
  harmonics: [
    { ratio: 2.4, amplitude: 0.4 },
    { ratio: 3.2, amplitude: 0.2 },
    { ratio: 4.1, amplitude: 0.1 }
  ]
});
saveWav('booking-new.wav', bookingNew);

// 7. Booking Confirmed - Success chime (C5 + E5 + G5 + C6)
const bookingConfirmed = generateChord([523.25, 659.25, 783.99, 1046.5], 0.5, 44100, {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.5,
  release: 0.35,
  volume: 0.45
});
saveWav('booking-confirmed.wav', bookingConfirmed);

// 8. Booking Cancelled - Soft alert (A4 descending to F4)
const bookingCancelled1 = generateTone(440, 0.2, 44100, { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1, volume: 0.4 });
const bookingCancelled2 = generateTone(349.23, 0.3, 44100, { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.15, volume: 0.4 });
const bookingCancelled = new Float32Array(bookingCancelled1.length + bookingCancelled2.length);
bookingCancelled.set(bookingCancelled1, 0);
bookingCancelled.set(bookingCancelled2, bookingCancelled1.length);
saveWav('booking-cancelled.wav', bookingCancelled);

// 9. Success - Ethereal chime (C major - C5 + E5 + G5)
const success = generateChord([523.25, 659.25, 783.99], 0.4, 44100, {
  attack: 0.01,
  decay: 0.08,
  sustain: 0.5,
  release: 0.28,
  volume: 0.45
});
saveWav('success.wav', success);

// 10. Warning - Pulse tone (F# diminished)
const warning = generateChord([369.99, 440, 523.25], 0.4, 44100, {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.4,
  release: 0.25,
  volume: 0.5,
  waveform: 'triangle'
});
saveWav('warning.wav', warning);

// 11. Error - Soft alert (D minor)
const error = generateChord([293.66, 349.23, 440], 0.5, 44100, {
  attack: 0.01,
  decay: 0.15,
  sustain: 0.35,
  release: 0.3,
  volume: 0.5,
  waveform: 'triangle'
});
saveWav('error.wav', error);

// 12. Info - Gentle ping (B major)
const info = generateTone(493.88, 0.3, 44100, {
  attack: 0.01,
  decay: 0.08,
  sustain: 0.5,
  release: 0.18,
  volume: 0.4
});
saveWav('info.wav', info);

// 13. Kitchen Alert - Urgent bell (high frequency)
const kitchenAlert1 = generateTone(880, 0.1, 44100, { attack: 0.005, decay: 0.02, sustain: 0.7, release: 0.05, volume: 0.6 });
const kitchenAlert2 = generateTone(880, 0.1, 44100, { attack: 0.005, decay: 0.02, sustain: 0.7, release: 0.05, volume: 0.6 });
const kitchenAlert3 = generateTone(1046.5, 0.15, 44100, { attack: 0.005, decay: 0.02, sustain: 0.7, release: 0.1, volume: 0.6 });
const gap = new Float32Array(Math.floor(44100 * 0.05));
const kitchenAlert = new Float32Array(kitchenAlert1.length + gap.length + kitchenAlert2.length + gap.length + kitchenAlert3.length);
let offset = 0;
kitchenAlert.set(kitchenAlert1, offset); offset += kitchenAlert1.length;
kitchenAlert.set(gap, offset); offset += gap.length;
kitchenAlert.set(kitchenAlert2, offset); offset += kitchenAlert2.length;
kitchenAlert.set(gap, offset); offset += gap.length;
kitchenAlert.set(kitchenAlert3, offset);
saveWav('kitchen-alert.wav', kitchenAlert);

// 14. Inventory Low - Soft pulse
const inventoryLow = generateTone(329.63, 0.6, 44100, {
  attack: 0.1,
  decay: 0.2,
  sustain: 0.3,
  release: 0.25,
  volume: 0.4,
  waveform: 'triangle'
});
saveWav('inventory-low.wav', inventoryLow);

// 15. Staff Call - Attention tone
const staffCall1 = generateTone(659.25, 0.15, 44100, { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.08, volume: 0.5 });
const staffCall2 = generateTone(783.99, 0.15, 44100, { attack: 0.01, decay: 0.03, sustain: 0.6, release: 0.08, volume: 0.5 });
const staffCall3 = generateTone(659.25, 0.2, 44100, { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.12, volume: 0.5 });
const staffCall = new Float32Array(staffCall1.length + staffCall2.length + staffCall3.length);
staffCall.set(staffCall1, 0);
staffCall.set(staffCall2, staffCall1.length);
staffCall.set(staffCall3, staffCall1.length + staffCall2.length);
saveWav('staff-call.wav', staffCall);

// 16. Table Ready - Soft chime
const tableReady = generateChord([523.25, 659.25], 0.4, 44100, {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.4,
  release: 0.25,
  volume: 0.4
});
saveWav('table-ready.wav', tableReady);

console.log('\n✅ All audio files generated successfully!');
console.log(`📁 Location: ${audioDir}`);
