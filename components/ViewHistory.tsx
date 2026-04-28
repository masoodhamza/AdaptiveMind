'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { History, Calendar, Award, Zap, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { LeaderboardEntry } from '@/lib/types';

interface HistoryProps {
  userId: string;
}

export const ViewHistory: React.FC<HistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const q = query(
        collection(db, 'leaderboard'),
        where('userId', '==', userId)
      );
      
      try {
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeaderboardEntry[];
        
        // Sort in JS to avoid composite index requirement
        data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        
        setHistory(data.slice(0, 10));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  return (
    <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-8 mt-12 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <History size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your Learning Path</h2>
        </div>
        <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />
          ))
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium font-mono uppercase text-xs">No sessions completed yet</p>
          </div>
        ) : (
          history.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-5 bg-white hover:bg-gray-50 border border-gray-100 rounded-3xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none">Diff</span>
                  <span className="text-lg font-black text-gray-900 leading-none mt-1">{session.difficulty}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 capitalize">{session.subjectStr}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                      <Calendar size={10} /> {session.createdAt?.toDate().toLocaleDateString()}
                    </span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase">
                      <Zap size={10} /> Scored {session.points}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1">
                    <Award size={14} className="text-yellow-500" />
                    <span className="text-sm font-black text-gray-900">Rank #0</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Global Percentile</p>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
