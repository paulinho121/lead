
import React, { useState } from 'react';
import { Video, Users, Mic, Monitor, Shield, MessageSquare, PhoneOff, Award, Zap } from 'lucide-react';

interface MeetingRoomProps {
    userEmail: string;
    userName: string;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ userEmail, userName }) => {
    const [roomName, setRoomName] = useState('ArenaLeads-' + Math.random().toString(36).substring(7));
    const [isInMeeting, setIsInMeeting] = useState(false);

    // Link para o Jitsi Meet (Não requer chave de API para uso público básico)
    const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&userInfo.displayName="${userName}"`;

    const handleJoin = () => {
        setIsInMeeting(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header / Topo da Sala */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 md:p-4 bg-[var(--primary)] text-white rounded-[16px] md:rounded-[24px] shadow-lg shadow-[var(--primary)]/20">
                        <Video size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Arena de Conferência</h2>
                        <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                            <Zap size={14} className="text-amber-500" /> Sala de Reunião & Treinamento Pro
                        </p>
                    </div>
                </div>

                {!isInMeeting && (
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 md:-space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    ?
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando Equipe</p>
                    </div>
                )}
            </header>

            {!isInMeeting ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-6 md:py-10">
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1]">Inicie uma reunião em segundos.</h3>
                            <p className="text-sm md:text-lg text-slate-500 font-medium mt-4 md:mt-6 leading-relaxed">
                                Use nossa sala criptografada para treinamentos, briefings de vendas ou fechamentos. Sem instalações, direto no navegador.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Nome da Sala (Campo de Batalha)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="flex-1 px-5 md:px-6 py-3 md:py-4 bg-white border-2 border-slate-100 rounded-2xl md:rounded-3xl font-bold text-slate-800 focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                    placeholder="Nome da sua sala..."
                                />
                                <button
                                    onClick={handleJoin}
                                    className="px-6 md:px-8 py-3 md:py-4 bg-[var(--primary)] text-white rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center gap-2"
                                >
                                    ENTRAR NA ARENA
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <Shield className="text-emerald-500" size={20} />
                                <span className="text-[10px] font-black text-slate-600 uppercase">Criptografia Total</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <Monitor className="text-blue-500" size={20} />
                                <span className="text-[10px] font-black text-slate-600 uppercase">Compartilhe Tela</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-[var(--primary)]/5 rounded-[60px] blur-3xl -z-10 animate-pulse"></div>
                        <div className="bg-white p-2 rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden aspect-video flex items-center justify-center relative group">
                            <img
                                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800"
                                alt="Meeting Preview"
                                className="w-full h-full object-cover rounded-[40px] opacity-80 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="p-6 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white animate-bounce">
                                    <Mic size={32} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 rounded-[24px] md:rounded-[48px] shadow-2xl overflow-hidden aspect-[4/3] sm:aspect-video relative group border-[4px] md:border-[8px] border-slate-800 h-[60vh] md:h-auto">
                    <iframe
                        src={jitsiUrl}
                        className="w-full h-full border-none"
                        allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
                    />

                    <div className="absolute top-4 md:top-6 left-4 md:left-6 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsInMeeting(false)}
                            className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-red-700 transition-all"
                        >
                            <PhoneOff size={14} className="md:w-4 md:h-4" /> SAIR
                        </button>
                    </div>

                    <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 z-20 flex gap-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <div className="px-4 md:px-6 py-2 md:py-3 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 text-white flex items-center gap-3">
                            <Award className="text-amber-400 md:w-[18px] md:h-[18px]" size={14} />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Sala: {roomName.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Benefícios & Dicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'Treinamento Individual', desc: 'Use para revisar scripts de vendas com novos vendedores.', icon: <Award className="text-amber-500" /> },
                    { title: 'Sala de War', desc: 'Analise leads complexos em tempo real com a gerência.', icon: <Shield className="text-blue-500" /> },
                    { title: 'Demonstração ao Vivo', desc: 'Convide leads para demonstrações rápidas do seu serviço.', icon: <Zap className="text-emerald-500" /> }
                ].map((tip, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="mb-4">{tip.icon}</div>
                        <h4 className="font-black text-slate-800 text-sm mb-2">{tip.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{tip.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MeetingRoom;
