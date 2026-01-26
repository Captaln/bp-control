import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Wind, Waves, Music } from 'lucide-react';

export const Soundscapes: React.FC = () => {
  const [activeSound, setActiveSound] = useState<'none' | 'pink' | 'rain' | 'zen'>('none');
  const [volume, setVolume] = useState(0.5);
  const [isOpen, setIsOpen] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<any[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Audio Context on user interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          const gainNode = audioContextRef.current.createGain();
          gainNode.connect(audioContextRef.current.destination);
          gainNodeRef.current = gainNode;
      }
    }
    // Resume if suspended
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
  };

  const stopSound = () => {
    activeNodesRef.current.forEach(node => {
        try {
            if (node.stop) node.stop(); 
            node.disconnect();
        } catch (e) {}
    });
    activeNodesRef.current = [];
  };

  // Pink Noise: Softer and deeper than White Noise (Great for focus)
  const playPinkNoise = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    stopSound();

    const bufferSize = audioContextRef.current.sampleRate * 2;
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
    const data = buffer.getChannelData(0);

    // Paul Kellet's refined Pink Noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // Compensate for gain
        b6 = white * 0.115926;
    }

    const noiseSource = audioContextRef.current.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    
    noiseSource.connect(gainNodeRef.current);
    noiseSource.start();
    
    activeNodesRef.current.push(noiseSource);
  };

  // Brown Noise: Very deep, rumbly, like heavy rain or distant thunder
  const playRain = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    stopSound();

    const bufferSize = audioContextRef.current.sampleRate * 2;
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Simple Brown Noise Filter
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5; 
        if (!isFinite(data[i])) data[i] = 0;
    }

    const noiseSource = audioContextRef.current.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    
    // Add a Highpass to remove muddiness
    const hpFilter = audioContextRef.current.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 40;

    noiseSource.connect(hpFilter);
    hpFilter.connect(gainNodeRef.current);
    noiseSource.start();

    activeNodesRef.current.push(noiseSource, hpFilter);
  };

  // Zen Harmony: A Major chord interval (Perfect 5th) with gentle breathing modulation
  const playZenHarmony = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    stopSound();

    const osc1 = audioContextRef.current.createOscillator();
    const osc2 = audioContextRef.current.createOscillator();
    const lfo = audioContextRef.current.createOscillator();
    const lfoGain = audioContextRef.current.createGain();
    const masterGain = audioContextRef.current.createGain();

    // Frequencies for a G Major Pentatonic feel (G3 and D4)
    // Stable, grounding, "heavenly"
    osc1.frequency.value = 196.00; // G3
    osc2.frequency.value = 293.66; // D4

    osc1.type = 'sine'; // Sine waves are pure and smooth
    osc2.type = 'sine';

    // LFO for "Breathing" effect (Volume swells slowly)
    lfo.frequency.value = 0.1; // 10 seconds per cycle (very slow breath)
    lfoGain.gain.value = 0.3; // Depth of the breathing

    // Wiring: Oscillators -> MasterGain -> GlobalGain
    // LFO -> MasterGain.gain
    osc1.connect(masterGain);
    osc2.connect(masterGain);

    // Set base volume for harmony
    masterGain.gain.value = 0.4;
    
    // Connect to output
    masterGain.connect(gainNodeRef.current);

    // Start everything
    osc1.start();
    osc2.start();

    activeNodesRef.current.push(osc1, osc2, masterGain);
  };

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
        // Smooth volume transition
        gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
    }
  }, [volume]);

  const handleToggle = (sound: 'pink' | 'rain' | 'zen') => {
    initAudio();
    if (activeSound === sound) {
        setActiveSound('none');
        stopSound();
    } else {
        setActiveSound(sound);
        if (sound === 'pink') playPinkNoise();
        if (sound === 'rain') playRain();
        if (sound === 'zen') playZenHarmony();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ${activeSound !== 'none' ? 'bg-teal-500 text-white animate-pulse' : 'bg-white text-slate-500 hover:text-teal-500'}`}
      >
        {activeSound !== 'none' ? <Volume2 size={24} /> : <Music size={24} />}
      </button>

      {/* Control Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-40 bg-white rounded-2xl shadow-xl p-4 w-64 animate-in slide-in-from-right-10 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 text-sm">Soundscapes</h3>
                <button onClick={() => { setActiveSound('none'); stopSound(); }} className="text-xs text-red-500 font-bold">Stop All</button>
            </div>

            <div className="space-y-2">
                <button 
                    onClick={() => handleToggle('zen')}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeSound === 'zen' ? 'bg-teal-50 border-teal-200 text-teal-700 border' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Wind size={20} />
                    <span className="text-sm font-medium">Zen Om</span>
                </button>

                <button 
                    onClick={() => handleToggle('rain')}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeSound === 'rain' ? 'bg-blue-50 border-blue-200 text-blue-700 border' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <CloudRain size={20} />
                    <span className="text-sm font-medium">Soft Rain</span>
                </button>

                <button 
                    onClick={() => handleToggle('pink')}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition ${activeSound === 'pink' ? 'bg-purple-50 border-purple-200 text-purple-700 border' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Waves size={20} />
                    <span className="text-sm font-medium">Pink Flow</span>
                </button>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <VolumeX size={12} />
                    <Volume2 size={12} />
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
            </div>
        </div>
      )}
    </>
  );
};
