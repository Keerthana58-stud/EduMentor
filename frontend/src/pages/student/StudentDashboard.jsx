import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StudentHome from './StudentHome';
import MyQuizzes from './MyQuizzes';
import AnalyticsPage from './AnalyticsPage';
import AIMentorPage from './AIMentorPage';

export default function StudentDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="student" />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="quizzes" element={<MyQuizzes />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="mentor" element={<AIMentorPage />} />
        </Routes>
      </main>
    </div>
  );
}
