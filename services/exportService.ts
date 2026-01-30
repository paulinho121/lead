import { Lead } from '../types';

export const exportLeadsToCSV = (leads: Lead[]) => {
    const headers = [
        "ID",
        "CNPJ",
        "Razao Social",
        "Nome Fantasia",
        "Email",
        "Telefone",
        "Municipio",
        "UF",
        "Atividade Principal",
        "Status",
        "Fonte",
        "Capturado Em",
        "Instagram",
        "Resposta",
        "Observacoes"
    ].join(",");

    const escapeCSV = (val: string | undefined | boolean) => {
        if (val === undefined || val === null) return '""';
        // Remove potential newlines and escape quotes
        const escaped = val.toString().replace(/\n/g, ' ').replace(/"/g, '""');
        return `"${escaped}"`;
    };

    const csvContent = leads.map(l => [
        escapeCSV(l.id),
        escapeCSV(l.cnpj),
        escapeCSV(l.razaoSocial),
        escapeCSV(l.nomeFantasia),
        escapeCSV(l.email),
        escapeCSV(l.telefone),
        escapeCSV(l.municipio),
        escapeCSV(l.uf),
        escapeCSV(l.atividadePrincipal),
        escapeCSV(l.status),
        escapeCSV(l.source),
        escapeCSV(l.capturedAt),
        escapeCSV(l.instagram),
        escapeCSV(l.contactResponse),
        escapeCSV(l.observations)
    ].join(",")).join("\n");

    const blob = new Blob([headers + "\n" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_enriquecidos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};
