'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { LeaderboardEntry } from '@/lib/types';

export const ViewLeaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    const now = new Date();
    let startTime = new Date();

    if (period === 'daily') {
      startTime.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startTime.setDate(now.getDate() - 7);
    } else {
      startTime.setMonth(now.getMonth() - 1);
    }

    // Fetch the top 100 entries from the last month and filter/sort in JS
    // This avoids needing a composite index for points + createdAt
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('points', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardEntry[];

      // Apply temporal filtering in JS
      data = data.filter(entry => {
        const entryTime = entry.createdAt?.toMillis?.() || 0;
        return entryTime >= startTime.getTime();
      });

      setEntries(data.slice(0, 10));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'leaderboard');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [period]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md w-full bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Leaderboard</h3>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-2xl" />
          ))
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400 py-8 italic">No records yet. Be the first!</p>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-2xl border ${index === 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center font-bold text-gray-400">
                  {index === 0 ? <Crown size={16} className="text-yellow-600" /> : 
                   index === 1 ? <Medal size={16} className="text-gray-400" /> :
                   index === 2 ? <Medal size={16} className="text-amber-600" /> : index + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-900 truncate max-w-[120px]">{entry.displayName}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">{entry.subjectStr}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-blue-600">{entry.points}</p>
                <p className="text-[10px] text-gray-400 font-bold">PTS</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
