/**
 * 🎵 DEORA Plaza - Enterprise Audio Notification System
 * 
 * Features:
 * - Spatial 3D audio positioning
 * - Unique sounds for each activity
 * - Ambient soundscapes
 * - Smart volume management
 * - Audio accessibility
 */

export interface AudioNotification {
  id: string;
  type: AudioNotificationType;
  title: string;
  message?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  position?: { x: number; y: number; z: number };
  duration?: number;
  businessUnit?: string;
  userId?: string;
}

export type AudioNotificationType = 
  | 'order_new'
  | 'order_ready' 
  | 'order_delivered'
  | 'payment_success'
  | 'payment_failed'
  | 'booking_new'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'table_ready'
  | 'kitchen_alert'
  | 'inventory_low'
  | 'staff_call'
  | 'system_alert'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface SoundConfig {
  url: string;
  volume: number;
  pitch: number;
  reverb: number;
  delay: number;
  spatial: boolean;
}

export class AudioNotificationSystem {
  private audioContext: AudioContext | null = null;
  private sounds: Map<AudioNotificationType, SoundConfig> = new Map();
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  private masterVolume: number = 0.7;
  private isEnabled: boolean = true;
  private spatialListener: AudioListener | null = null;
  private reverbNode: ConvolverNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  constructor() {
    this.initializeAudioContext();
    this.setupSoundLibrary();
    this.setupSpatialAudio();
  }

  /**
   * Initialize Web Audio API context
   */
  private async initializeAudioContext() {
    if (typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context on user interaction (required by browsers)
      if (this.audioContext.state === 'suspended') {
        document.addEventListener('click', () => {
          this.audioContext?.resume();
        }, { once: true });
      }

      await this.setupAudioProcessing();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Setup audio processing chain
   */
  private async setupAudioProcessing() {
    if (!this.audioContext) return;

    // Create compressor for dynamic range control
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    // Create reverb
    await this.createReverbNode();

    // Connect to destination
    this.compressor.connect(this.audioContext.destination);
  }

  /**
   * Create reverb impulse response
   */
  private async createReverbNode() {
    if (!this.audioContext) return;

    this.reverbNode = this.audioContext.createConvolver();
    
    // Create impulse response for room reverb
    const length = this.audioContext.sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
      }
    }
    
    this.reverbNode.buffer = impulse;
  }

  /**
   * Setup spatial audio listener
   */
  private setupSpatialAudio() {
    if (!this.audioContext) return;
    
    this.spatialListener = this.audioContext.listener;
    
    // Set listener position (center of screen)
    if (this.spatialListener.positionX) {
      this.spatialListener.positionX.setValueAtTime(0, this.audioContext.currentTime);
      this.spatialListener.positionY.setValueAtTime(0, this.audioContext.currentTime);
      this.spatialListener.positionZ.setValueAtTime(0, this.audioContext.currentTime);
    }
  }

  /**
   * Setup sound library with unique audio signatures
   */
  private setupSoundLibrary() {
    // Order sounds
    this.sounds.set('order_new', {
      url: '/audio/order-new.wav',
      volume: 0.8,
      pitch: 1.0,
      reverb: 0.2,
      delay: 0,
      spatial: true
    });

    this.sounds.set('order_ready', {
      url: '/audio/order-ready.wav',
      volume: 0.9,
      pitch: 1.1,
      reverb: 0.1,
      delay: 0,
      spatial: true
    });

    this.sounds.set('order_delivered', {
      url: '/audio/order-delivered.wav',
      volume: 0.6,
      pitch: 1.2,
      reverb: 0.3,
      delay: 0.1,
      spatial: false
    });

    // Payment sounds
    this.sounds.set('payment_success', {
      url: '/audio/payment-success.wav',
      volume: 0.7,
      pitch: 1.0,
      reverb: 0.2,
      delay: 0,
      spatial: false
    });

    this.sounds.set('payment_failed', {
      url: '/audio/payment-failed.wav',
      volume: 0.8,
      pitch: 0.8,
      reverb: 0.1,
      delay: 0,
      spatial: false
    });

    // Booking sounds
    this.sounds.set('booking_new', {
      url: '/audio/booking-new.wav',
      volume: 0.7,
      pitch: 1.0,
      reverb: 0.4,
      delay: 0.2,
      spatial: true
    });

    this.sounds.set('booking_confirmed', {
      url: '/audio/booking-confirmed.wav',
      volume: 0.8,
      pitch: 1.1,
      reverb: 0.3,
      delay: 0.1,
      spatial: false
    });

    // System sounds
    this.sounds.set('success', {
      url: '/audio/success.wav',
      volume: 0.6,
      pitch: 1.2,
      reverb: 0.2,
      delay: 0,
      spatial: false
    });

    this.sounds.set('warning', {
      url: '/audio/warning.wav',
      volume: 0.8,
      pitch: 0.9,
      reverb: 0.1,
      delay: 0,
      spatial: false
    });

    this.sounds.set('error', {
      url: '/audio/error.wav',
      volume: 0.9,
      pitch: 0.7,
      reverb: 0.1,
      delay: 0,
      spatial: false
    });

    this.sounds.set('kitchen_alert', {
      url: '/audio/kitchen-alert.wav',
      volume: 1.0,
      pitch: 1.0,
      reverb: 0.1,
      delay: 0,
      spatial: true
    });

    this.sounds.set('inventory_low', {
      url: '/audio/inventory-low.wav',
      volume: 0.7,
      pitch: 0.8,
      reverb: 0.2,
      delay: 0.3,
      spatial: false
    });
  }

