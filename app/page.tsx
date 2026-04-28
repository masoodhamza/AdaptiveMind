'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateMCQs } from '@/lib/quiz-engine';
import { QuizConfig, Question } from '@/lib/types';

// Components
import { ViewOnboarding } from '@/components/ViewOnboarding';
import { ViewConfig } from '@/components/ViewConfig';
import { ViewQuiz } from '@/components/ViewQuiz';
import { ViewResults } from '@/components/ViewResults';
import { ViewLeaderboard } from '@/components/ViewLeaderboard';
import { ViewLobby } from '@/components/ViewLobby';
import { ViewHistory } from '@/components/ViewHistory';
import { Loader2, AlertCircle, LogIn, Users } from 'lucide-react';

type AppState = 'onboarding' | 'config' | 'loading' | 'quiz' | 'result' | 'lobby';

export default function AdaptiveMindApp() {
  const [user, setUser] = useState<any | null>(null);
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<{ score: number; time: number } | null>(null);
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [activeTab, setActiveTab] = useState<'build' | 'history'>('build');

  useEffect(() => {
    // Fallback: If auth takes too long, just show the UI (it handles guest/logged out states)
    const timeout = setTimeout(() => {
      setIsAuthReady(true);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      clearTimeout(timeout);
      if (u) {
        setUser(u);
        setAppState('config');
      }
      setIsAuthReady(true);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleOnboardingComplete = (u: any) => {
    setUser(u);
    setAppState('config');
  };

  const startQuiz = async (quizConfig: QuizConfig, lobbyMode: boolean) => {
    if (lobbyMode && (!user || user.localOnly)) {
      setError("Multiplayer 'Battle Mode' requires a real account. Please sign in with Google.");
      return;
    }

    setConfig(quizConfig);
    setAppState('loading');
    setError(null);

    try {
      if (lobbyMode) {
        const fbConfig = { ...quizConfig };
        if (fbConfig.fileContext === undefined) {
          delete fbConfig.fileContext;
        }

        const lobbyRef = await addDoc(collection(db, 'lobbies'), {
          seed: Math.floor(Math.random() * 1000000),
          config: fbConfig,
          hostId: user.uid,
          createdAt: serverTimestamp(),
          status: 'waiting',
          players: [{
            uid: user.uid,
            displayName: user.displayName || 'Host',
            photoURL: user.photoURL || null,
            ready: true
          }]
        });
        
        setActiveLobbyId(lobbyRef.id);
        setAppState('lobby');

        generateMCQs(quizConfig).then(async (generatedQuestions) => {
          if (generatedQuestions && generatedQuestions.length > 0) {
            await setDoc(lobbyRef, { questions: generatedQuestions }, { merge: true });
          }
        }).catch(err => {
          console.error("Lobby question generation failed:", err);
        });
        
        return;
      }

      console.log("Starting solo session...");
      const generatedQuestions = await generateMCQs(quizConfig);
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("No questions were generated. Please try different subjects.");
      }
      setQuestions(generatedQuestions);
      setAppState('quiz');
    } catch (err: any) {
      console.error("Session start error:", err);
      setError(err.message || "Failed to start quiz. Check your connection or API key.");
      setAppState('config');
    }
  };

  const handleLobbyStart = (lobbyQuestions: Question[], lobbyConfig: QuizConfig) => {
    setConfig(lobbyConfig);
    setQuestions(lobbyQuestions);
    setAppState('quiz');
  };

  const joinLobby = (id: string) => {
    setActiveLobbyId(id);
    setAppState('lobby');
  };

  const finishQuiz = async (score: number, time: number, answeredQuestions: Question[]) => {
    setQuestions(answeredQuestions); // This now includes userAnswer for each question
    setSessionResults({ score, time });
    setAppState('result');

    if (user && !user.localOnly && config) {
      // Points formula: (Difficulty x Correct Answers x 10) + Time Bonus
      const timeBonus = config.mode === 'quiz' ? Math.max(0, 100 - time) : 0;
      const points = (config.difficulty * score * 10) + timeBonus;

      try {
        await addDoc(collection(db, 'leaderboard'), {
          userId: user.uid,
          displayName: user.displayName || 'Anonymous',
          points,
          score,
          totalQuestions: questions.length,
          time,
          difficulty: config.difficulty,
          subjectStr: config.subjects[0] || 'General',
          mode: config.mode,
          createdAt: serverTimestamp()
        });
        
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const currentData = userDoc.exists() ? userDoc.data() : { totalPoints: 0, bestScore: 0 };
        
        await setDoc(userRef, {
          displayName: user.displayName || 'Anonymous',
          totalPoints: (currentData.totalPoints || 0) + points,
          bestScore: Math.max(currentData.bestScore || 0, points),
          lastPlayed: serverTimestamp()
        }, { merge: true });

      } catch (err) {
        console.error("Error saving score:", err);
      }
    }
  };

  const resetApp = () => {
    setAppState('config');
    setQuestions([]);
    setConfig(null);
    setSessionResults(null);
  };

  const handleSignOut = async () => {
    try {
      if (user && !user.localOnly) {
        await signOut(auth);
      }
      setUser(null);
      setAppState('onboarding');
      setQuestions([]);
      setConfig(null);
      setSessionResults(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFCFB] text-gray-900 font-sans selection:bg-blue-100 flex flex-col items-center p-4 md:p-8 overflow-x-hidden relative">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12 relative z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
          <div className="w-8 h-8 bg-black rounded-lg" />
          <span className="text-xl font-black tracking-tighter">ADAPTIVEMIND</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-full py-1 pl-1 pr-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user.displayName?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none truncate max-w-[100px]">{user.displayName}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Mind Level 1</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors rounded-full"
              title="Sign Out"
            >
              <LogIn size={18} className="rotate-180" />
            </button>
          </div>
        )}
      </header>

      <div className="w-full max-w-6xl grid lg:grid-cols-[1fr,320px] gap-8 items-start justify-center relative z-0">
        {/* Main Interface */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {appState === 'onboarding' && (
              <ViewOnboarding key="onboarding" onComplete={handleOnboardingComplete} />
            )}

            {appState === 'config' && (
              <motion.div 
                key="config"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center w-full"
              >
                {error && (
                  <div className="w-full max-w-2xl mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 shadow-sm">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="w-full max-w-2xl flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 mb-8 sticky top-4 z-20 shadow-sm">
                  <button 
                    onClick={() => setActiveTab('build')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'build' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    Quiz Builder
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    My History
                  </button>
                </div>
                
                {activeTab === 'build' ? (
                  <div className="w-full max-w-2xl">
                    {!user?.localOnly && (
                      <div className="w-full mb-8 p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Users size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 leading-none">Join a Battle</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Multiplayer Mode</p>
                          </div>
                        </div>
                        <form 
                          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const code = formData.get('lobbyCode')?.toString().trim();
                            if (code) joinLobby(code);
                          }}
                          className="flex bg-gray-50 border border-gray-100 p-1.5 rounded-2xl w-full sm:w-auto"
                        >
                          <input 
                            name="lobbyCode"
                            placeholder="Lobby Code"
                            className="bg-transparent px-4 py-2 outline-none text-sm font-bold w-full sm:w-32"
                          />
                          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors">
                            JOIN
                          </button>
                        </form>
                      </div>
                    )}
                    <ViewConfig onStart={startQuiz} />
                  </div>
                ) : (
                  user && <ViewHistory userId={user.uid} />
                )}
              </motion.div>
            )}

            {appState === 'lobby' && activeLobbyId && (
              <ViewLobby 
                key="lobby"
                lobbyId={activeLobbyId} 
                user={user} 
                onStart={handleLobbyStart}
                onCancel={() => setAppState('config')}
              />
            )}

            {appState === 'loading' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-20 text-center"
              >
                <div className="relative mb-6">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  >
                    <Loader2 size={80} className="text-blue-600 opacity-20" />
                  </motion.div>
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-full blur-xl opacity-20" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Architecting Your Mind Map...</h3>
                <p className="text-gray-500 max-w-xs mx-auto">We are preparing your specialized questions based on Bloom&apos;s Taxonomy.</p>
              </motion.div>
            )}

            {appState === 'quiz' && config && (
              <ViewQuiz 
                key="quiz"
                questions={questions} 
                config={config} 
                onFinish={finishQuiz} 
              />
            )}

            {appState === 'result' && config && sessionResults && (
              <ViewResults 
                key="result"
                score={sessionResults.score} 
                totalQuestions={questions.length}
                timeElapsed={sessionResults.time}
                questions={questions}
                config={config}
                onReset={resetApp}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Global Leaderboard - only shown in config or result states for desktop */}
        <aside className="hidden lg:block w-full sticky top-4">
           <ViewLeaderboard />
        </aside>
      </div>
    </main>
  );
}
