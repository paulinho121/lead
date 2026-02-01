
import React from 'react';
import { LayoutDashboard, Users, FileSearch, BookOpen, PhoneCall, Mail, ShieldAlert, Trophy } from 'lucide-react';

export const COLORS = {
  primary: '#00A38E',
  secondary: '#64748b',
  success: '#00A38E',
  danger: '#ef4444',
  warning: '#f59e0b',
};

export const NAVIGATION = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'leads', name: 'Base de Leads', icon: <Users size={20} /> },
  { id: 'enrich', name: 'Enriquecer PDF', icon: <FileSearch size={20} /> },
  { id: 'crm', name: 'Organização (CRM)', icon: <PhoneCall size={20} /> },
  { id: 'mural', name: 'Mural de Atendimentos', icon: <Trophy size={20} /> },
  { id: 'strategy', name: 'Conversão & Estratégia', icon: <Mail size={20} /> },
  { id: 'admin', name: 'Admin (Master)', icon: <ShieldAlert size={20} /> },
];

export const validateCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/[^\d]/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

export const normalizePhone = (phone: string): string => {
  const clean = phone.replace(/[^\d]/g, '');
  if (!clean) return '';
  if (clean.startsWith('55')) return `+${clean}`;
  return `+55${clean}`;
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
