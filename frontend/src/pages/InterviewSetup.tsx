import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  ArrowRight,
  Code2,
  Users,
  Brain,
  Shuffle,
  AlertCircle,
  MessageSquareText,
  Sparkles,
  Mic,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { StartChatInterviewRequest, StartInterviewRequest } from '../types';

type InterviewType = 'Technical' | 'HR' | 'Behavioral' | 'Mixed';
type ExperienceLevel = 'Junior' | 'Mid' | 'Senior';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type PracticeMode = 'guided' | 'chat';

const typeOptions: { value: InterviewType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: 'Technical', label: 'Role knowledge', icon: <Code2 className="w-5 h-5" />, desc: 'Practical knowledge for your chosen profession', color: 'border-[#EAE5F7] bg-[#EAE5F7]/50 text-[#5b4b8a]' },
  { value: 'HR', label: 'HR', icon: <Users className="w-5 h-5" />, desc: 'Culture fit, motivations, career goals', color: 'border-[#E4F0E8] bg-[#E4F0E8]/50 text-[#174D3A]' },
  { value: 'Behavioral', label: 'Behavioral', icon: <Brain className="w-5 h-5" />, desc: 'STAR-method, situational questions', color: 'border-[#fde8e4] bg-[#fde8e4]/50 text-[#c0624e]' },
  { value: 'Mixed', label: 'Role-focused mix', icon: <Shuffle className="w-5 h-5" />, desc: 'Role knowledge, realistic scenarios, and communication', color: 'border-[#FAF8F3] bg-[#FAF8F3] text-[#777B73]' },
];

const roleExamples = [
  'Software Engineer',
  'Bank PO',
  'Civil Services (UPSC)',
  'Registered Nurse',
  'Teacher',
  'Sales Executive',
  'Mechanical Engineer',
  'Operations Manager',
];

const experienceLevels: ExperienceLevel[] = ['Junior', 'Mid', 'Senior'];
const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const interviewTypes: InterviewType[] = ['Technical', 'HR', 'Behavioral', 'Mixed'];

