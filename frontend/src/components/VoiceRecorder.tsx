"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";

// Type-safe wrappers for the Web Speech API (not yet in TypeScript's standard lib.dom)
type SpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
};

type SpeechRecognitionResultList = {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
};

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorderButton({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    setError(null);

    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      onTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const bars = [12, 20, 16, 24, 14];

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        aria-label={isListening ? "Stop recording" : "Start voice recording"}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening ? "voice-pulse" : ""
        }`}
        style={{
          background: isListening
            ? "linear-gradient(135deg, #b9a6f5, #6c8eff)"
            : "rgba(108, 142, 255, 0.12)",
          border: isListening
            ? "2px solid rgba(185, 166, 245, 0.5)"
            : "2px solid rgba(108, 142, 255, 0.3)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {isListening ? (
          <Square size={32} className="text-white" />
        ) : (
          <Mic size={32} style={{ color: "#6c8eff" }} />
        )}
      </button>

      <div className="text-center">
        <p
          className="text-sm font-medium"
          style={{
            fontFamily: "Quicksand, sans-serif",
            color: isListening ? "#b9a6f5" : "#aeb8e0",
          }}
        >
          {isListening ? "Listening… tap to stop" : "Tap the mic to start speaking"}
        </p>
        {isListening && (
          <div className="flex items-center justify-center gap-1 mt-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{
                  background: "#b9a6f5",
                  height: `${h}px`,
                  animation: `voicePulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: "#f2a6c5" }}>
          {error}
        </p>
      )}
    </div>
  );
}
