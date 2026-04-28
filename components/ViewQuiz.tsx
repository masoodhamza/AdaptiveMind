'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, CheckCircle, XCircle, Info, ChevronRight, BarChart } from 'lucide-react';
import { Question, QuizConfig } from '@/lib/types';

interface QuizProps {
  questions: Question[];
  config: QuizConfig;
  onFinish: (score: number, timeElapsed: number, answeredQuestions: Question[]) => void;
}

export const ViewQuiz: React.FC<QuizProps> = ({ questions, config, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30s per question for Quiz mode
  const [totalTime, setTotalTime] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  const currentQuestion = questions[currentIndex];

  const handleNext = useCallback(() => {
    const finalAnswers = { ...userAnswers };
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      const questionsWithAnswers = questions.map(q => ({
        ...q,
        userAnswer: userAnswers[q.id]
      }));
      onFinish(score, totalTime, questionsWithAnswers);
    }
  }, [currentIndex, questions, score, totalTime, onFinish, userAnswers]);

  useEffect(() => {
    if (config.mode === 'quiz' && !isAnswered) {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleNext();
            return 30;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [config.mode, isAnswered, handleNext]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalTime(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: index }));
    
    if (index === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
    }

    if (config.mode === 'practice') {
      setShowExplanation(true);
    } else {
      // In quiz mode, auto-proceed after 1s
      setTimeout(handleNext, 1000);
    }
  };

  return (
    <div className="max-w-3xl w-full">
      {/* Progress Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-sm font-medium text-gray-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><BarChart size={14}/> Score: {score}</span>
            {config.mode === 'quiz' && (
              <span className={`flex items-center gap-1 font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                <Timer size={14}/> {timeLeft}s
              </span>
            )}
          </div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 min-h-[400px] flex flex-col"
        >
          <div className="mb-4 inline-flex items-center">
            {currentQuestion.bloomType && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {currentQuestion.bloomType}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-8 leading-snug">
            {currentQuestion.question}
          </h3>

          <div className="grid gap-3 flex-grow">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctAnswer;
              const isSelected = index === selectedOption;
              
              let variant = "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
              if (isAnswered) {
                if (isCorrect) variant = "border-green-500 bg-green-50 text-green-700";
                else if (isSelected) variant = "border-red-500 bg-red-50 text-red-700";
                else variant = "border-gray-100 opacity-50";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                  className={`group relative w-full text-left p-4 rounded-2xl border-2 font-medium transition-all duration-200 flex items-center justify-between ${variant}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm ${isSelected ? 'bg-blue-600 text-white border-transparent' : 'bg-gray-50 border-gray-200'}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </div>
                  {isAnswered && isCorrect && <CheckCircle className="text-green-500" size={20} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl"
            >
              <div className="flex items-start gap-2">
                <Info className="text-blue-600 shrink-0 mt-1" size={16} />
                <p className="text-sm text-blue-800 italic leading-relaxed">
                  <span className="font-bold not-italic">Explanation:</span> {currentQuestion.explanation}
                </p>
              </div>
              <button
                onClick={handleNext}
                className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Next Question <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
