
import React, { useState } from 'react';
import { X, Trophy, Palette, Anchor, Dribbble, Waves, CheckCircle2, ShieldAlert } from 'lucide-react';
import { leadService } from '../services/dbService';

export const THEMES = {
    default: {
        id: 'default',
        name: 'Padrão LeadPro',
        primary: '#00A38E',
        hover: '#008f7d',
        shield: '',
        icon: <Palette size={20} />
    },
    botafogo: {
        id: 'botafogo',
        name: 'Botafogo (Alvinegro)',
        primary: '#000000',
        hover: '#333333',
        shield: '/botafogo-shield.png',
        icon: <Trophy size={20} />
    },
    flamengo: {
        id: 'flamengo',
        name: 'Flamengo (Mengão)',
        primary: '#C1272D',
        hover: '#a01f25',
        shield: '/flamengo-shield.png',
        icon: <Trophy size={20} />
    },
    lakers: {
        id: 'lakers',
        name: 'Lakers (NBA)',
        primary: '#552583',
        hover: '#441d6a',
        shield: '/lakers-shield.png',
        icon: <Dribbble size={20} />
    },
    brasil: {
        id: 'brasil',
        name: 'Seleção Brasileira',
        primary: '#F7D116',
        hover: '#d4b200',
        shield: '/brasil-shield.png',
        icon: <Trophy size={20} />
    },
    palmeiras: {
        id: 'palmeiras',
        name: 'Palmeiras (Verdão)',
        primary: '#006437',
        hover: '#004c2a',
        shield: '/palmeiras-shield.png',
        icon: <Trophy size={20} />
    },
    corinthians: {
        id: 'corinthians',
        name: 'Corinthians (Timão)',
        primary: '#000000',
        hover: '#222222',
        shield: '/corinthians-shield.png',
        icon: <Trophy size={20} />
    },
    vasco: {
        id: 'vasco',
        name: 'Vasco da Gama',
        primary: '#000000',
        hover: '#1a1a1a',
        shield: '/vasco-shield.png',
        icon: <Anchor size={20} />
    },
    bulls: {
        id: 'bulls',
        name: 'Chicago Bulls (NBA)',
        primary: '#CE1141',
        hover: '#a00d32',
        shield: '/bulls-shield.png',
        icon: <Dribbble size={20} />
    },
    ceara: {
        id: 'ceara',
        name: 'Ceará SC (Vozão)',
        primary: '#000000',
        hover: '#222222',
        shield: '/ceara-shield.png',
        icon: <Trophy size={20} />
    },
    fortaleza: {
        id: 'fortaleza',
        name: 'Fortaleza (Leão)',
        primary: '#004daa',
        hover: '#003a80',
        shield: '/fortaleza-shield.png',
        icon: <Trophy size={20} />
    },
    santos: {
        id: 'santos',
        name: 'Santos FC (Peixe)',
        primary: '#111111',
        hover: '#333333',
        shield: '/santos-shield.png',
        icon: <Anchor size={20} />
    }
};

interface ThemeSelectorProps {
    userId: string;
    currentTheme: string;
    onClose: () => void;
    onThemeSelect: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ userId, currentTheme, onClose, onThemeSelect }) => {
    const [previewTheme, setPreviewTheme] = useState(currentTheme);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await leadService.updateProfileTheme(userId, previewTheme);
            onThemeSelect(previewTheme);
            onClose();
        } catch (e) {
            console.error('Error saving theme:', e);
            alert('Erro ao salvar tema. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => {
                // Reset visual profile to current on cancel
                const activeTheme = (THEMES as any)[currentTheme] || THEMES.default;
                document.documentElement.style.setProperty('--primary', activeTheme.primary);
                document.documentElement.style.setProperty('--primary-hover', activeTheme.hover);
                onClose();
            }} />
            <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <header className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Escolha o seu Manto</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Clique para visualizar e clique em salvar para confirmar</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-4 md:p-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {Object.values(THEMES).map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => {
                                setPreviewTheme(theme.id);
                                document.documentElement.style.setProperty('--primary', theme.primary);
                                document.documentElement.style.setProperty('--primary-hover', theme.hover);
                            }}
                            className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex flex-col items-center gap-3 md:gap-4 group ${previewTheme === theme.id
                                ? 'border-[var(--primary)] bg-slate-50 scale-105 shadow-xl'
                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <div
                                className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 overflow-hidden"
                                style={{ backgroundColor: theme.primary, color: 'white' }}
                            >
                                {theme.shield ? (
                                    <img
                                        src={theme.shield}
                                        alt={theme.name}
                                        className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                        onError={(e) => {
                                            (e.target as any).style.display = 'none';
                                            const parent = (e.target as any).parentElement;
                                            if (parent) parent.innerHTML = `<div class="text-white font-black text-lg md:text-xl">${theme.name.charAt(0)}</div>`;
                                        }}
                                    />
                                ) : (
                                    theme.icon
                                )}
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] md:text-sm font-black text-slate-800 block leading-tight">{theme.name}</span>
                                <div className="flex items-center justify-center gap-1 mt-1 md:mt-2">
                                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-200" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <footer className="p-4 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--primary)]">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Personalização Pro</p>
                            <p className="text-xs font-bold text-slate-600">O tema ficará salvo no seu perfil.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none px-6 md:px-10 py-3 md:py-4 bg-[var(--primary)] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    SALVANDO...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    SALVAR E USAR
                                </>
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ThemeSelector;
