import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Download,
  Volume2,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  Sliders,
  Square,
  SkipForward,
  SkipBack,
  Search,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import {
  INITIAL_SCRIPT_SEGMENTS,
  ScriptSegment,
  countWords,
  formatSecondsToMMSS,
} from './data/scriptData';
import {
  GeneratedClip,
  createBlobUrlFromWavBase64,
  buildContinuousMasterWav,
  buildTimelineSyncedMasterWav,
  buildSrtContent,
  triggerDownload,
} from './utils/audioExport';

interface VoiceOption {
  id: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  name: string;
  register: string;
  description: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    register: 'Tenor · Energetic Storyteller',
    description: 'Natural, expressive YouTube Manhwa narrator with crisp comedic and dramatic timing.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    register: 'Baritone · Cinematic & Calm',
    description: 'Deep, composed narrative voice suited for dramatic flashbacks and dry humor.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    register: 'Mezzo · Clear & Articulate',
    description: 'Bright, poised delivery ideal for romance-comedy pacing and inner monologues.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    register: 'Bass-Baritone · Intense',
    description: 'Commanding, punchy vocal presence for high-tension confrontations.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    register: 'Warm · Conversational',
    description: 'Smooth, relaxed storytelling cadence that keeps long-form retention high.',
  },
];

const ACTS = [
  'All Acts',
  'Act I · Double Rebirth',
  'Act II · Breaking Free from the Past',
  'Act III · Classroom Hand-Holding & Notes',
  'Act IV · Lunch Date & Dark History Exposed',
  'Act V · Convenience Store Showdown',
  'Act VI · Mock Exam Challenge & One-on-One Tutoring',
];

