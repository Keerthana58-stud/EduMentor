import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, LoadingSpinner } from '../../components/UIComponents';
import { MessageSquare } from 'lucide-react';
import api from '../../api/client';

export default function ChatLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/chat-logs').then(res => { setLogs(res.data); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="p-8">
      <SectionHeader title="AI Mentor Chat Logs" subtitle={`${logs.length} conversations logged`} />
      {logs.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No chat logs yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold">
                      ID
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Student: {log.student_id?.slice(-8)}</span>
                  </div>
                  {log.status === 'failed' && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tighter w-fit">
                      FAILED: {log.error_message || 'Unknown Error'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
              {/* Student Message */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Student asked:</p>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700">{log.message}</div>
              </div>
              {/* AI Response */}
              <div>
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-primary-500 rounded-full inline-flex items-center justify-center">
                    <span className="text-white text-[8px]">AI</span>
                  </span>
                  EduMentor responded:
                </p>
                <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">{log.response}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
