'use client';

import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, Layout, Share2, Award } from 'lucide-react';
import { QuizConfig } from '@/lib/types';

interface ResultProps {
  score: number;
  totalQuestions: number;
  timeElapsed: number;
  config: QuizConfig;
  onReset: () => void;
}

export const ViewResults: React.FC<ResultProps> = ({ score, totalQuestions, timeElapsed, config, onReset }) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Scoring formula: (Difficulty x Correct Answers) + Time Bonus
  // Time bonus is max 100 points, decreasing by 1 point per second used, floor 0.
  const timeBonus = Math.max(0, 100 - timeElapsed);
  const totalPoints = (config.difficulty * score * 10) + (config.mode === 'quiz' ? timeBonus : 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center"
    >
      <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center">
        <Award className="text-yellow-600" size={40} />
      </div>

      <h2 className="text-4xl font-black text-gray-900 mb-2">Quiz Complete!</h2>
      <p className="text-gray-500 font-medium mb-8">You&apos;ve mastered {config.subjects.join(', ')}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-gray-50 rounded-3xl">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
          <p className="text-3xl font-black text-gray-900">{score}/{totalQuestions}</p>
        </div>
        <div className="p-6 bg-blue-600 rounded-3xl text-white">
          <p className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-1">Total Points</p>
          <p className="text-3xl font-black">{totalPoints}</p>
        </div>
      </div>

      <div className="space-y-4">
        {percentage >= 80 ? (
          <p className="text-green-600 font-bold">Outstanding! You have a deep understanding of these topics.</p>
        ) : percentage >= 50 ? (
          <p className="text-blue-600 font-bold">Good job! A little more practice and you&apos;ll be an expert.</p>
        ) : (
          <p className="text-amber-600 font-bold">Keep going! Every mistake is a learning opportunity.</p>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <button
          onClick={onReset}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
        >
          <RefreshCcw size={20} /> Try New Configuration
        </button>
        <div className="flex gap-3">
          <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
            <Layout size={20} /> Analysis
          </button>
          <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
            <Share2 size={20} /> Share
          </button>
        </div>
      </div>
    </motion.div>
  );
};