export default function App() {
  const [segments, setSegments] = useState<ScriptSegment[]>(INITIAL_SCRIPT_SEGMENTS);
  const [clips, setClips] = useState<Record<string, GeneratedClip>>({});
  const [loadingById, setLoadingById] = useState<Record<string, boolean>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  // Voice & Model Settings
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption['id']>('Puck');
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts'
  >('gemini-3.8-flash-lite-tts');
  const [stylePrompt, setStylePrompt] = useState<string>(
    'Engaging, natural YouTube Manhwa explanation narrator. Conversational pacing around 150 words per minute, expressive during comedy and dramatic reveals.'
  );

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'studio' | 'voice' | 'script'>('studio');
  const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'pending'>('all');
  const [selectedAct, setSelectedAct] = useState<string>('All Acts');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<string>('');

  // Batch Generation Queue State
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchCurrentId, setBatchCurrentId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  });
  const stopBatchRef = useRef<boolean>(false);

  // Audio Player State
  const [activeSegmentId, setActiveSegmentId] = useState<string>('seg-01');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Global Script Metrics
  const metrics = useMemo(() => {
    const totalWords = segments.reduce((acc, s) => acc + countWords(s.text), 0);
    const generatedList = Object.values(clips);
    const generatedCount = generatedList.length;
    const totalGeneratedDuration = generatedList.reduce(
      (acc, c) => acc + c.durationSeconds,
      0
    );
    const estimatedTotalDuration = Math.round((totalWords / 150) * 60);
    return {
      totalWords,
      generatedCount,
      totalSegments: segments.length,
      totalGeneratedDuration,
      estimatedTotalDuration,
    };
  }, [segments, clips]);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    return segments.filter((seg) => {
      if (selectedAct !== 'All Acts' && seg.act !== selectedAct) return false;
      const hasClip = Boolean(clips[seg.id]);
      if (statusFilter === 'generated' && !hasClip) return false;
      if (statusFilter === 'pending' && hasClip) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          seg.sceneTitle.toLowerCase().includes(q) ||
          seg.text.toLowerCase().includes(q) ||
          seg.timestampRange.includes(q)
        );
      }
      return true;
    });
  }, [segments, clips, selectedAct, statusFilter, searchQuery]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Generate TTS for a single segment
  const generateSegmentAudio = async (segment: ScriptSegment): Promise<boolean> => {
    setLoadingById((prev) => ({ ...prev, [segment.id]: true }));
    setErrorById((prev) => {
      const next = { ...prev };
      delete next[segment.id];
      return next;
    });

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: segment.text,
          voiceName: selectedVoice,
          style: stylePrompt,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioWavBase64) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const blobUrl = createBlobUrlFromWavBase64(data.audioWavBase64);

      setClips((prev) => {
        if (prev[segment.id]?.blobUrl) {
          URL.revokeObjectURL(prev[segment.id].blobUrl);
        }
        return {
          ...prev,
          [segment.id]: {
            segmentId: segment.id,
            wavBase64: data.audioWavBase64,
            blobUrl,
            durationSeconds: data.durationSeconds,
            sampleRate: data.sampleRate || 24000,
            voiceName: selectedVoice,
            generatedAt: Date.now(),
          },
        };
      });

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setErrorById((prev) => ({ ...prev, [segment.id]: msg }));
      return false;
    } finally {
      setLoadingById((prev) => ({ ...prev, [segment.id]: false }));
    }
  };

  // Batch Generate Pending Segments
  const startBatchGeneration = async (targetSegments?: ScriptSegment[]) => {
    if (isBatchRunning) return;
    const queue = (targetSegments || segments).filter((s) => !clips[s.id]);
    if (queue.length === 0) return;

    stopBatchRef.current = false;
    setIsBatchRunning(true);
    setBatchProgress({ completed: 0, total: queue.length });

    let completedCount = 0;
    for (const seg of queue) {
      if (stopBatchRef.current) break;
      setBatchCurrentId(seg.id);
      const ok = await generateSegmentAudio(seg);
      if (ok) {
        completedCount += 1;
        setBatchProgress({ completed: completedCount, total: queue.length });
      } else {
        // Brief pause on error before continuing or stopping if quota hit
        await new Promise((r) => setTimeout(r, 1500));
      }
      // Small polite delay between sequential TTS requests
      if (!stopBatchRef.current) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    setBatchCurrentId(null);
    setIsBatchRunning(false);
  };

  const stopBatchGeneration = () => {
    stopBatchRef.current = true;
    setIsBatchRunning(false);
    setBatchCurrentId(null);
  };

  // Play a specific segment's generated WAV
  const playSegment = (segmentId: string) => {
    window.speechSynthesis?.cancel();
    setIsBrowserSpeaking(false);

    const clip = clips[segmentId];
    setActiveSegmentId(segmentId);
    if (!clip || !audioRef.current) return;

    if (audioRef.current.src !== clip.blobUrl) {
      audioRef.current.src = clip.blobUrl;
      audioRef.current.playbackRate = playbackRate;
    }
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    const activeClip = clips[activeSegmentId];
    if (!activeClip) {
      // Find first generated clip
      const firstGenerated = segments.find((s) => Boolean(clips[s.id]));
      if (firstGenerated) {
        playSegment(firstGenerated.id);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src !== activeClip.blobUrl) {
        audioRef.current.src = activeClip.blobUrl;
        audioRef.current.playbackRate = playbackRate;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Browser Web Speech API instant preview
  const speakWithBrowserTts = (segment: ScriptSegment) => {
    if (!('speechSynthesis' in window)) return;
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (isBrowserSpeaking && activeSegmentId === segment.id) {
      window.speechSynthesis.cancel();
      setIsBrowserSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    setActiveSegmentId(segment.id);
    const cleanText = segment.text.replace(/\[.*?\]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = playbackRate;
    utterance.onend = () => setIsBrowserSpeaking(false);
    utterance.onerror = () => setIsBrowserSpeaking(false);
    setIsBrowserSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Audio Element Events
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (!autoAdvance) return;

    const currentIndex = segments.findIndex((s) => s.id === activeSegmentId);
    if (currentIndex >= 0 && currentIndex < segments.length - 1) {
      for (let i = currentIndex + 1; i < segments.length; i++) {
        const nextSeg = segments[i];
        if (clips[nextSeg.id]) {
          playSegment(nextSeg.id);
          return;
        }
      }
    }
  };

  const skipSegment = (direction: -1 | 1) => {
    const idx = segments.findIndex((s) => s.id === activeSegmentId);
    const nextIdx = Math.min(segments.length - 1, Math.max(0, idx + direction));
    const target = segments[nextIdx];
    if (!target) return;
    setActiveSegmentId(target.id);
    if (clips[target.id]) {
      playSegment(target.id);
    }
  };

  // Export Handlers
  const handleExportTimelineWav = () => {
    const { blob, includedCount } = buildTimelineSyncedMasterWav(segments, clips, 24000);
    if (includedCount === 0) return;
    triggerDownload(
      blob,
      `manhwa-voiceover-timeline-synced-26m48s-${selectedVoice.toLowerCase()}.wav`
    );
  };

  const handleExportContinuousWav = () => {
    const { blob, includedCount } = buildContinuousMasterWav(segments, clips, 0.25, 24000);
    if (includedCount === 0) return;
    triggerDownload(
      blob,
      `manhwa-voiceover-continuous-${selectedVoice.toLowerCase()}.wav`
    );
  };

  const handleExportSrt = () => {
    const srt = buildSrtContent(segments, clips);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, 'manhwa-explanation-26m48s.srt');
  };

  const handleExportScriptTxt = () => {
    const header = [
      'VIDEO LENGTH: 26:48',
      'TARGET WPM: approximately 150',
      `TOTAL WORD COUNT: ${metrics.totalWords} words`,
      '',
      '==================================================',
      '',
    ].join('\n');

    const body = segments
      .map(
        (s) =>
          `### [${s.timestampRange}] ${s.sceneTitle}\n${
            s.pauseNote ? `[${s.pauseNote}]\n\n` : ''
          }${s.text}\n`
      )
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, 'manhwa-explanation-script-26m48s.txt');
  };

  // Editing handlers
  const startEditing = (seg: ScriptSegment) => {
    setEditingSegmentId(seg.id);
    setEditBuffer(seg.text);
  };

  const saveEditing = (segId: string) => {
    if (!editBuffer.trim()) return;
    setSegments((prev) =>
      prev.map((s) => (s.id === segId ? { ...s, text: editBuffer.trim() } : s))
    );
    setEditingSegmentId(null);
  };

  const resetSegmentText = (segId: string) => {
    const original = INITIAL_SCRIPT_SEGMENTS.find((s) => s.id === segId);
    if (!original) return;
    setSegments((prev) =>
      prev.map((s) => (s.id === segId ? { ...s, text: original.text } : s))
    );
    setEditingSegmentId(null);
  };

  const activeSegment =
    segments.find((s) => s.id === activeSegmentId) || segments[0];
  const activeClip = clips[activeSegment.id];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Hidden Master Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('studio');
          }}
          className="font-display text-2xl tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Manhwa Vox Studio
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('studio')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeTab === 'studio'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Timeline Studio
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeTab === 'voice'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Voice & Pacing Config
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeTab === 'script'
                ? 'text-white underline underline-offset-8 decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Full Script Reader
          </button>
          <button
            onClick={handleExportSrt}
            className="hover:text-white transition-colors whitespace-nowrap py-1"
          >
            Export Subtitles (.SRT)
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportTimelineWav}
            disabled={metrics.generatedCount === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export 26:48 Master WAV ({metrics.generatedCount}/38)</span>
          </button>

          {isBatchRunning ? (
            <button
              onClick={stopBatchGeneration}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>
                Stop Batch ({batchProgress.completed}/{batchProgress.total})
              </span>
            </button>
          ) : (
            <button
              onClick={() => startBatchGeneration()}
              disabled={metrics.generatedCount === segments.length}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-40"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                {metrics.generatedCount === 0
                  ? 'Generate All 38 Segments'
                  : `Generate Remaining (${segments.length - metrics.generatedCount})`}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Studio Summary & Interactive Timeline Scrubber */}
        <section className="border border-slate-800/90 bg-[#0f1523] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mb-1">
                <span>Yunan High School Rebirth Manhwa</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">Video Duration 26:48</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{metrics.totalWords} Words</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">Target 150 WPM</span>
              </div>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Synchronized Voiceover Production Deck
              </h1>
            </div>

            {/* Quick Voice Selector & Export Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5">
                <span className="text-slate-400">Narrator Voice:</span>
                <select
                  value={selectedVoice}
                  onChange={(e) =>
                    setSelectedVoice(e.target.value as VoiceOption['id'])
                  }
                  className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                      {v.name} ({v.register.split('·')[1]?.trim()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportContinuousWav}
                disabled={metrics.generatedCount === 0}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/60 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Download Continuous WAV
              </button>

              <button
                onClick={handleExportScriptTxt}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Script (.TXT)</span>
              </button>
            </div>
          </div>

          {/* 38-Segment Visual Timeline Map */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
              <span>00:00 · Timeline Segment Map (Click any block to inspect or play)</span>
              <span>
                {metrics.generatedCount} of {metrics.totalSegments} segments rendered ·{' '}
                {formatSecondsToMMSS(metrics.totalGeneratedDuration)} audio ready
              </span>
              <span>26:48</span>
            </div>

            <div className="grid grid-cols-38 gap-1 h-7 w-full bg-[#090d16] p-1 rounded-lg border border-slate-800/80">
              {segments.map((seg) => {
                const isGen = Boolean(clips[seg.id]);
                const isLoad = Boolean(loadingById[seg.id]);
                const isErr = Boolean(errorById[seg.id]);
                const isSelected = activeSegmentId === seg.id;

                let barColor = 'bg-slate-800 hover:bg-slate-700';
                if (isLoad) barColor = 'bg-amber-400/80 animate-pulse';
                else if (isErr) barColor = 'bg-rose-500/80';
                else if (isGen) barColor = 'bg-emerald-500/85 hover:bg-emerald-400';

                return (
                  <button
                    key={seg.id}
                    onClick={() => {
                      setActiveSegmentId(seg.id);
                      if (clips[seg.id]) playSegment(seg.id);
                    }}
                    title={`#${seg.index} [${seg.timestampRange}] ${seg.sceneTitle}`}
                    className={`h-full rounded-xs transition-all ${barColor} ${
                      isSelected ? 'ring-2 ring-white scale-y-110 z-10' : ''
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Tab 1: Timeline Studio */}
        {activeTab === 'studio' && (
          <div className="flex flex-col gap-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-[#0f1523] border border-slate-800 rounded-lg">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Segments ({segments.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('generated')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      statusFilter === 'generated'
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Generated ({metrics.generatedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      statusFilter === 'pending'
                        ? 'bg-slate-800 text-amber-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pending ({segments.length - metrics.generatedCount})
                  </button>
                </div>

                {/* Act Filter Dropdown */}
                <select
                  value={selectedAct}
                  onChange={(e) => setSelectedAct(e.target.value)}
                  className="bg-[#0f1523] border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-600"
                >
                  {ACTS.map((act) => (
                    <option key={act} value={act} className="bg-slate-900">
                      {act}
                    </option>
                  ))}
                </select>

                {selectedAct !== 'All Acts' && !isBatchRunning && (
                  <button
                    onClick={() => startBatchGeneration(filteredSegments)}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors whitespace-nowrap"
                  >
                    Generate This Act
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[260px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search timestamp, character, or scene..."
                  className="w-full bg-[#0f1523] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            {/* Segment List */}
            <div className="border border-slate-800/90 rounded-xl bg-[#0f1523] divide-y divide-slate-800/80">
              {filteredSegments.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-400 mb-3">
                    No script segments match the current filter criteria.
                  </p>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setSelectedAct('All Acts');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredSegments.map((seg) => {
                  const clip = clips[seg.id];
                  const isLoading = Boolean(loadingById[seg.id]);
                  const err = errorById[seg.id];
                  const words = countWords(seg.text);
                  const isCurrent = activeSegmentId === seg.id;
                  const isEditing = editingSegmentId === seg.id;

                  return (
                    <div
                      key={seg.id}
                      className={`p-5 transition-colors ${
                        isCurrent ? 'bg-slate-800/35' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left Column: Metadata & Script Prose */}
                        <div className="flex-1 min-w-0">
                          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5 font-mono-tabular">
                            <span className="text-amber-400 font-semibold">
                              #{String(seg.index).padStart(2, '0')} · [{seg.timestampRange}]
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans text-slate-300 font-medium">
                              {seg.sceneTitle}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans text-slate-500">{seg.act}</span>
                            <span aria-hidden="true">·</span>
                            <span>{words} words</span>
                            <span aria-hidden="true">·</span>
                            <span>Target {seg.targetDurationSeconds}s</span>
                            {clip && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-400">
                                  Actual {clip.durationSeconds}s ({clip.voiceName})
                                </span>
                              </>
                            )}
                          </div>

                          {seg.pauseNote && (
                            <p className="text-xs font-mono-tabular text-amber-300/90 mb-2">
                              Cue: [{seg.pauseNote}]
                            </p>
                          )}

                          {isEditing ? (
                            <div className="mt-2 flex flex-col gap-2">
                              <textarea
                                value={editBuffer}
                                onChange={(e) => setEditBuffer(e.target.value)}
                                rows={4}
                                className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-3 text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-amber-400"
                              />
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-mono-tabular">
                                  {countWords(editBuffer)} words · Est.{' '}
                                  {Math.round((countWords(editBuffer) / 150) * 60)}s at 150 WPM
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => resetSegmentText(seg.id)}
                                    className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset Default</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingSegmentId(null)}
                                    className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEditing(seg.id)}
                                    className="px-3 py-1.5 rounded bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400"
                                  >
                                    Save Text
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[15px] text-slate-200 leading-[1.65] max-w-[75ch]">
                              {seg.text}
                            </p>
                          )}

                          {err && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{err}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Generation & Playback Controls */}
                        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
                          {/* Instant Browser Voice Preview */}
                          <button
                            onClick={() => speakWithBrowserTts(seg)}
                            title="Instant Browser Voice Preview"
                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                              isBrowserSpeaking && activeSegmentId === seg.id
                                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>
                              {isBrowserSpeaking && activeSegmentId === seg.id
                                ? 'Stop Preview'
                                : 'Quick Preview'}
                            </span>
                          </button>

                          {/* Edit Script Button */}
                          {!isEditing && (
                            <button
                              onClick={() => startEditing(seg)}
                              title="Edit narration text"
                              className="p-2 text-xs text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/60 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Play & Download if Generated */}
                          {clip && (
                            <>
                              <button
                                onClick={() => {
                                  if (isCurrent && isPlaying) {
                                    togglePlayPause();
                                  } else {
                                    playSegment(seg.id);
                                  }
                                }}
                                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors whitespace-nowrap flex items-center gap-1.5"
                              >
                                {isCurrent && isPlaying ? (
                                  <>
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                    <span>Pause</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>Play WAV</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={clip.blobUrl}
                                download={`segment-${String(seg.index).padStart(2, '0')}-${seg.startTimeStr.replace(':', 'm')}s.wav`}
                                className="p-2 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                                title="Download Segment WAV"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}

                          {/* Generate / Regenerate Gemini AI Audio Button */}
                          <button
                            onClick={() => generateSegmentAudio(seg)}
                            disabled={isLoading}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                              clip
                                ? 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            } disabled:opacity-50`}
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Synthesizing...</span>
                              </>
                            ) : clip ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Regenerate</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Generate AI Audio</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Voice & Pacing Config */}
        {activeTab === 'voice' && (
          <div className="border border-slate-800/90 rounded-xl bg-[#0f1523] p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Gemini Speech Synthesis & Narrator Configuration
              </h2>
              <p className="text-sm text-slate-400">
                Select a prebuilt voice persona and customize the director prompt used when generating 24kHz WAV voiceover segments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {VOICE_OPTIONS.map((v) => {
                const active = selectedVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      active
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 bg-[#090d16] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-base font-semibold text-white mb-0.5">
                        {v.name}
                      </div>
                      <div className="text-xs text-amber-400/90 mb-2">{v.register}</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {v.description}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-slate-300">
                      {active ? 'Selected Narrator' : 'Select Voice'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800/80">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Gemini TTS Model Engine
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) =>
                    setSelectedModel(
                      e.target.value as
                        | 'gemini-3.8-flash-lite-tts'
                        | 'gemini-3.8-flash-tts'
                    )
                  }
                  className="bg-[#090d16] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="gemini-3.8-flash-lite-tts">
                    gemini-3.8-flash-lite-tts (High-Speed & Low-Latency Narrator)
                  </option>
                  <option value="gemini-3.8-flash-tts">
                    gemini-3.8-flash-tts (Expressive Screenplay & Vocal Bursts)
                  </option>
                </select>
                <p className="text-xs text-slate-400">
                  Use <span className="font-mono-tabular">gemini-3.8-flash-lite-tts</span> for fast batch generation across all 38 segments, or <span className="font-mono-tabular">gemini-3.8-flash-tts</span> when adding custom vocal bursts such as <span className="font-mono-tabular">&lt;laugh&gt;</span>, <span className="font-mono-tabular">&lt;gasp&gt;</span>, or <span className="font-mono-tabular">&lt;breath&gt;</span>.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Narrator Style & Pacing Instruction
                </label>
                <textarea
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  rows={3}
                  className="bg-[#090d16] border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Full Script Reader */}
        {activeTab === 'script' && (
          <div className="border border-slate-800/90 rounded-xl bg-[#0f1523] p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Complete 26:48 Timestamped Manhwa Script
                </h2>
                <p className="text-xs text-slate-400 font-mono-tabular mt-0.5">
                  38 Segments · {metrics.totalWords} Words · Target 150 WPM · Synchronized to 00:00–26:48
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportScriptTxt}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Download .TXT Script
                </button>
                <button
                  onClick={handleExportSrt}
                  className="px-4 py-2 text-xs font-semibold border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Download .SRT Subtitles
                </button>
              </div>
            </div>

            <div className="space-y-6 max-w-[75ch]">
              {segments.map((seg) => (
                <div key={seg.id} className="space-y-1.5">
                  <div className="text-xs font-mono-tabular text-amber-400 font-semibold">
                    ### [{seg.timestampRange}] · {seg.sceneTitle}
                  </div>
                  {seg.pauseNote && (
                    <div className="text-xs font-mono-tabular text-slate-400">
                      [{seg.pauseNote}]
                    </div>
                  )}
                  <p className="text-[15px] text-slate-200 leading-[1.7]">{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Audio Transport Deck */}
      <footer className="sticky bottom-0 z-30 bg-[#090d16]/95 backdrop-blur border-t border-slate-800 px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Active Segment Info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => skipSegment(-1)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Previous Segment"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={!activeClip && metrics.generatedCount === 0}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-colors shrink-0"
              title="Play / Pause Generated Audio"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skipSegment(1)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Next Segment"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="text-xs font-mono-tabular text-amber-400 truncate">
                #{String(activeSegment.index).padStart(2, '0')} [{activeSegment.timestampRange}] ·{' '}
                {activeSegment.sceneTitle}
              </div>
              <div className="text-xs text-slate-400 truncate max-w-md">
                {activeClip
                  ? `Playing ${activeClip.voiceName} WAV · ${formatSecondsToMMSS(
                      currentTime
                    )} / ${formatSecondsToMMSS(audioDuration || activeClip.durationSeconds)}`
                  : 'Click "Generate AI Audio" or "Quick Preview" on any segment to listen'}
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4 shrink-0 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <span>Auto-Advance</span>
            </label>

            <div className="flex items-center gap-1.5 text-slate-400">
              <Sliders className="w-3.5 h-3.5" />
              <span>Speed:</span>
              {[0.95, 1.0, 1.05, 1.1].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  className={`px-2 py-1 rounded font-mono-tabular ${
                    playbackRate === rate
                      ? 'bg-slate-800 text-amber-400 font-semibold'
                      : 'hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
