import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight, Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { LoadingSpinner } from '../../components/UIComponents';
import api from '../../api/client';

export default function QuizAttemptPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/quiz/${quizId}`).then(res => {
      setQuiz(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error('Quiz fetch error:', err);
      setError('Quiz not found or unavailable.');
      setLoading(false);
    });
  }, [quizId]);

  const selectAnswer = (optionText) => {
    setAnswers(prev => ({ ...prev, [String(current)]: optionText }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/quiz/${quizId}/submit`, { answers });
      setResult(res.data);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

  /* ---- Result Screen ---- */
  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const passed = pct >= 60;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {passed ? <Trophy className="w-10 h-10 text-emerald-500" /> : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{passed ? 'Great job!' : 'Keep practising!'}</h1>
          <p className="text-gray-500 text-sm mb-6">{quiz?.title}</p>

          <div className={`text-6xl font-extrabold mb-2 ${passed ? 'text-emerald-500' : 'text-red-400'}`}>{pct}%</div>
          <p className="text-gray-500 text-sm mb-6">{result.score} / {result.total} correct</p>

          {/* Score bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/student/quizzes')}
              className="flex-1 btn-secondary py-3 text-sm flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> My Quizzes
            </button>
            <button onClick={() => navigate('/student/analytics')}
              className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2">
              View Analytics <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Quiz Attempt Screen ---- */
  const questions = quiz?.questions || [];
  const question = questions[current];
  const totalQ = questions.length;
  const progress = ((current + 1) / totalQ) * 100;
  const selectedAnswer = answers[String(current)];
  const allAnswered = Object.keys(answers).length === totalQ;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">{quiz?.title || quiz?.topic}</h1>
            <p className="text-sm text-gray-400">{quiz?.subject} · {quiz?.difficulty}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{current + 1}</span>
            <span className="text-gray-400 text-lg">/{totalQ}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 mb-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Question {current + 1}</p>
          <p className="text-gray-900 font-semibold text-lg leading-snug mb-7">{question?.question_text}</p>

          {/* Options */}
          <div className="space-y-3">
            {question?.options?.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(opt)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-100 hover:border-gray-300 text-gray-700 bg-gray-50 hover:bg-white'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                    isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Answer Progress Pills */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                i === current ? 'bg-primary-600 text-white' : answers[String(i)] ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
            className="btn-secondary flex-1 py-3 text-sm disabled:opacity-40">
            ← Previous
          </button>
          {current < totalQ - 1 ? (
            <button onClick={() => setCurrent(current + 1)}
              className="btn-primary flex-1 py-3 text-sm">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !allAnswered}
              className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {allAnswered ? 'Submit Quiz' : `Answer all (${Object.keys(answers).length}/${totalQ})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
