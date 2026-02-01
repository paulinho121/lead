
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Clock, CheckCheck } from 'lucide-react';
import { supabase } from '../services/supabase';
import { leadService } from '../services/dbService';
import { Message, Profile } from '../types';

interface TeamChatProps {
    currentUser: any;
    profiles: Profile[];
}

const TeamChat: React.FC<TeamChatProps> = ({ currentUser, profiles }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter out current user from chat list
    const chatUsers = profiles.filter(p => p.id !== currentUser.id);

    // Admin is usually the one everyone wants to talk to
    const isAdmin = currentUser.email === 'paulofernandoautomacao@gmail.com';

    useEffect(() => {
        if (selectedUser && isOpen) {
            loadMessages();

            // Subscribe to real-time messages
            const channel = supabase
                .channel(`chat_${currentUser.id}_${selectedUser.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser.id}`
                }, (payload) => {
                    const msg = payload.new as Message;
                    if (msg.sender_id === selectedUser.id) {
                        setMessages(prev => [...prev, msg]);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedUser, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadMessages = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        const data = await leadService.getMessages(currentUser.id, selectedUser.id);
        setMessages(data);
        setIsLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            await leadService.sendMessage(currentUser.id, selectedUser.id, newMessage);
            const tempMsg: Message = {
                id: Math.random().toString(),
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                content: newMessage,
                created_at: new Date().toISOString(),
                is_read: false
            };
            setMessages(prev => [...prev, tempMsg]);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[200]">
            {/* Chat Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-[var(--primary)] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-white animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-[400px] h-[600px] rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <header className="p-6 bg-[var(--primary)] text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {selectedUser ? (
                                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white/10 rounded-lg">
                                    <X size={20} className="rotate-45" />
                                </button>
                            ) : (
                                <MessageCircle size={24} />
                            )}
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest">
                                    {selectedUser ? selectedUser.fullname : 'Chat da Equipe'}
                                </h3>
                                <p className="text-[10px] opacity-80 font-bold">
                                    {selectedUser ? (selectedUser.online_status ? 'Online agora' : 'Offline') : `${chatUsers.length} membros`}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </header>

                    {/* Content */}
                    {!selectedUser ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-2">Contatos</p>
                            {chatUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold">
                                                {user.fullname.charAt(0)}
                                            </div>
                                            {user.online_status && (
                                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-800">{user.fullname}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{user.role || 'Vendedor'}</div>
                                        </div>
                                    </div>
                                    <Clock size={14} className="text-slate-200 group-hover:text-slate-400" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div
                                className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50"
                                ref={scrollRef}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full opacity-20">
                                        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400">
                                        <MessageCircle size={32} className="opacity-20" />
                                        <p className="text-xs font-bold">Diga "Olá" para começar!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMine = msg.sender_id === currentUser.id;
                                        return (
                                            <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-[20px] text-sm shadow-sm ${isMine
                                                        ? 'bg-[var(--primary)] text-white rounded-tr-none'
                                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                                    }`}>
                                                    {msg.content}
                                                    <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMine && <CheckCheck size={10} />}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escreva sua mensagem..."
                                    className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
                                />
                                <button
                                    type="submit"
                                    className="w-12 h-12 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--primary)]/20"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamChat;
