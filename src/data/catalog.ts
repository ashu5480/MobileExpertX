import type { AccessoryCategory, ProductCategory } from '@/types';

/* ── Phone categories (home "Shop by category" + shop filters) ───────────── */

export interface CategoryMeta {
  id: ProductCategory;
  label: string;
  tagline: string;
  description: string;
  accent: string;
  icon: 'sparkles' | 'bolt' | 'wallet' | 'repeat' | 'refresh';
  href: string;
}

export const phoneCategories: CategoryMeta[] = [
  {
    id: 'flagship',
    label: 'Flagship',
    tagline: 'Uncompromised',
    description: 'The best camera, the fastest silicon and the finest displays money can buy.',
    accent: '#10B981',
    icon: 'sparkles',
    href: '/shop?category=flagship',
  },
  {
    id: 'mid-range',
    label: 'Mid-Range',
    tagline: 'The sweet spot',
    description: 'Flagship features at half the price — the segment that actually makes sense.',
    accent: '#0D9488',
    icon: 'bolt',
    href: '/shop?category=mid-range',
  },
  {
    id: 'budget',
    label: 'Budget',
    tagline: 'Smart buys',
    description: 'Dependable everyday phones with more than enough power for what you need.',
    accent: '#6EE7B3',
    icon: 'wallet',
    href: '/shop?category=budget',
  },
  {
    id: 'foldable',
    label: 'Foldables',
    tagline: 'Future form',
    description: 'Large flexible displays that fold into a pocketable footprint.',
    accent: '#0D9488',
    icon: 'repeat',
    href: '/shop?category=foldable',
  },
  {
    id: 'refurbished',
    label: 'Refurbished',
    tagline: 'Up to 40% less',
    description: 'Grade-A professionally refurbished phones with a 90-day assurance warranty.',
    accent: '#10B981',
    icon: 'refresh',
    href: '/shop?category=refurbished',
  },
];

/* ── Accessory categories ───────────────────────────────────────────────── */

export interface AccessoryCategoryMeta {
  id: AccessoryCategory;
  label: string;
  description: string;
  icon: AccessoryIconKey;
}

export type AccessoryIconKey =
  | 'charger'
  | 'cable'
  | 'power-bank'
  | 'case'
  | 'protector'
  | 'earphones'
  | 'earbuds'
  | 'watch'
  | 'car-charger'
  | 'stand'
  | 'adapter'
  | 'grid';

export const accessoryCategories: AccessoryCategoryMeta[] = [
  { id: 'chargers', label: 'Chargers', description: 'GaN wall chargers from 20W to 100W', icon: 'charger' },
  { id: 'cables', label: 'Cables', description: 'Braided, E-marker certified USB-C cables', icon: 'cable' },
  { id: 'power-banks', label: 'Power Banks', description: 'Magnetic and standard portable batteries', icon: 'power-bank' },
  { id: 'cases', label: 'Cases', description: 'Rugged, clear and wallet-style protection', icon: 'case' },
  { id: 'screen-protectors', label: 'Screen Protectors', description: 'Tempered glass and hydrogel films', icon: 'protector' },
  { id: 'earphones', label: 'Earphones', description: 'Wired in-ear with balanced tuning', icon: 'earphones' },
  { id: 'wireless-earbuds', label: 'Wireless Earbuds', description: 'ANC earbuds with long battery life', icon: 'earbuds' },
  { id: 'smartwatches', label: 'Smartwatches', description: 'AMOLED fitness watches with health tracking', icon: 'watch' },
  { id: 'car-chargers', label: 'Car Chargers', description: 'Dual-port chargers for the dashboard', icon: 'car-charger' },
  { id: 'mobile-stands', label: 'Mobile Stands', description: 'Folding desktop and bedside stands', icon: 'stand' },
  { id: 'adapters', label: 'Adapters', description: 'Travel and international plug adapters', icon: 'adapter' },
  { id: 'other', label: 'Other Accessories', description: 'Mounts, holders and everyday essentials', icon: 'grid' },
];

/* ── Shop filter ranges (paise) ─────────────────────────────────────────── */

export const priceRanges = [
  { label: 'Under ₹15,000', min: 0, max: 1500000 },
  { label: '₹15,000 – ₹30,000', min: 1500000, max: 3000000 },
  { label: '₹30,000 – ₹60,000', min: 3000000, max: 6000000 },
  { label: '₹60,000 – ₹1,00,000', min: 6000000, max: 10000000 },
  { label: 'Above ₹1,00,000', min: 10000000, max: 30000000 },
];

export const ramOptions = ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'];

export const storageOptions = ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];

export const conditionLabels: Record<string, string> = {
  new: 'Brand New',
  refurbished: 'Refurbished',
  used: 'Used',
};

/* ── "Why choose us" trust pillars ──────────────────────────────────────── */

export const trustPillars = [
  {
    title: 'Verified Phones',
    body: 'Every device passes a 42-point inspection. Refurbished units are Grade-A only — never B-grade sold as A.',
    icon: 'shield-check',
  },
  {
    title: 'Transparent Pricing',
    body: 'The trade-in value you see is the value you get. No lowball offers, no deductions discovered later.',
    icon: 'indian-rupee',
  },
  {
    title: 'Expert Technicians',
    body: 'Component-level repairs under a microscope by technicians with 8+ years on real hardware.',
    icon: 'wrench',
  },
  {
    title: 'Secure Payments',
    body: 'UPI, cards and net banking through a PCI-compliant gateway. Secrets never touch the browser.',
    icon: 'lock',
  },
  {
    title: 'Fast Delivery',
    body: 'Same-day dispatch on orders placed before 4 PM, with live tracking over WhatsApp.',
    icon: 'truck',
  },
  {
    title: 'Customer Support',
    body: 'A real person on WhatsApp or the phone, seven days a week. No ticket purgatory.',
    icon: 'headset',
  },
] as const;

export const heroBadges = [
  { label: 'Verified Devices', icon: 'shield-check' },
  { label: 'Expert Repairs', icon: 'wrench' },
  { label: 'Secure Payments', icon: 'lock' },
  { label: 'Genuine Accessories', icon: 'badge-check' },
] as const;
