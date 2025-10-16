/**
 * Auto-generated theme configuration
 * This file is generated from themes.css - do not edit manually
 * Run `npm run build:themes` to regenerate
 */

export type Theme =
    | 'default'
    | 'burgundy'
    | 'crimson'
    | 'crimson-elegant'
    | 'crimson-modern'
    | 'cyber'
    | 'forest'
    | 'fresh-red'
    | 'midnight'
    | 'mono'
    | 'ocean'
    | 'plum'
    | 'rosegold'
    | 'spectrum'
    | 'sunset'
    | 'sustainable'
    | 'triadic'
    | 'violet';

export const THEME_LABELS: Record<string, string> = {
    default: 'Default',
    burgundy: 'Burgundy',
    crimson: 'Crimson',
    'crimson-elegant': 'Crimson Elegant',
    'crimson-modern': 'Crimson Modern',
    cyber: 'Cyber',
    forest: 'Forest',
    'fresh-red': 'Fresh Red',
    midnight: 'Midnight',
    mono: 'Mono',
    ocean: 'Ocean',
    plum: 'Plum',
    rosegold: 'Rosegold',
    spectrum: 'Spectrum',
    sunset: 'Sunset',
    sustainable: 'Sustainable',
    triadic: 'Triadic',
    violet: 'Violet',
};

export const THEME_COLORS: Record<string, string> = {
    default: 'bg-gray-800',
    burgundy: 'bg-red-600',
    crimson: 'bg-red-500',
    'crimson-elegant': 'bg-red-500',
    'crimson-modern': 'bg-red-600',
    cyber: 'bg-green-600',
    forest: 'bg-green-700',
    'fresh-red': 'bg-red-500',
    midnight: 'bg-purple-500',
    mono: 'bg-gray-800',
    ocean: 'bg-blue-500',
    plum: 'bg-pink-500',
    rosegold: 'bg-orange-400',
    spectrum: 'bg-gray-800',
    sunset: 'bg-orange-400',
    sustainable: 'bg-cyan-500',
    triadic: 'bg-blue-700',
    violet: 'bg-purple-500',
};

export interface ThemeInfo {
    value: Theme;
    label: string;
    color: string;
}

export function getAvailableThemes(): ThemeInfo[] {
    const themes: Theme[] = [
        'default',
        'burgundy',
        'crimson',
        'crimson-elegant',
        'crimson-modern',
        'cyber',
        'forest',
        'fresh-red',
        'midnight',
        'mono',
        'ocean',
        'plum',
        'rosegold',
        'spectrum',
        'sunset',
        'sustainable',
        'triadic',
        'violet',
    ];

    return themes.map((theme) => ({
        value: theme,
        label: THEME_LABELS[theme] || formatThemeName(theme),
        color: THEME_COLORS[theme] || 'bg-gray-400',
    }));
}

function formatThemeName(themeName: string): string {
    return themeName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