  /**
   * Play notification sound
   */
  async playNotification(notification: AudioNotification): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return;

    const soundConfig = this.sounds.get(notification.type);
    if (!soundConfig) {
      console.warn(`No sound configured for type: ${notification.type}`);
      return;
    }

    try {
      // Load and decode audio
      const audioBuffer = await this.loadAudioBuffer(soundConfig.url);
      if (!audioBuffer) return;

      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const finalVolume = soundConfig.volume * this.masterVolume * this.getPriorityMultiplier(notification.priority);
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);

      // Apply pitch shifting
      source.playbackRate.setValueAtTime(soundConfig.pitch, this.audioContext.currentTime);

      // Setup spatial audio if enabled
      let spatialNode: PannerNode | null = null;
      if (soundConfig.spatial && notification.position) {
        spatialNode = this.createSpatialNode(notification.position);
      }

      // Create audio chain
      let currentNode: AudioNode = source;
      
      if (spatialNode) {
        currentNode.connect(spatialNode);
        currentNode = spatialNode;
      }

      currentNode.connect(gainNode);

      // Add reverb if configured
      if (soundConfig.reverb > 0 && this.reverbNode) {
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.setValueAtTime(soundConfig.reverb, this.audioContext.currentTime);
        
        gainNode.connect(reverbGain);
        reverbGain.connect(this.reverbNode);
        this.reverbNode.connect(this.compressor!);
      }

      // Connect to output
      gainNode.connect(this.compressor!);

      // Play with delay if configured
      const startTime = this.audioContext.currentTime + soundConfig.delay;
      source.start(startTime);

      // Track active sound
      this.activeSounds.set(notification.id, source);

      // Auto-cleanup
      source.onended = () => {
        this.activeSounds.delete(notification.id);
      };

      // Stop after duration if specified
      if (notification.duration) {
        source.stop(startTime + notification.duration);
      }

    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Create spatial audio node
   */
  private createSpatialNode(position: { x: number; y: number; z: number }): PannerNode {
    const panner = this.audioContext!.createPanner();
    
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;

    // Set position
    if (panner.positionX) {
      panner.positionX.setValueAtTime(position.x, this.audioContext!.currentTime);
      panner.positionY.setValueAtTime(position.y, this.audioContext!.currentTime);
      panner.positionZ.setValueAtTime(position.z, this.audioContext!.currentTime);
    }

    return panner;
  }

  /**
   * Load audio buffer from URL
   */
  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext!.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Failed to load audio: ${url}`, error);
      return null;
    }
  }

  /**
   * Get volume multiplier based on priority
   */
  private getPriorityMultiplier(priority: AudioNotification['priority']): number {
    switch (priority) {
      case 'low': return 0.5;
      case 'medium': return 0.8;
      case 'high': return 1.0;
      case 'critical': return 1.2;
      default: return 0.8;
    }
  }

  /**
   * Stop specific notification
   */
  stopNotification(id: string): void {
    const source = this.activeSounds.get(id);
    if (source) {
      source.stop();
      this.activeSounds.delete(id);
    }
  }

  /**
   * Stop all notifications
   */
  stopAllNotifications(): void {
    this.activeSounds.forEach(source => source.stop());
    this.activeSounds.clear();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable audio notifications
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAllNotifications();
    }
  }

  /**
   * Update spatial listener position
   */
  updateListenerPosition(x: number, y: number, z: number): void {
    if (!this.spatialListener || !this.audioContext) return;

    if (this.spatialListener.positionX) {
      this.spatialListener.positionX.setValueAtTime(x, this.audioContext.currentTime);
      this.spatialListener.positionY.setValueAtTime(y, this.audioContext.currentTime);
      this.spatialListener.positionZ.setValueAtTime(z, this.audioContext.currentTime);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      masterVolume: this.masterVolume,
      activeSounds: this.activeSounds.size,
      audioContextState: this.audioContext?.state,
      supportsSpatialAudio: !!this.spatialListener
    };
  }
}

// Global singleton
let audioSystem: AudioNotificationSystem | null = null;

export function getAudioSystem(): AudioNotificationSystem {
  if (!audioSystem) {
    audioSystem = new AudioNotificationSystem();
  }
  return audioSystem;
}

// React hook
export function useAudioNotifications() {
  const audioSystem = getAudioSystem();

  const playNotification = (notification: Omit<AudioNotification, 'id'>) => {
    const fullNotification: AudioNotification = {
      id: crypto.randomUUID(),
      ...notification
    };
    return audioSystem.playNotification(fullNotification);
  };

  return {
    playNotification,
    stopNotification: audioSystem.stopNotification.bind(audioSystem),
    stopAll: audioSystem.stopAllNotifications.bind(audioSystem),
    setVolume: audioSystem.setMasterVolume.bind(audioSystem),
    setEnabled: audioSystem.setEnabled.bind(audioSystem),
    getStatus: audioSystem.getStatus.bind(audioSystem)
  };
}