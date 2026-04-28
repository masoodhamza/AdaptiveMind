'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sliders, BookOpen, Layers, Zap, Users, FileUp, X, FileText, Check } from 'lucide-react';
import { QuizConfig } from '@/lib/types';

interface ConfigProps {
  onStart: (config: QuizConfig, lobbyMode: boolean) => void;
}

export const ViewConfig: React.FC<ConfigProps> = ({ onStart }) => {
  const [subjects, setSubjects] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(10);
  const [mode, setMode] = useState<'practice' | 'quiz'>('practice');
  const [fileContext, setFileContext] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Max 10MB allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const data = base64.split(',')[1];
      setFileContext({
        data,
        mimeType: file.type,
        name: file.name
      });
      // Try to auto-detect subject from file name
      if (!subjects) {
        setSubjects(file.name.split('.')[0].replace(/[-_]/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent, lobbyMode = false) => {
    e.preventDefault();
    const subjectList = subjects.split(',').map(s => s.trim()).filter(Boolean);
    if (subjectList.length === 0 && !fileContext) return;
    
    onStart({
      subjects: subjectList.length > 0 ? subjectList : [fileContext?.name || 'General'],
      difficulty,
      questionCount,
      mode,
      fileContext: fileContext ? { data: fileContext.data, mimeType: fileContext.mimeType } : undefined
    }, lobbyMode);
  };

  const difficultyNames = [
    'Basic Recall',
    'Understanding',
    'Application',
    'Analysis',
    'Critical Evaluation'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full p-8 rounded-3xl bg-white shadow-2xl border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-8">
        <Sliders className="text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Quiz Configuration</h2>
      </div>

      <form className="space-y-8">
        {/* Source Material: OCR / PDF */}
        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
          <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-4 uppercase tracking-wider">
            <FileText size={16} /> Base Quiz On
          </label>
          
          <div className="flex flex-col gap-4">
            {!fileContext ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-100/50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileUp size={24} />
                </div>
                <span className="font-semibold text-sm">Upload Textbook Photo or PDF</span>
                <span className="text-[10px] text-blue-400">Quiz will be based on this material</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                    <Check size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{fileContext.name}</p>
                    <p className="text-[11px] text-gray-500 font-medium">Material Locked</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFileContext(null)}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-blue-100"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-blue-50/50 text-blue-400 font-bold uppercase tracking-widest">or manually enter subjects</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="e.g. Data Structures, Pakistan History, Quantum Physics"
                className="w-full px-4 py-4 rounded-2xl border border-blue-100 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                required={!fileContext}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Difficulty */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <Layers size={16} /> Difficulty: {difficulty}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-blue-600 mt-2 font-medium">
              {difficultyNames[difficulty - 1]}
            </p>
          </div>

          {/* Question Count */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Zap size={16} /> Question Count
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">{mode} Mode</h3>
            <p className="text-xs text-gray-500">
              {mode === 'practice' 
                ? 'Instant feedback & explanations. No timer.' 
                : 'Timed session & scored leaderboard.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode(m => m === 'practice' ? 'quiz' : 'practice')}
            className={`relative w-14 h-8 rounded-full transition-colors ${mode === 'quiz' ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${mode === 'quiz' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={(e) => handleSubmit(e, false)}
            className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            Start Solo Session
          </button>
          <button
            onClick={(e) => handleSubmit(e, true)}
            className="flex-1 bg-white border-2 border-gray-900 text-gray-900 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Users size={20} /> Create Multi-User Lobby
          </button>
        </div>
      </form>
    </motion.div>
  );
};
