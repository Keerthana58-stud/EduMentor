import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import AdminOverview from './AdminOverview';
import AssignQuiz from './AssignQuiz';
import StudentsPage from './StudentsPage';
import RiskAnalysis from './RiskAnalysis';
import ChatLogsPage from './ChatLogsPage';

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="assign-quiz" element={<AssignQuiz />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="risk" element={<RiskAnalysis />} />
          <Route path="chat-logs" element={<ChatLogsPage />} />
        </Routes>
      </main>
    </div>
  );
}
