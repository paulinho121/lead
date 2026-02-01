
import React, { useState } from 'react';
import { Video, Users, Mic, Monitor, Shield, MessageSquare, PhoneOff, Award, Zap, ExternalLink } from 'lucide-react';

interface MeetingRoomProps {
    userEmail: string;
    userName: string;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ userEmail, userName }) => {
    const [roomName, setRoomName] = useState('ArenaLeads-' + Math.random().toString(36).substring(7));
    const [isInMeeting, setIsInMeeting] = useState(false);
    const [meetingProvider, setMeetingProvider] = useState<'jitsi' | 'meet'>('meet');

    const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&userInfo.displayName="${userName}"`;
    const googleMeetUrl = `https://meet.google.com/new`;

    const handleJoin = () => {
        if (meetingProvider === 'meet') {
            window.open(googleMeetUrl, '_blank');
        } else {
            setIsInMeeting(true);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header / Topo da Sala */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 md:p-4 bg-[var(--primary)] text-[var(--text-on-primary)] rounded-[16px] md:rounded-[24px] shadow-lg shadow-[var(--primary)]/20">
                        <Video size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Arena de Conferência</h2>
                        <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                            <Zap size={14} className="text-amber-500" /> Hub de Reuniões Pro
                        </p>
                    </div>
                </div>

                {!isInMeeting && (
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                            onClick={() => setMeetingProvider('meet')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${meetingProvider === 'meet' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Google Meet
                        </button>
                        <button
                            onClick={() => setMeetingProvider('jitsi')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${meetingProvider === 'jitsi' ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Arena Interna
                        </button>
                    </div>
                )}
            </header>

            {!isInMeeting ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-6 md:py-10">
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                {meetingProvider === 'meet' ? (
                                    <><img src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg" className="w-3 h-3" alt="" /> Padrão Corporativo</>
                                ) : (
                                    <><Zap size={12} /> Resposta Instantânea</>
                                )}
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1]">
                                {meetingProvider === 'meet' ? 'Reuniões profissionais via Google Meet.' : 'Inicie uma reunião interna em segundos.'}
                            </h3>
                            <p className="text-sm md:text-lg text-slate-500 font-medium mt-4 md:mt-6 leading-relaxed">
                                {meetingProvider === 'meet'
                                    ? 'Crie sua sala oficial do Google. O Meet é ideal para apresentações externas com clientes e equipe via conta Google.'
                                    : 'Use nossa arena criptografada para treinamentos rápidos e briefings. Sem login, direto no navegador.'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                                {meetingProvider === 'meet' ? 'Ação Recomendada' : 'Nome da Sala (Campo de Batalha)'}
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                {meetingProvider === 'jitsi' && (
                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        className="flex-1 px-5 md:px-6 py-3 md:py-4 bg-white border-2 border-slate-100 rounded-2xl md:rounded-3xl font-bold text-slate-800 focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                                        placeholder="Nome da sua sala..."
                                    />
                                )}
                                <button
                                    onClick={handleJoin}
                                    className={`flex-1 sm:flex-initial px-6 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 ${meetingProvider === 'meet'
                                            ? 'bg-blue-600 text-white shadow-blue-500/20'
                                            : 'bg-[var(--primary)] text-[var(--text-on-primary)] shadow-[var(--primary)]/20'
                                        }`}
                                >
                                    {meetingProvider === 'meet' ? (
                                        <>ABRIR GOOGLE MEET <ExternalLink size={16} /></>
                                    ) : (
                                        <>ENTRAR NA ARENA <Zap size={16} /></>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <Shield className="text-emerald-500" size={20} />
                                <span className="text-[10px] font-black text-slate-600 uppercase">Ambiente Seguro</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                {meetingProvider === 'meet' ? <Users className="text-blue-500" size={20} /> : <Monitor className="text-blue-500" size={20} />}
                                <span className="text-[10px] font-black text-slate-600 uppercase">
                                    {meetingProvider === 'meet' ? 'Suporta 100+ Pessoas' : 'Compartilhe Tela'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className={`absolute -inset-4 rounded-[60px] blur-3xl -z-10 animate-pulse ${meetingProvider === 'meet' ? 'bg-blue-500/10' : 'bg-[var(--primary)]/10'}`}></div>
                        <div className="bg-white p-2 rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden aspect-video flex items-center justify-center relative group">
                            <img
                                src={meetingProvider === 'meet'
                                    ? "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fit=crop&q=80&w=800"
                                    : "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800"}
                                alt="Meeting Preview"
                                className="w-full h-full object-cover rounded-[40px] opacity-80 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="p-6 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white animate-bounce">
                                    {meetingProvider === 'meet' ? <Video size={32} /> : <Mic size={32} />}
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
                            <PhoneOff size={14} className="md:w-4 md:h-4" /> ENCERRAR
                        </button>
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
