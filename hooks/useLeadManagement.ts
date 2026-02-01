
import { Lead } from '../types';

export const isLeadFullyManaged = (l: Lead): boolean => {
    if (l.status !== 'enriched') return true; // Somente leads enriquecidos precisam de gestão completa

    const hasInsta = !!l.instagram && l.instagram.trim() !== '';
    const hasFace = !!l.facebook && l.facebook.trim() !== '';
    const hasEmail = (!!l.email && l.email.trim() !== '') || l.emailNotFound === true;
    const isContacted = l.contacted === true;

    return hasInsta && hasFace && hasEmail && isContacted;
};

export const getLeadProgress = (l: Lead): number => {
    let score = 0;
    if (!!l.instagram && l.instagram.trim() !== '') score += 25;
    if (!!l.facebook && l.facebook.trim() !== '') score += 25;
    if ((!!l.email && l.email.trim() !== '') || l.emailNotFound === true) score += 25;
    if (l.contacted === true) score += 25;
    return score;
};

export const getLeadAging = (capturedAt: string): { text: string, level: 'low' | 'medium' | 'high' } => {
    const start = new Date(capturedAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - start) / (1000 * 60 * 60);

    if (diffHours < 24) return { text: `${Math.round(diffHours)}h`, level: 'low' };
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 3) return { text: `${diffDays}d`, level: 'medium' };
    return { text: `${diffDays}d`, level: 'high' };
};

export const useLeadManagement = (leads: Lead[]) => {
    const unmanagedLeadsCount = leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length;

    return {
        unmanagedLeadsCount,
        isLeadFullyManaged,
        getLeadProgress,
        getLeadAging
    };
};