const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('guided');

  const [form, setForm] = useState<{
    job_role: string;
    experience_level: ExperienceLevel;
    interview_type: InterviewType;
    difficulty: Difficulty;
    num_questions: number;
    job_description: string;
  }>({
    job_role: '',
    experience_level: 'Mid',
    interview_type: interviewTypes.includes(searchParams.get('type') as InterviewType)
      ? searchParams.get('type') as InterviewType
      : 'Mixed',
    difficulty: 'Medium',
    num_questions: 5,
    job_description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.job_role.trim()) errs.job_role = 'Please enter a target job role.';
    if (form.job_role.trim().length > 120) errs.job_role = 'Keep the role name under 120 characters.';
    if (form.num_questions < 1 || form.num_questions > 10) errs.num_questions = 'Questions must be between 1 and 10.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors({});
    setLoading(true);
    setError(null);

    try {
      if (practiceMode === 'chat') {
        const payload: StartChatInterviewRequest = {
          job_role: form.job_role.trim(),
          experience_level: form.experience_level,
          interview_type: form.interview_type,
          difficulty: form.difficulty,
          job_description: form.job_description.trim() || undefined,
        };
        const session = await interviewApi.startChatInterview(payload);
        navigate(`/chat-interview/${session.id}`);
      } else {
        const payload: StartInterviewRequest = {
          job_role: form.job_role.trim(),
          experience_level: form.experience_level,
          interview_type: form.interview_type,
          difficulty: form.difficulty,
          num_questions: form.num_questions,
          job_description: form.job_description.trim() || undefined,
        };
        const session = await interviewApi.startInterview(payload);
        navigate(`/interview/${session.session_id}`, { state: { session } });
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not start this interview.'));
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = (name: string) =>
    `w-full px-4 py-3 border ${validationErrors[name] ? 'border-[#E98B78]' : 'border-[#E8E6DF]'} rounded-xl text-sm text-[#282A27] bg-white focus:outline-none focus:ring-2 focus:ring-[#174D3A]/30 focus:border-[#174D3A] transition placeholder:text-[#aaa]`;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#E4F0E8] text-[#174D3A] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            Interview Setup
          </div>
          <h1 className="text-3xl font-bold text-[#282A27] mb-2">Configure your interview</h1>
          <p className="text-[#777B73]">Tell us what you're preparing for and we'll generate the perfect questions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <section aria-label="Interview format" className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPracticeMode('guided')}
              aria-pressed={practiceMode === 'guided'}
              className={`feature-card rounded-2xl border p-5 text-left transition-all ${
                practiceMode === 'guided'
                  ? 'border-[#174D3A] bg-[#E4F0E8]/75 shadow-[0_12px_35px_rgba(23,77,58,0.09)]'
                  : 'border-[#E8E6DF] bg-white hover:-translate-y-1 hover:border-[#2E8B68]/50'
              }`}
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#174D3A] shadow-sm">
                <Briefcase className="h-5 w-5" />
              </span>
              <span className="block text-sm font-bold text-[#282A27]">Guided practice</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#777B73]">
                One focused question at a time with instant feedback after every answer.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPracticeMode('chat')}
              aria-pressed={practiceMode === 'chat'}
              className={`feature-card rounded-2xl border p-5 text-left transition-all ${
                practiceMode === 'chat'
                  ? 'border-[#174D3A] bg-[#EAE5F7]/60 shadow-[0_12px_35px_rgba(91,75,138,0.1)]'
                  : 'border-[#E8E6DF] bg-white hover:-translate-y-1 hover:border-[#5b4b8a]/40'
              }`}
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#5b4b8a] shadow-sm">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-[#282A27]">
                AI conversation
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5b4b8a]">
                  <Sparkles className="h-3 w-3" /> Natural chat
                </span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[#777B73]">
                A one-on-one AI interviewer that listens, follows up, and reviews your whole conversation.
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5b4b8a]">
                <Mic className="h-3.5 w-3.5" /> Voice mode available inside the chat
              </span>
            </button>
          </section>

          {/* Job Role */}
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6">
            <label className="block text-sm font-semibold text-[#282A27] mb-1">
              Target Job Role <span className="text-[#E98B78]">*</span>
            </label>
            <p className="text-xs text-[#777B73] mb-3">
              Questions adapt to the exact job and sector, including banking, government exams, healthcare, education, and IT.
            </p>
            <input
              type="text"
              maxLength={120}
              placeholder="e.g. Bank PO, Civil Services candidate, Nurse, Software Engineer..."
              value={form.job_role}
              onChange={(e) => setForm((f) => ({ ...f, job_role: e.target.value }))}
              className={fieldCls('job_role')}
            />
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Popular job role examples">
              {roleExamples.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, job_role: role }))}
                  className="rounded-full border border-[#e8e6df] bg-[#FAF8F3] px-3 py-1.5 text-[11px] font-medium text-[#687268] transition hover:border-[#8cb79a] hover:bg-[#edf6ef] hover:text-[#174D3A]"
                >
                  {role}
                </button>
              ))}
            </div>
            {validationErrors.job_role && (
              <p className="text-xs text-[#c0624e] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{validationErrors.job_role}
              </p>
            )}
          </div>

          {/* Interview Type */}
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6">
            <label className="block text-sm font-semibold text-[#282A27] mb-1">Interview Type</label>
            <p className="text-xs text-[#777B73] mb-4">What kind of questions do you want to practice?</p>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, interview_type: opt.value }))}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.interview_type === opt.value
                      ? 'border-[#174D3A] bg-[#E4F0E8]'
                      : 'border-[#E8E6DF] bg-white hover:border-[#174D3A]/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    form.interview_type === opt.value ? 'bg-[#174D3A] text-white' : opt.color
                  }`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${form.interview_type === opt.value ? 'text-[#174D3A]' : 'text-[#282A27]'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-[#777B73] mt-0.5 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E6DF] p-5">
              <label className="block text-sm font-semibold text-[#282A27] mb-3">Experience Level</label>
              <div className="flex flex-col gap-2">
                {experienceLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, experience_level: level }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                      form.experience_level === level
                        ? 'bg-[#174D3A] text-white'
                        : 'bg-[#FAF8F3] text-[#777B73] hover:bg-[#E4F0E8] hover:text-[#174D3A]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E6DF] p-5">
              <label className="block text-sm font-semibold text-[#282A27] mb-3">Difficulty</label>
              <div className="flex flex-col gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                      form.difficulty === d
                        ? d === 'Easy' ? 'bg-[#E4F0E8] text-[#174D3A]'
                        : d === 'Medium' ? 'bg-[#EAE5F7] text-[#5b4b8a]'
                        : 'bg-[#fde8e4] text-[#c0624e]'
                        : 'bg-[#FAF8F3] text-[#777B73] hover:bg-[#F0EDE6]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Number of questions */}
          {practiceMode === 'guided' && <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6">
            <label className="block text-sm font-semibold text-[#282A27] mb-1">
              Number of Questions: <span className="text-[#174D3A] font-bold">{form.num_questions}</span>
            </label>
            <p className="text-xs text-[#777B73] mb-4">Choose between 1 and 10 questions per session.</p>
            <input
              type="range"
              min={1}
              max={10}
              value={form.num_questions}
              onChange={(e) => setForm((f) => ({ ...f, num_questions: Number(e.target.value) }))}
              className="w-full accent-[#174D3A]"
            />
            <div className="flex justify-between text-xs text-[#777B73] mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>}

          {/* Job Description (optional) */}
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6">
            <label className="block text-sm font-semibold text-[#282A27] mb-1">
              Job Description <span className="text-[#777B73] font-normal">(optional)</span>
            </label>
            <p className="text-xs text-[#777B73] mb-3">Paste a job description to get even more relevant questions.</p>
            <textarea
              maxLength={12000}
              placeholder="Paste the job description here..."
              value={form.job_description}
              onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
              rows={4}
              className={`${fieldCls('job_description')} resize-none`}
            />
          </div>

          {/* Summary + Submit */}
          <div className="bg-[#174D3A] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="text-white">
              <p className="font-semibold mb-1">Your Interview Config</p>
              <div className="flex flex-wrap gap-2 text-xs text-[#a8c5b5]">
                <span>{form.job_role || 'No role yet'}</span>
                <span>·</span>
                <span>{form.interview_type}</span>
                <span>·</span>
                <span>{form.experience_level}</span>
                <span>·</span>
                <span>{form.difficulty}</span>
                {practiceMode === 'guided' && <>
                  <span>·</span>
                  <span>{form.num_questions} questions</span>
                </>}
              </div>
            </div>
            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="!bg-white !text-[#174D3A] hover:!bg-[#E4F0E8] whitespace-nowrap"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {practiceMode === 'chat' ? 'Meet your AI interviewer' : 'Begin Interview'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-[#fde8e4] border border-[#E98B78] rounded-xl text-sm text-[#c0624e] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Error:</strong> {error}
                <br />
                <span className="text-xs">Make sure the backend server is running: <code className="bg-white px-1 rounded">uvicorn main:app --reload</code></span>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default InterviewSetup;
