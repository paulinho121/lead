
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Clock, CheckCheck, ChevronLeft } from 'lucide-react';
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
    const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
    const [totalUnread, setTotalUnread] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const notificationSound = useRef<HTMLAudioElement | null>(null);

    // Initialize notification sound
    useEffect(() => {
        // High quality "Success/Pop" sound
        notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        notificationSound.current.volume = 0.5;
    }, []);

    // Filter out current user from chat list
    const chatUsers = profiles.filter(p => p.id !== currentUser.id);
    const onlineCount = chatUsers.filter(p => p.online_status).length;

    useEffect(() => {
        // Subscribe to real-time messages for ALL users to catch notifications
        const channel = supabase
            .channel(`notifications_${currentUser.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${currentUser.id}`
            }, (payload) => {
                const msg = payload.new as Message;

                // If the message is not from the currently selected user (or chat is closed)
                if (!isOpen || !selectedUser || msg.sender_id !== selectedUser.id) {
                    setUnreadMessages(prev => ({
                        ...prev,
                        [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
                    }));
                    setTotalUnread(prev => prev + 1);

                    // Play notification sound
                    notificationSound.current?.play().catch(() => { });

                    // Browser notification
                    if (Notification.permission === 'granted') {
                        new Notification('Nova Mensagem', {
                            body: msg.content,
                            icon: '/logo.png'
                        });
                    }
                } else if (isOpen && selectedUser && msg.sender_id === selectedUser.id) {
                    // If chat is open and it's the right person, add to messages list
                    setMessages(prev => [...prev, msg]);
                }
            })
            .subscribe();

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedUser, isOpen]);

    useEffect(() => {
        if (selectedUser && isOpen) {
            loadMessages();
        }
    }, [selectedUser, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadUnreadCounts = async () => {
        try {
            // Note: In this MVP we fetch recent messages and count those where receiver is ME and is_read is false
            // This is a simplified version using existing getMessages or similar
            const data = await leadService.getMessages(currentUser.id, 'all');
            const counts: Record<string, number> = {};
            let total = 0;

            data.forEach((msg: any) => {
                if (msg.receiver_id === currentUser.id && !msg.is_read) {
                    counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
                    total++;
                }
            });

            setUnreadMessages(counts);
            setTotalUnread(total);
        } catch (e) {
            console.error('Error loading unread counts:', e);
        }
    };

    const loadMessages = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        const data = await leadService.getMessages(currentUser.id, selectedUser.id);
        setMessages(data);
        setIsLoading(false);

        // Clear unread for this user
        if (unreadMessages[selectedUser.id]) {
            const count = unreadMessages[selectedUser.id];
            setUnreadMessages(prev => {
                const next = { ...prev };
                delete next[selectedUser.id];
                return next;
            });
            setTotalUnread(prev => Math.max(0, prev - count));
        }
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
                    className="w-16 h-16 bg-[var(--primary)] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />

                    {/* Unread Badge */}
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-lg z-10">
                            {totalUnread}
                        </span>
                    )}

                    {/* Online Indicator */}
                    {onlineCount > 0 && (
                        <span className="absolute bottom-0 right-0 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full border border-slate-100 shadow-sm">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-black text-slate-600">{onlineCount}</span>
                        </span>
                    )}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-[400px] h-[600px] rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <header className="p-6 bg-[var(--primary)] text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {selectedUser ? (
                                <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1 group">
                                    <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
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
                                    <div className="flex flex-col items-end gap-1">
                                        {user.online_status ? (
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter animate-pulse">Online</span>
                                        ) : (
                                            <Clock size={14} className="text-slate-200 group-hover:text-slate-400" />
                                        )}
                                        {unreadMessages[user.id] > 0 && (
                                            <span className="bg-[var(--primary)] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                                {unreadMessages[user.id]}
                                            </span>
                                        )}
                                    </div>
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
