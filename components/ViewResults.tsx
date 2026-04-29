'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, Layout, Share2, Award, ChevronLeft, Check, X, Info } from 'lucide-react';
import { QuizConfig, Question } from '@/lib/types';

interface ResultProps {
  score: number;
  totalQuestions: number;
  timeElapsed: number;
  questions: Question[]; // Added to show analysis
  config: QuizConfig;
  onReset: () => void;
}

export const ViewResults: React.FC<ResultProps> = ({ score, totalQuestions, timeElapsed, questions, config, onReset }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Scoring formula: (Difficulty x Correct Answers) + Time Bonus
  const timeBonus = config.mode === 'quiz' ? Math.max(0, 100 - timeElapsed) : 0;
  const totalPoints = (config.difficulty * score * 10) + timeBonus;

  const handleShare = async () => {
    const shareData = {
      title: 'AdaptiveMind Quiz Results',
      text: `I just scored ${score}/${totalQuestions} (${totalPoints} points) on a ${config.difficulty}-star ${config.subjects[0]} quiz! Try it out!`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
        alert("Scored copied to clipboard! Share it with your friends.");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  if (showAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-2xl w-full bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100"
      >
        <button 
          onClick={() => setShowAnalysis(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-bold transition-colors"
        >
          <ChevronLeft size={20} /> Back to Results
        </button>

        <h3 className="text-2xl font-black text-gray-900 mb-6 underline decoration-blue-500 decoration-4 underline-offset-4">Performance Analysis</h3>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {questions.map((q, idx) => {
            const isCorrect = q.userAnswer !== undefined && q.userAnswer === q.correctAnswer;
            const isUnanswered = q.userAnswer === undefined;
            
            return (
              <div key={q.id} className="p-5 rounded-3xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-gray-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="font-bold text-gray-900 leading-snug">{q.question}</p>
                  </div>
                  {isUnanswered && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 whitespace-nowrap">
                      NOT ANSWERED
                    </span>
                  )}
                </div>

                <div className="space-y-2 ml-9">
                  {q.options.map((opt, oIdx) => {
                    const isUserAns = oIdx === q.userAnswer;
                    const isCorrectAns = oIdx === q.correctAnswer;
                    
                    let style = "text-gray-500";
                    let Icon = null;
                    
                    if (isCorrectAns) {
                      style = "text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg border border-green-100";
                      Icon = <Check size={14} />;
                    } else if (isUserAns && !isCorrect) {
                      style = "text-red-600 font-bold bg-red-50 px-3 py-1 rounded-lg border border-red-100";
                      Icon = <X size={14} />;
                    }

                    return (
                      <div key={oIdx} className={`text-sm flex items-center gap-2 ${style}`}>
                        {Icon} {opt}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 ml-9 p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-2">
                  <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 leading-relaxed italic">
                    <span className="font-bold not-italic">Note:</span> {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

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
      <p className="text-gray-500 font-medium mb-8 shrink-text">
        You&apos;ve mastered {config.subjects.join(', ')}
      </p>

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
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          <RefreshCcw size={20} /> Try New Configuration
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAnalysis(true)}
            className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
          >
            <Layout size={20} /> Analysis
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
          >
            <Share2 size={20} /> Share
          </button>
        </div>
      </div>
    </motion.div>
  );
};
