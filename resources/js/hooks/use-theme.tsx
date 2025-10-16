'use client';

import { useCallback, useEffect, useState } from 'react';

import { type Theme } from '@/lib/generated-themes';
export { type Theme } from '@/lib/generated-themes';
const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (theme: Theme) => {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.setAttribute('data-theme', theme);
};

// --- Global shared state (so multiple hook consumers stay in sync) ---
let themeState: Theme = 'default';
const subscribers = new Set<(value: Theme) => void>();
let bootstrapped = false;

function notify() {
    for (const cb of subscribers) {
        try {
            cb(themeState);
        } catch {
            // ignore subscriber errors
        }
    }
}

export function initializeTheme() {
    if (bootstrapped) {
        return;
    }
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'default';
    themeState = savedTheme;
    applyTheme(themeState);
    bootstrapped = true;
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(themeState);

    const updateTheme = useCallback((newTheme: Theme) => {
        themeState = newTheme;
        // Persist
        localStorage.setItem('theme', newTheme);
        setCookie('theme', newTheme);
        applyTheme(newTheme);
        notify();
    }, []);

    useEffect(() => {
        // Ensure initialization (in rare cases hook mounts before initializeTheme())
        if (!bootstrapped) {
            initializeTheme();
        }
        const listener = (value: Theme) => setTheme(value);
        subscribers.add(listener);
        // Sync immediate (in case global changed before we subscribed)
        setTheme(themeState);
        return () => {
            subscribers.delete(listener);
            if (subscribers.size === 0) {
                bootstrapped = false; // allow re-init in tests / hot reload
            }
        };
    }, []);

    return { theme, updateTheme } as const;
}
