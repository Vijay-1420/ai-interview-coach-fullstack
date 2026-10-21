import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AudioLines,
  Bot,
  Check,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { ChatInterview, ChatInterviewMessage } from '../types';
import { formatDateTime } from '../utils/date';

interface SpeechAlternative {
  transcript: string;
}

interface SpeechResult extends ArrayLike<SpeechAlternative> {
  isFinal: boolean;
}

interface SpeechResultEvent {
  results: ArrayLike<SpeechResult>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoiceGender = 'female' | 'male';

const speechRecognition = (window as SpeechWindow).SpeechRecognition
  ?? (window as SpeechWindow).webkitSpeechRecognition;

const ChatInterview = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const invalidSessionId = !sessionId || !/^\d+$/.test(sessionId);
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatInterview | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceModeRef = useRef(false);
  const sendMessageRef = useRef<(message: string) => void>(() => undefined);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  useEffect(() => {
    if (invalidSessionId || !sessionId) return;

    let active = true;
    interviewApi.getChatInterview(Number(sessionId))
      .then((result) => {
        if (active) {
          setSession(result);
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError, 'Could not load this conversation.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      voiceModeRef.current = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, [invalidSessionId, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [session?.messages.length, sending]);

  const startListening = useCallback(() => {
    if (!voiceModeRef.current || !speechRecognition) return;

    const recognition = new speechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript?.trim();
      if (result?.isFinal && transcript) sendMessageRef.current(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error(event.error === 'not-allowed'
          ? 'Allow microphone access in your browser to use voice input.'
          : 'Voice input stopped. You can continue by typing.');
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      toast.error('Could not start voice input. Please try again.');
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Speech playback is not available in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceNamePattern = voiceGender === 'female'
      ? /\b(female|woman|samantha|victoria|aria|jenny|zira|karen|susan|ava|allison)\b/i
      : /\b(male|man|david|mark|guy|alex|daniel|george|james|andrew|tom)\b/i;
    const preferredVoice = availableVoices.find((voice) => voiceNamePattern.test(voice.name));
    const localVoice = availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(navigator.language.slice(0, 2).toLowerCase()));
    utterance.voice = preferredVoice ?? localVoice ?? availableVoices[0] ?? null;
    utterance.rate = 0.88;
    utterance.pitch = voiceGender === 'female' ? 1.08 : 0.96;
    utterance.volume = 0.88;
    utterance.onend = () => {
      if (voiceModeRef.current) window.setTimeout(startListening, 250);
    };
    window.speechSynthesis.speak(utterance);
  }, [availableVoices, startListening, voiceGender]);

  const sendMessage = useCallback(async (message: string) => {
    const content = message.trim();
    if (!session || !sessionId || !content || sending || session.status !== 'in_progress' || session.messages.filter((message) => message.role === 'user').length >= 30) return;

    setSending(true);
    setError(null);
    setDraft('');
    try {
      const updated = await interviewApi.sendChatMessage(Number(sessionId), content);
      setSession(updated);
      setAnswerFeedback(updated.answer_feedback ?? null);
      if (updated.answer_accepted === false) setDraft(content);
      if (voiceMode) {
        if (updated.answer_accepted === false && updated.answer_feedback) {
          speak(updated.answer_feedback);
        } else {
          const response = updated.messages.at(-1);
          if (response?.role === 'assistant') speak(response.content);
        }
      }
    } catch (requestError: unknown) {
      setDraft(content);
      setError(getApiErrorMessage(requestError, 'Your message could not be sent. Please try again.'));
    } finally {
      setSending(false);
    }
  }, [session, sessionId, sending, speak, voiceMode]);
  useEffect(() => {
    sendMessageRef.current = (message) => {
      void sendMessage(message);
    };
  }, [sendMessage]);

  const toggleVoiceMode = () => {
    if (voiceMode) {
      voiceModeRef.current = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
      setListening(false);
      setVoiceMode(false);
      return;
    }

    if (!speechRecognition && !('speechSynthesis' in window)) {
      toast.error('Voice features are not supported in this browser. You can continue by typing.');
    } else if (!speechRecognition) {
      toast('Voice input is not supported here. You can type answers and hear spoken replies.');
    } else if (!('speechSynthesis' in window)) {
      toast('Spoken replies are not supported here. You can still answer using your microphone.');
    }

    voiceModeRef.current = true;
    setVoiceMode(true);
    if (!availableVoices.some((voice) => (voiceGender === 'female'
      ? /\b(female|woman|samantha|victoria|aria|jenny|zira|karen|susan|ava|allison)\b/i
      : /\b(male|man|david|mark|guy|alex|daniel|george|james|andrew|tom)\b/i
    ).test(voice.name))) {
      toast('This browser has limited voice choices; using its closest available voice.');
    }
    const latestAssistant = [...(session?.messages ?? [])].reverse()
      .find((message) => message.role === 'assistant');
    if (latestAssistant && 'speechSynthesis' in window) {
      speak(latestAssistant.content);
    } else if (speechRecognition) {
      startListening();
    }
  };

  const toggleMicrophone = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (!speechRecognition) toast.error('Voice input is not supported in this browser. Try Chrome or Edge.');
    else startListening();
  };

  const finishInterview = async () => {
    if (!session || !sessionId || finishing) return;
    setFinishing(true);
    setError(null);
    try {
      setSession(await interviewApi.completeChatInterview(Number(sessionId)));
      setAnswerFeedback(null);
      recognitionRef.current?.abort();
      voiceModeRef.current = false;
      window.speechSynthesis?.cancel();
      setListening(false);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Could not create your interview review.'));
    } finally {
      setFinishing(false);
    }
  };

  const retry = () => {
    if (!sessionId || !/^\d+$/.test(sessionId)) return;
    setLoading(true);
    setError(null);
    interviewApi.getChatInterview(Number(sessionId))
      .then(setSession)
      .catch((requestError: unknown) => setError(getApiErrorMessage(requestError, 'Could not load this conversation.')))
      .finally(() => setLoading(false));
  };

  const renderMessage = (message: ChatInterviewMessage) => (
    <article
      key={message.id}
      className={`chat-message-enter flex items-end gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && (
        <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#174D3A] text-white shadow-[0_8px_20px_rgba(23,77,58,0.2)]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-[85%] sm:max-w-[76%] ${message.role === 'user' ? 'text-right' : ''}`}>
        <p className={`mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
          message.role === 'user' ? 'text-[#777B73]' : 'text-[#2E8B68]'
        }`}>
          {message.role === 'user' ? 'You' : 'Your interviewer'}
        </p>
        <div className={`rounded-[22px] px-4 py-3.5 text-sm leading-relaxed sm:px-5 ${
          message.role === 'user'
            ? 'rounded-br-md bg-[#174D3A] text-white shadow-[0_12px_25px_rgba(23,77,58,0.14)]'
            : 'rounded-bl-md border border-[#e9ebe5] bg-white text-[#343a35] shadow-[0_8px_25px_rgba(28,45,35,0.045)]'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <time className="mt-1.5 block px-1 text-[10px] text-[#989c94]">
          {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </time>
      </div>
      {message.role === 'user' && (
        <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#e9ebe5] bg-white text-xs font-bold text-[#174D3A]">
          You
        </div>
      )}
    </article>
  );

  if (invalidSessionId || (error && !session)) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Navbar />
        <main className="mx-auto max-w-xl px-6 pb-16 pt-32 text-center">
          <div className="rounded-3xl border border-[#E8E6DF] bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-[#282A27]">We couldn't open this chat</p>
            <p role="alert" className="mt-2 text-sm text-[#777B73]">{error ?? 'This interview link is not valid.'}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/interview/setup')}>Start a new interview</Button>
              {!invalidSessionId && <Button onClick={retry}>Try again</Button>}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return <main className="min-h-screen bg-[#FAF8F3] px-6 pt-24"><div className="mx-auto max-w-4xl"><LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#174D3A]" /></div></main>;
  }

  if (!session) return null;

  const completed = session.status === 'completed';
  const archived = session.status !== 'in_progress' && !completed;
  const atTurnLimit = session.messages.filter((message) => message.role === 'user').length >= 30;

  return (
    <div className="min-h-screen bg-[#f8f8f4]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/chat-interviews" className="inline-flex items-center gap-2 text-sm font-medium text-[#727971] transition hover:text-[#174D3A]">
            <ArrowLeft className="h-4 w-4" /> Chat history
          </Link>
          <div className="flex items-center gap-2">
            {session.status === 'in_progress' && <button
              type="button"
              onClick={toggleVoiceMode}
              aria-pressed={voiceMode}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                voiceMode
                  ? 'border-[#174D3A] bg-[#174D3A] text-white shadow-[0_8px_20px_rgba(23,77,58,0.18)]'
                  : 'border-[#e3e6df] bg-white text-[#425249] hover:border-[#2E8B68]'
              }`}
            >
              {voiceMode ? <AudioLines className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
              {voiceMode ? 'Voice on' : 'Try voice mode'}
            </button>}
            {session.status === 'in_progress' && (
              <Button size="sm" loading={finishing} onClick={finishInterview} icon={<Check className="h-4 w-4" />}>
                Finish & review
              </Button>
            )}
          </div>
        </div>

        <section className="grid min-h-[calc(100vh-11rem)] overflow-hidden rounded-[28px] border border-[#e7e9e2] bg-white shadow-[0_25px_80px_rgba(28,45,35,0.08)] lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-h-[68vh] flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-[#eff0eb] px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#174D3A] text-white shadow-[0_8px_20px_rgba(23,77,58,0.2)]">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#68c18e]" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-[#282A27] sm:text-base">Your AI interviewer</h1>
                  <p className="truncate text-xs text-[#81877e]">{session.job_role} · {session.interview_type}</p>
                </div>
              </div>
              <div className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold sm:flex ${
                archived ? 'bg-[#f3f3f0] text-[#777B73]' : 'bg-[#edf6ef] text-[#327151]'
              }`}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#45a36d]" />
                {completed ? 'Session reviewed' : archived ? 'Session archived' : 'Conversation saved'}
              </div>
            </header>

            <div className="chat-scrollbar flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(228,240,232,0.27),_transparent_55%)] px-4 py-6 sm:px-7 sm:py-8">
              <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-[#eceee8] bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#81877e]">
                <Clock3 className="h-3 w-3" /> {formatDateTime(session.created_at)}
              </div>
              {session.messages.map(renderMessage)}

              {sending && (
                <div className="chat-message-enter flex items-end gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#174D3A] text-white"><Bot className="h-4 w-4" /></div>
                  <div className="rounded-[20px] rounded-bl-md border border-[#e9ebe5] bg-white px-5 py-4">
                    <span className="sr-only">Interviewer is thinking</span>
                    <div className="typing-dots flex items-center gap-1.5"><i /><i /><i /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <p role="alert" className="border-t border-[#f4d9d2] bg-[#fff5f2] px-5 py-2.5 text-xs text-[#a54837]">
                {error}
              </p>
            )}

            {completed ? (
              <div className="border-t border-[#edf0ea] bg-[#fbfcf9] p-5 sm:px-7">
                <div className="rounded-2xl border border-[#dcebe0] bg-[#f1f8f2] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#327151]">Interview review</p>
                      <p className="mt-1 text-sm text-[#5f6a60]">Your full conversation is saved in chat history.</p>
                    </div>
                    {session.overall_score !== null && (
                      <div className="rounded-2xl bg-white px-4 py-2 text-center shadow-sm">
                        <span className="block text-2xl font-extrabold text-[#174D3A]">{session.overall_score.toFixed(1)}</span>
                        <span className="text-[10px] font-medium text-[#81877e]">/ 10</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#354139]">{session.review}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/interview/setup" className="rounded-xl bg-[#174D3A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#22664c]">Start another interview</Link>
                    <Link to="/chat-interviews" className="rounded-xl border border-[#dbe4db] bg-white px-4 py-2.5 text-xs font-semibold text-[#385744] transition hover:border-[#2E8B68]">All chat sessions</Link>
                  </div>
                </div>
              </div>
            ) : archived ? (
              <div className="border-t border-[#edf0ea] bg-[#fbfcf9] p-5 sm:px-7">
                <div className="rounded-2xl border border-[#e5e8e1] bg-white p-5">
                  <p className="text-sm font-bold text-[#374139]">This conversation was archived</p>
                  <p className="mt-1 text-sm text-[#777B73]">Your saved transcript is still available above. Start a new interview whenever you are ready.</p>
                  <Link to="/interview/setup" className="mt-4 inline-flex rounded-xl bg-[#174D3A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#22664c]">Start another interview</Link>
                </div>
              </div>
            ) : (
              <form
                className="border-t border-[#edf0ea] bg-white p-3 sm:p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(draft);
                }}
              >
                {voiceMode && (
                  <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#f3f7f3] px-4 py-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#3b6548]">
                      <AudioLines className={`h-4 w-4 ${listening ? 'animate-pulse text-[#2E8B68]' : ''}`} />
                      {listening ? 'Listening… speak naturally' : 'Voice mode is on · replies will be spoken'}
                    </div>
                    <div className="flex items-center gap-2">
                      {listening && <div className="voice-bars" aria-label="Microphone is listening"><i /><i /><i /><i /><i /><i /><i /></div>}
                      <label className="sr-only" htmlFor="voice-gender">Interviewer voice</label>
                      <select
                        id="voice-gender"
                        value={voiceGender}
                        onChange={(event) => setVoiceGender(event.target.value === 'male' ? 'male' : 'female')}
                        className="rounded-lg border border-[#dce7dd] bg-white px-2 py-1.5 text-[11px] font-medium text-[#3b6548] outline-none focus:border-[#8cb79a]"
                      >
                        <option value="female">Female voice</option>
                        <option value="male">Male voice</option>
                      </select>
                    </div>
                  </div>
                )}
                {answerFeedback && (
                  <p
                    role="status"
                    className={`mb-3 rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                      session.answer_accepted === false
                        ? 'border border-[#f0d5ce] bg-[#fff5f2] text-[#a54837]'
                        : 'border border-[#dcebe0] bg-[#f1f8f2] text-[#386348]'
                    }`}
                  >
                    {answerFeedback}
                  </p>
                )}
                <div className="flex items-end gap-2 rounded-[22px] border border-[#e5e9e1] bg-[#fbfcf9] p-2 shadow-[0_4px_15px_rgba(28,45,35,0.035)] transition focus-within:border-[#8cb79a] focus-within:shadow-[0_0_0_4px_rgba(46,139,104,0.08)]">
                  {voiceMode && (
                    <button
                      type="button"
                      onClick={toggleMicrophone}
                      disabled={sending || atTurnLimit}
                      aria-label={listening ? 'Stop voice recording' : 'Start voice recording'}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all ${
                        listening ? 'animate-pulse bg-[#fde8e4] text-[#c0624e]' : 'bg-white text-[#53665a] shadow-sm hover:bg-[#edf6ef]'
                      }`}
                    >
                      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(draft);
                      }
                    }}
                    maxLength={6000}
                    rows={2}
                    placeholder={voiceMode ? 'Or type your answer here…' : 'Share your answer… (Enter to send)'}
                    aria-label="Your answer"
                    className="max-h-36 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-relaxed text-[#29352c] outline-none placeholder:text-[#a0a69e]"
                    disabled={sending || atTurnLimit}
                  />
                  {voiceMode && 'speechSynthesis' in window && (
                    <button
                      type="button"
                      onClick={() => window.speechSynthesis.cancel()}
                      aria-label="Stop spoken response"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[#81877e] transition hover:bg-[#f0f2ed] hover:text-[#174D3A]"
                    >
                      {window.speechSynthesis.speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending || atTurnLimit}
                    aria-label="Send answer"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#174D3A] text-white shadow-[0_6px_15px_rgba(23,77,58,0.16)] transition hover:-translate-y-0.5 hover:bg-[#22664c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-[#9a9f97]">
                  <MessageSquareText className="mr-1 inline h-3 w-3" />
                  Your conversation saves automatically · {atTurnLimit ? 'Reply limit reached · finish for your review' : 'Up to 30 replies per session'}
                </p>
              </form>
            )}
          </div>

          <aside className="hidden border-l border-[#edf0ea] bg-[#fbfcf9] p-6 lg:flex lg:flex-col">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#657166]">
              <Sparkles className="h-4 w-4 text-[#2E8B68]" /> Session details
            </div>
            <div className="mb-6 rounded-2xl border border-[#e9eee7] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#92988f]">Target role</p>
              <p className="mt-1.5 text-sm font-bold text-[#29352c]">{session.job_role}</p>
              <p className="mt-1 text-xs text-[#81877e]">{session.experience_level} · {session.difficulty}</p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#92988f]">A little interview magic</p>
              {[
                'It’s a conversation, not a quiz. Take a moment to think.',
                'Use a real example and explain what you personally did.',
                'Ask for clarification whenever you need it.',
              ].map((tip, index) => (
                <div key={tip} className="flex gap-3 rounded-2xl border border-[#e9eee7] bg-white p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#e7f2e9] text-[10px] font-bold text-[#327151]">0{index + 1}</span>
                  <p className="text-xs leading-relaxed text-[#687268]">{tip}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto rounded-2xl bg-[#174D3A] p-4 text-white">
              <p className="text-xs font-bold">Private by design</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/70">Your transcript is saved to your local interview history so you can revisit and learn from it.</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ChatInterview;
