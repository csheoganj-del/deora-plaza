# DEORA Plaza - Audio Notification Files

## Generated Audio Files ✅

All audio files have been automatically generated using Web Audio API synthesis.

### Available Sounds

| File | Description | Use Case |
|------|-------------|----------|
| `order-new.wav` | Kitchen bell chord (C5+E5+G5) | New order notification |
| `order-ready.wav` | Bright chime (G5+B5+D6) | Order ready for pickup |
| `order-delivered.wav` | Soft bell (E5) | Order delivered confirmation |
| `payment-success.wav` | Cash register ascending | Successful payment |
| `payment-failed.wav` | Error diminished chord | Failed payment |
| `booking-new.wav` | Gong sound (C4 harmonics) | New booking received |
| `booking-confirmed.wav` | Success chord (C5+E5+G5+C6) | Booking confirmed |
| `booking-cancelled.wav` | Descending alert (A4→F4) | Booking cancelled |
| `success.wav` | Ethereal C major chime | General success |
| `warning.wav` | F# diminished pulse | Warning notification |
| `error.wav` | D minor alert | Error notification |
| `info.wav` | B major ping | Information notification |
| `kitchen-alert.wav` | Urgent triple bell | Kitchen urgent alert |
| `inventory-low.wav` | Soft pulse (E4) | Low inventory warning |
| `staff-call.wav` | Attention triple tone | Staff call notification |
| `table-ready.wav` | Soft chime (C5+E5) | Table ready notification |

## Audio Specifications

- **Format**: WAV (PCM)
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono
- **Duration**: 0.3s - 1.0s

## Usage in Code

```typescript
import { useNotificationSound } from '@/hooks/useNotificationSound';

function MyComponent() {
  const { playOrderNew, playSuccess, playError } = useNotificationSound();
  
  const handleNewOrder = () => {
    playOrderNew();
    // ... handle order
  };
  
  return <button onClick={handleNewOrder}>Create Order</button>;
}
```

## Regenerating Audio Files

To regenerate all audio files:

```bash
node scripts/generate-audio-files.cjs
```

## Customizing Sounds

Edit `scripts/generate-audio-files.cjs` to modify:
- Frequencies (musical notes)
- Duration
- ADSR envelope (attack, decay, sustain, release)
- Waveform type (sine, square, triangle, sawtooth)
- Harmonics for richer tones
- Volume levels

## Browser Compatibility

The audio system uses Web Audio API which is supported in:
- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 79+

Audio will gracefully degrade (silent) on unsupported browsers.
