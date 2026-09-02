import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { OnboardingAnswers } from '../types';

interface OnboardingModalProps {
  onComplete: () => void;
}

const INTENTION_OPTIONS = [
  'Protect 8 hours of restorative sleep',
  'Cultivate 4+ hours of uninterrupted deep focus',
  'Be deeply present with family and friends',
  'Reduce mindless screen time and browsing',
  'Make daily movement and vitality a non-negotiable',
  'End each day with gratitude and quiet reflection',
];

const FOCUS_PRESETS = [
  'Deep Work & Craft',
  'Creative Projects & Writing',
  'Health & Athletic Vitality',
  'Family & Presence',
  'Academic Learning & Research',
  'Mindful Life Balance',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(profile?.displayName || '');
  const [primaryFocus, setPrimaryFocus] = useState<string>(FOCUS_PRESETS[0]);
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [deepWorkHours, setDeepWorkHours] = useState<number>(4);
  const [selectedIntentions, setSelectedIntentions] = useState<string[]>([
    INTENTION_OPTIONS[0],
    INTENTION_OPTIONS[1],
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const toggleIntention = (item: string) => {
    if (selectedIntentions.includes(item)) {
      setSelectedIntentions(selectedIntentions.filter((i) => i !== item));
    } else {
      setSelectedIntentions([...selectedIntentions, item]);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const answers: OnboardingAnswers = {
        displayName: name.trim() || 'Practitioner',
        primaryFocus,
        targetSleepHours: sleepHours,
        targetDeepWorkHours: deepWorkHours,
        intentions: selectedIntentions,
      };
      await completeOnboarding(answers);
      onComplete();
    } catch (e) {
      console.error('Error completing onboarding:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div
        className="w-full max-w-md rounded-[32px] p-6 sm:p-7 flex flex-col gap-5 shadow-2xl relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 120% at 50% 10%, #102636 0%, #0c1c28 45%, #08131d 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
        }}
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              style={{
                font: '700 18px/1 Archivo, sans-serif',
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
              }}
            >
              twenty<span style={{ color: '#38BDF8' }}>four</span>
            </span>
          </div>
          <span
            style={{
              font: "600 10.5px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.14em',
              color: 'rgba(226, 241, 255, 0.55)',
            }}
          >
            STEP {step} OF 3
          </span>
        </div>

        {/* Step 1: Name & Core Sanctuary Focus */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span
                style={{
                  font: "600 10px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#38BDF8',
                }}
              >
                WELCOME TO TWENTYFOUR
              </span>
              <h2
                style={{
                  font: '700 24px/1.1 Archivo, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                What should we call you?
              </h2>
              <p
                className="italic mt-0.5 leading-relaxed"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: '15px',
                  color: 'rgba(226, 241, 255, 0.72)',
                }}
              >
                Every day is an unhurried canvas of twenty-four hours.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono opacity-60">Your Name or Alias</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#38BDF8] focus:outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono opacity-60">Primary Life Focus</label>
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto tf-scroll">
                {FOCUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPrimaryFocus(preset)}
                    className={`p-3 rounded-2xl text-left text-xs transition-all cursor-pointer ${
                      primaryFocus === preset
                        ? 'bg-[#38BDF8]/20 border border-[#38BDF8] text-white font-semibold'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 mt-2 rounded-2xl font-bold text-sm bg-[#38BDF8] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Continue to Daily Rhythm →
            </button>
          </div>
        )}

        {/* Step 2: 24-Hour Daily Rhythms */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span
                style={{
                  font: "600 10px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#38BDF8',
                }}
              >
                THE 24-HOUR BALANCE
              </span>
              <h2
                style={{
                  font: '700 24px/1.1 Archivo, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                Set Your Daily Rhythm
              </h2>
              <p
                className="italic mt-0.5 leading-relaxed"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: '15px',
                  color: 'rgba(226, 241, 255, 0.72)',
                }}
              >
                A well-lived day protects both deep focus and sacred rest.
              </p>
            </div>

            {/* Target Sleep */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Rest & Sleep Target</span>
                <span className="font-mono text-sm font-bold text-[#818CF8]">{sleepHours} hours</span>
              </div>
              <input
                type="range"
                min={6}
                max={10}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-[#818CF8]"
              />
              <span className="text-[10.5px] opacity-50">Foundation for physical vitality and clarity.</span>
            </div>

            {/* Target Deep Work */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Deep Focus Target</span>
                <span className="font-mono text-sm font-bold text-[#2DD4BF]">{deepWorkHours} hours</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={deepWorkHours}
                onChange={(e) => setDeepWorkHours(parseFloat(e.target.value))}
                className="w-full accent-[#2DD4BF]"
              />
              <span className="text-[10.5px] opacity-50">Uninterrupted craft, flow state, and building.</span>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl font-medium text-xs bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-[#38BDF8] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                Continue to Intentions →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Guiding Intentions */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span
                style={{
                  font: "600 10px/1 'JetBrains Mono', monospace",
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#38BDF8',
                }}
              >
                MINDFUL PRACTICES
              </span>
              <h2
                style={{
                  font: '700 24px/1.1 Archivo, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                Choose Your Intentions
              </h2>
              <p
                className="italic mt-0.5 leading-relaxed"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: '15px',
                  color: 'rgba(226, 241, 255, 0.72)',
                }}
              >
                Select the guiding principles you wish to nourish.
              </p>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto tf-scroll">
              {INTENTION_OPTIONS.map((item) => {
                const selected = selectedIntentions.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleIntention(item)}
                    className={`p-3 rounded-2xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'bg-[#2DD4BF]/20 border border-[#2DD4BF] text-white font-semibold'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span>{item}</span>
                    <span className="text-sm">{selected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-2xl font-medium text-xs bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
              >
                ← Back
              </button>
              <button
                disabled={submitting}
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8] text-black shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? 'Creating Sanctuary...' : 'Begin Journey 🌿'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
