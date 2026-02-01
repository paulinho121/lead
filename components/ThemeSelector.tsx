
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
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg&w=200',
        icon: <Trophy size={20} />
    },
    flamengo: {
        id: 'flamengo',
        name: 'Flamengo (Mengão)',
        primary: '#C1272D',
        hover: '#a01f25',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_brazilian_v_logo.svg&w=200',
        icon: <Trophy size={20} />
    },
    lakers: {
        id: 'lakers',
        name: 'Lakers (NBA)',
        primary: '#552583',
        hover: '#441d6a',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg&w=200',
        icon: <Dribbble size={20} />
    },
    surf: {
        id: 'surf',
        name: 'Pro Surfer (Hawaii)',
        primary: '#00A3E0',
        hover: '#0085b8',
        shield: 'https://images.weserv.nl/?url=https://www.svgrepo.com/show/532326/surf.svg&w=200',
        icon: <Waves size={20} />
    },
    palmeiras: {
        id: 'palmeiras',
        name: 'Palmeiras (Verdão)',
        primary: '#006437',
        hover: '#004c2a',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg&w=200',
        icon: <Trophy size={20} />
    },
    corinthians: {
        id: 'corinthians',
        name: 'Corinthians (Timão)',
        primary: '#000000',
        hover: '#222222',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/1/10/Sport_Club_Corinthians_Paulista_logo.svg&w=200',
        icon: <Trophy size={20} />
    },
    vasco: {
        id: 'vasco',
        name: 'Vasco da Gama',
        primary: '#000000',
        hover: '#1a1a1a',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/a/ac/Club_de_Regatas_Vasco_da_Gama_logo.svg&w=200',
        icon: <Anchor size={20} />
    },
    bulls: {
        id: 'bulls',
        name: 'Chicago Bulls (NBA)',
        primary: '#CE1141',
        hover: '#a00d32',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/6/67/Chicago_Bulls_logo.svg&w=200',
        icon: <Dribbble size={20} />
    },
    ceara: {
        id: 'ceara',
        name: 'Ceará SC (Vozão)',
        primary: '#000000',
        hover: '#222222',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/2/23/Escudo_Ceara_SC.png&w=200',
        icon: <Trophy size={20} />
    },
    fortaleza: {
        id: 'fortaleza',
        name: 'Fortaleza (Leão)',
        primary: '#004daa',
        hover: '#003a80',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/4/41/Fortaleza_Esporte_Clube_Logo.png&w=200',
        icon: <Trophy size={20} />
    },
    santos: {
        id: 'santos',
        name: 'Santos FC (Peixe)',
        primary: '#111111',
        hover: '#333333',
        shield: 'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg&w=200',
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

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {Object.values(THEMES).map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => {
                                setPreviewTheme(theme.id);
                                document.documentElement.style.setProperty('--primary', theme.primary);
                                document.documentElement.style.setProperty('--primary-hover', theme.hover);
                            }}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${previewTheme === theme.id
                                    ? 'border-[var(--primary)] bg-slate-50 scale-105 shadow-xl'
                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 overflow-hidden"
                                style={{ backgroundColor: theme.primary, color: 'white' }}
                            >
                                {theme.shield ? (
                                    <img
                                        src={theme.shield}
                                        alt={theme.name}
                                        className="w-10 h-10 object-contain"
                                        onError={(e) => {
                                            (e.target as any).style.display = 'none';
                                            const parent = (e.target as any).parentElement;
                                            if (parent) parent.innerHTML = `<div class="text-white font-black text-xl">${theme.name.charAt(0)}</div>`;
                                        }}
                                    />
                                ) : (
                                    theme.icon
                                )}
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-black text-slate-800 block">{theme.name}</span>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <footer className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--primary)]">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Personalização Pro</p>
                            <p className="text-xs font-bold text-slate-600">O tema ficará salvo no seu perfil.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 md:flex-none px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    SALVANDO...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    SALVAR E USAR MANTO
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
