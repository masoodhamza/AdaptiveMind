'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, AlertCircle } from 'lucide-react';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';

interface OnboardingProps {
  onComplete: (user: any) => void;
}

export const ViewOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInAnonymously(auth);
      await updateProfile(userCredential.user, { displayName: name });
      onComplete(userCredential.user);
    } catch (err: any) {
      console.error("Guest login failed:", err);
      const isRestricted = err.code === 'auth/admin-restricted-operation' || 
                          err.message?.includes('admin-restricted-operation');
      
      if (isRestricted) {
        // Fallback to local guest if Anonymous Auth is disabled in Firebase console
        const localUser = {
          uid: `local-${Math.random().toString(36).substr(2, 9)}`,
          displayName: name,
          isAnonymous: true,
          photoURL: null,
          localOnly: true // Custom flag for our app to know it's not a real Firebase user
        };
        onComplete(localUser);
      } else {
        setError(err.message || "An error occurred during guest login.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onComplete(user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <User size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AdaptiveMind Lite</h1>
        <p className="text-gray-500 mt-2">Personalized learning through AI</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleGuestLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name to start as guest"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Start as Guest'}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200"></span>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400">or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <LogIn size={20} />
        {loading ? 'Connecting...' : 'Sign in with Google'}
      </button>
    </motion.div>
  );
};
