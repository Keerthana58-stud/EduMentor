import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Brain } from 'lucide-react';
import api from '../../api/client';

function Message({ msg }) {
  const isAI = msg.role === 'ai';
  return (
    <div className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isAI ? 'bg-primary-600' : 'bg-gray-200'}`}>
        {isAI ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-600" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isAI
          ? 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-none'
          : 'bg-primary-600 text-white rounded-tr-none'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

export default function AIMentorPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm your AI Mentor. Ask me anything about your studies — concepts, doubts, revision tips, or subject guidance. I'm here to help! 🎓" }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/chat/', { message: msg });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (err) {
      console.error('Chat AI Mentor Error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    "Explain quadratic equations simply",
    "What are the main causes of World War II?",
    "Give me revision tips for exams",
    "How does photosynthesis work?"
  ];

  return (
    <div className="p-8 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary-600 rounded-xl">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Mentor</h1>
          <p className="text-sm text-gray-500">Powered by Groq · Ask any academic question</p>
        </div>
      </div>

      <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => <Message key={i} msg={m} />)}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-none">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <p className="text-xs text-gray-400 mb-2 font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-full hover:bg-primary-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="border-t border-gray-100 p-4">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your academic doubt..."
              disabled={sending}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-150 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
