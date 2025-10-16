import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from './components/ui/sonner';
import { initializeTheme } from './hooks/use-appearance';
import { initializeTheme as initializeColorTheme } from './hooks/use-theme';
import { addRippleEffect } from './lib/add-ripple-effect';

const appName = import.meta.env.VITE_APP_NAME || 'Aetherius';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;

            // Call addRippleEffect only if a ripple element or its descendant is clicked
            if (target.closest('.ripple')) {
                addRippleEffect(event as unknown as MouseEvent<HTMLElement>);
            }
        });

        root.render(
            <>
                <App {...props} />
                <Toaster position='top-right' richColors theme='light' className='pointer-events-auto' />
            </>,
        );
    },
    progress: {
        color: 'var(--color-primary)',
    },
});

// This will set light / dark mode and color theme on load...
initializeTheme();
initializeColorTheme();
