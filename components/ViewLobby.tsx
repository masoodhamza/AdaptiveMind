'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Copy, Check, Play, UserPlus, Loader2 } from 'lucide-react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Lobby, Question } from '@/lib/types';

interface LobbyProps {
  lobbyId: string;
  user: any;
  onStart: (questions: Question[]) => void;
  onCancel: () => void;
}

export const ViewLobby: React.FC<LobbyProps> = ({ lobbyId, user, onStart, onCancel }) => {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'lobbies', lobbyId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Lobby;
        setLobby({ ...data, id: snapshot.id });
        
        if (data.status === 'active' && data.questions) {
          onStart(data.questions);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `lobbies/${lobbyId}`);
    });

    // Auto-join if not in players list
    const joinLobby = async () => {
      const lobbyDoc = await getDoc(doc(db, 'lobbies', lobbyId));
      if (lobbyDoc.exists()) {
        const data = lobbyDoc.data() as Lobby;
        const isPlayer = data.players.some(p => p.uid === user.uid);
        if (!isPlayer) {
          await updateDoc(doc(db, 'lobbies', lobbyId), {
            players: arrayUnion({
              uid: user.uid,
              displayName: user.displayName || 'Guest',
              photoURL: user.photoURL || null,
              ready: true
            })
          });
        }
      }
    };
    joinLobby();

    return () => unsub();
  }, [lobbyId, user.uid, user.displayName, user.photoURL, onStart]);

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (!lobby || lobby.hostId !== user.uid) return;
    setStarting(true);
    try {
      if (!lobby.questions || lobby.questions.length === 0) {
        throw new Error("Questions not ready. Please wait a moment.");
      }
      await updateDoc(doc(db, 'lobbies', lobbyId), {
        status: 'active'
      });
    } catch (err: any) {
      alert(err.message);
      setStarting(false);
    }
  };

  if (!lobby) return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Entering Lobby...</p>
    </div>
  );

  const isHost = lobby.hostId === user.uid;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Quiz Lobby</h2>
            <p className="text-sm text-gray-500 font-medium">Waiting for players...</p>
          </div>
        </div>
        <button 
          onClick={copyCode}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors border border-gray-100"
        >
          <span className="text-xs font-bold font-mono text-gray-400 uppercase">Code: {lobbyId.slice(0, 6)}</span>
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
        </button>
      </div>

      <div className="space-y-6 mb-12">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          Joined Players ({lobby.players.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <AnimatePresence>
            {lobby.players.map((player, idx) => (
              <motion.div 
                key={player.uid}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="flex flex-col items-center p-4 bg-gray-50 rounded-3xl border border-transparent hover:border-blue-100 transition-colors relative group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl mb-3 overflow-hidden border-4 border-white shadow-sm">
                  {player.photoURL ? <img src={player.photoURL} alt="" /> : player.displayName[0]}
                </div>
                <p className="text-sm font-bold text-gray-900 truncate w-full text-center">{player.displayName}</p>
                {player.uid === lobby.hostId && (
                  <span className="absolute -top-2 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Host</span>
                )}
              </motion.div>
            ))}
            {lobby.players.length < 3 && (
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-3xl opacity-50">
                <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 mb-3">
                  <UserPlus size={24} />
                </div>
                <p className="text-xs font-bold text-gray-300 uppercase">Invite Friend</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 mb-8">
        <div className="flex items-center gap-4 mb-2">
          {!lobby.questions || lobby.questions.length === 0 ? (
            <Loader2 className="animate-spin text-blue-600" size={16} />
          ) : (
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          )}
          <p className="text-sm font-bold text-blue-900">
            {!lobby.questions || lobby.questions.length === 0 ? "Architecting Brain Teasers..." : "Battle Map Ready"}
          </p>
        </div>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            Preparing {lobby.config.questionCount} questions on <span className="font-bold underline">{lobby.config.subjects.join(', ')}</span>. 
            {!lobby.questions || lobby.questions.length === 0 ? " This usually takes 5-10 seconds." : " You can start the battle now!"}
          </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={starting || lobby.players.length < 1}
            className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
          >
            {starting ? <Loader2 className="animate-spin" /> : <Play size={20} />} START BATTLE
          </button>
        ) : (
          <div className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl flex items-center justify-center gap-2 cursor-wait">
            <Loader2 className="animate-spin" size={20} /> WAITING FOR HOST
          </div>
        )}
        <button 
          onClick={onCancel}
          className="sm:w-32 bg-white border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};
