import React, { useState, useRef, useEffect } from 'react';
import {
  Mic, Square, Upload, Volume2, ShieldCheck, ArrowLeftRight, Download, Copy, Check,
  X, FileAudio, CheckCircle2, AlertCircle, Loader2, Languages, AudioLines, Wand2,
} from 'lucide-react';
import { api } from '../lib/api';
import { StudioResult } from '../types/api';

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', native: 'স্বচালিত / Auto' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'en', name: 'English', native: 'English' },
];

export const StudioPage: React.FC = () => {
  // Input mode: 'audio' | 'text'
  const [inputMode, setInputMode] = useState<'audio' | 'text'>('audio');

  // Language selectors
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('kn'); // Default to Kannada

  // Audio file & mic recording state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [, setRecordedBlob] = useState<Blob | null>(null);

  // Text input state
  const [textInput, setTextInput] = useState('');
  const [commandPrompt, setCommandPrompt] = useState('');

  // Toggles
  const [filterNoise, setFilterNoise] = useState(true);
  const [generateAudio, setGenerateAudio] = useState(true);

  // Processing & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StudioResult | null>(null);
  const [copiedText, setCopiedText] = useState<'source' | 'target' | null>(null);

  // Refs for media recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean preview URLs on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  // Handle Microphone Recording
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(url);
        const file = new File([audioBlob], `mic_recording_${Date.now()}.wav`, { type: 'audio/wav' });
        setAudioFile(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError('Microphone access denied or not available. You can also upload an audio file directly.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setRecordedBlob(null);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const acceptFile = (file: File) => {
    setAudioFile(file);
    setRecordedBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const clearAudio = () => {
    setAudioFile(null);
    setRecordedBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const prevSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prevSource);
  };

  const handleCopy = (text: string, type: 'source' | 'target') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (inputMode === 'audio' && !audioFile && !textInput.trim() && !commandPrompt.trim()) {
      setError('Please record audio from mic, upload an audio file, or enter text to process.');
      return;
    }

    if (inputMode === 'text' && !textInput.trim() && !commandPrompt.trim()) {
      setError('Please type or dictate text to translate and convert to voice.');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();

    if (audioFile) {
      formData.append('audio', audioFile);
    }
    if (textInput.trim()) {
      formData.append('text', textInput.trim());
    }
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    formData.append('filter_noise', String(filterNoise));
    formData.append('generate_audio', String(generateAudio));
    if (commandPrompt.trim()) {
      formData.append('command', commandPrompt.trim());
    }

    try {
      const res = await api.studio.process(formData);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Processing failed. Please check inputs and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const field = 'w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 transition-colors hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25';
  const panel = 'rounded-xl border border-ink-200 bg-white shadow-panel';
  const pipeline = ['Clean audio', 'Transcribe', 'Translate', 'Speak'];

  const Switch = ({ on, set, label, hint, icon }: { on: boolean; set: (v: boolean) => void; label: string; hint: string; icon: React.ReactNode }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => set(!on)}
      className="flex w-full items-center gap-3 rounded-lg border border-ink-200 px-3.5 py-3 text-left transition-colors hover:bg-ink-50"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${on ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-400'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">{label}</span>
        <span className="block text-[13px] text-ink-500">{hint}</span>
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? 'bg-brand-600' : 'bg-ink-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );

  const CopyBtn = ({ text, kind }: { text: string; kind: 'source' | 'target' }) => (
    <button
      type="button"
      onClick={() => handleCopy(text, kind)}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
    >
      {copiedText === kind ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copiedText === kind ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-tight tracking-tight text-ink-900">
          Translate speech and text across Indian languages
        </h1>
        <p className="mt-2 text-base text-ink-500">
          Record or upload a voice note, remove background noise, and get an accurate translation with natural spoken audio.
        </p>
      </div>

      {/* Language bar */}
      <div className={`${panel} grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:p-5`}>
        <div>
          <label htmlFor="src" className="mb-1.5 block text-sm font-semibold text-ink-700">Translate from</label>
          <select id="src" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className={`${field} font-semibold`}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name} — {l.native}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={swapLanguages}
          disabled={sourceLang === 'auto'}
          aria-label="Swap languages"
          title={sourceLang === 'auto' ? 'Choose a source language to swap' : 'Swap languages'}
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ink-300 bg-white text-ink-700 transition-colors hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-300 disabled:hover:text-ink-700"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
        <div>
          <label htmlFor="tgt" className="mb-1.5 block text-sm font-semibold text-ink-700">Translate to</label>
          <select id="tgt" value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className={`${field} font-semibold`}>
            {LANGUAGES.filter((l) => l.code !== 'auto').map((l) => (
              <option key={l.code} value={l.code}>{l.name} — {l.native}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* INPUT */}
        <section className={`${panel} space-y-5 p-5 sm:p-6`} aria-label="Input">
          <div className="inline-flex rounded-lg bg-ink-100 p-1" role="tablist">
            {([['audio', 'Voice', Mic], ['text', 'Text', Languages]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={inputMode === id}
                onClick={() => setInputMode(id)}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${inputMode === id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {inputMode === 'audio' ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 rounded-xl p-4 ${isRecording ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-ink-50'}`}>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                >
                  {isRecording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
                </button>
                <div className="min-w-0 flex-1">
                  {isRecording ? (
                    <>
                      <div className="vx-wave flex h-8 items-center overflow-hidden" aria-hidden>
                        {Array.from({ length: 24 }).map((_, i) => <span key={i} />)}
                      </div>
                      <p className="mt-1 font-mono text-sm text-ink-200">Recording {formatSeconds(recordingSeconds)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-semibold text-ink-900">Record from microphone</p>
                      <p className="text-sm text-ink-500">Speak clearly in your chosen language.</p>
                    </>
                  )}
                </div>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) acceptFile(f); }}
                className="flex flex-col items-center rounded-xl border-2 border-dashed border-ink-300 px-4 py-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/40"
              >
                <Upload className="h-5 w-5 text-ink-400" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-[15px] font-semibold text-brand-600 hover:text-brand-700">
                  Upload an audio file
                </button>
                <p className="text-sm text-ink-500">or drop it here · WAV, MP3, M4A up to 50 MB</p>
                <input ref={fileInputRef} type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac" onChange={handleFileDrop} className="hidden" />
              </div>

              {audioPreviewUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600"><FileAudio className="h-[18px] w-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{audioFile ? audioFile.name : 'Recorded audio'}</p>
                    <audio controls src={audioPreviewUrl} className="mt-1 h-8 w-full" />
                  </div>
                  <button type="button" onClick={clearAudio} aria-label="Remove audio" className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="txt" className="text-sm font-semibold text-ink-700">Text to translate</label>
                <span className="text-[13px] text-ink-400">{textInput.length} characters</span>
              </div>
              <textarea
                id="txt"
                rows={6}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type or paste a sentence in any supported language"
                className={`${field} resize-none text-base leading-relaxed`}
              />
            </div>
          )}

          <div>
            <label htmlFor="cmd" className="mb-1.5 block text-sm font-semibold text-ink-700">
              Instruction <span className="font-medium text-ink-400">(optional)</span>
            </label>
            <input
              id="cmd"
              type="text"
              value={commandPrompt}
              onChange={(e) => setCommandPrompt(e.target.value)}
              placeholder="e.g. Translate to Kannada and remove background noise"
              className={field}
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                { label: 'Hindi to Kannada', src: 'hi', tgt: 'kn' },
                { label: 'Gujarati to Kannada', src: 'gu', tgt: 'kn' },
                { label: 'English to Hindi', src: 'en', tgt: 'hi' },
                { label: 'Remove noise only', denoise: true },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (chip.src) setSourceLang(chip.src);
                    if (chip.tgt) setTargetLang(chip.tgt);
                    if (chip.denoise) setFilterNoise(true);
                    setCommandPrompt(`Translate to ${chip.tgt || 'Kannada'} and filter noise`);
                  }}
                  className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[13px] font-medium text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-600"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Switch on={filterNoise} set={setFilterNoise} label="Remove noise" hint="Clean the audio first" icon={<ShieldCheck className="h-4 w-4" />} />
            <Switch on={generateAudio} set={setGenerateAudio} label="Spoken output" hint="Generate translated audio" icon={<Volume2 className="h-4 w-4" />} />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isProcessing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-300"
          >
            {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Translating…</> : <><Wand2 className="h-4 w-4" /> Translate</>}
          </button>
        </section>

        {/* RESULT */}
        <section className={`${panel} space-y-5 p-5 sm:p-6 lg:sticky lg:top-20`} aria-label="Result" aria-live="polite">
          {!result ? (
            <div className="py-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <AudioLines className="h-5 w-5" />}
              </span>
              <h2 className="mt-4 text-lg font-bold">{isProcessing ? 'Working on your translation' : 'Your translation appears here'}</h2>
              <p className="mt-1 max-w-sm text-[15px] text-ink-500">
                {isProcessing ? 'This usually takes a few seconds, longer for long recordings.' : 'Add a voice recording or text, pick your languages, then select Translate.'}
              </p>
              <ol className="mt-5 space-y-2.5">
                {pipeline.map((p, i) => (
                  <li key={p} className="flex items-center gap-3 text-sm text-ink-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-300 text-xs font-semibold text-ink-500">{i + 1}</span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                    <CheckCircle2 className="h-4 w-4" /> Translation complete
                  </p>
                  <h2 className="mt-0.5 text-xl font-extrabold tracking-tight">
                    {result.source_lang_name} to {result.target_lang_name}
                  </h2>
                </div>
                <span className="font-mono text-xs text-ink-400">Job {result.job_id.slice(0, 8)}</span>
              </div>

              {result.has_output_audio && result.output_audio_url && (
                <div className="rounded-xl bg-ink-900 p-4 text-white">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="h-5 w-5 text-accent-500" />
                      <p className="text-[15px] font-semibold">Spoken in {result.target_lang_name}</p>
                    </div>
                    <a
                      href={result.output_audio_url}
                      download={`votex_${result.target_lang}_${result.job_id.slice(0, 8)}.mp3`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-ink-100"
                    >
                      <Download className="h-3.5 w-3.5" /> Download MP3
                    </a>
                  </div>
                  <audio controls src={result.output_audio_url} className="h-10 w-full" autoPlay />
                </div>
              )}

              <div className="space-y-3">
                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-700">Translation · {result.target_lang_name}</span>
                    <CopyBtn text={result.translated_text} kind="target" />
                  </div>
                  <p className="text-lg font-semibold leading-relaxed text-ink-900">{result.translated_text}</p>
                </div>
                <div className="rounded-xl border border-ink-200 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-700">Original · {result.source_lang_name}</span>
                    <CopyBtn text={result.source_text} kind="source" />
                  </div>
                  <p className="text-base leading-relaxed text-ink-700">{result.source_text}</p>
                </div>
              </div>

              {(result.has_original_audio || result.has_cleaned_audio) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.has_original_audio && result.original_audio_url && (
                    <div className="rounded-xl border border-ink-200 p-3">
                      <p className="mb-1.5 text-sm font-semibold text-ink-700">Original recording</p>
                      <audio controls src={result.original_audio_url} className="h-9 w-full" />
                    </div>
                  )}
                  {result.has_cleaned_audio && result.cleaned_audio_url && (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                      <p className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                        <ShieldCheck className="h-4 w-4" /> Noise removed
                      </p>
                      <audio controls src={result.cleaned_audio_url} className="h-9 w-full" />
                    </div>
                  )}
                </div>
              )}

              {result.steps && result.steps.length > 0 && (
                <div className="border-t border-ink-100 pt-4">
                  <p className="mb-2 text-sm font-semibold text-ink-700">Processing steps</p>
                  <ul className="flex flex-wrap gap-2">
                    {result.steps.map((st, i) => (
                      <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-[13px] font-medium text-ink-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" /> {st.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
