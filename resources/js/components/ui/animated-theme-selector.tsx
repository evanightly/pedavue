'use client';

import { useTheme, type Theme } from '@/hooks/use-theme';
import { getAvailableThemes } from '@/lib/generated-themes';
import { Check, SwatchBook } from 'lucide-react';
import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

type Props = {
    className?: string;
};

// Get themes automatically from CSS
const themes = getAvailableThemes();

export const AnimatedThemeSelector = ({ className }: Props) => {
    const { theme: currentTheme, updateTheme } = useTheme();
    const themeButtonRef = useRef<HTMLDivElement | null>(null);

    const changeTheme = async (newTheme: Theme, anchor: HTMLElement) => {
        if (newTheme === currentTheme) {
            return;
        }

        const pivotElement = themeButtonRef.current ?? anchor;

        if (!document.startViewTransition) {
            updateTheme(newTheme);
            return;
        }

        await document
            .startViewTransition(() => {
                flushSync(() => {
                    updateTheme(newTheme);
                });
            })
            .ready;

        const { top, left, width, height } = pivotElement.getBoundingClientRect();
        const y = top + height / 2;
        const x = left + width / 2;

        const right = window.innerWidth - left;
        const bottom = window.innerHeight - top;
        const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

        document.documentElement.animate(
            {
                clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRad}px at ${x}px ${y}px)`],
            },
            {
                duration: 700,
                easing: 'ease-in-out',
                pseudoElement: '::view-transition-new(root)',
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <DropdownMenuItem>
                    <SwatchBook />
                    Tema
                </DropdownMenuItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {themes.map((theme) => (
                    <DropdownMenuItem
                        ref={theme.value === currentTheme ? themeButtonRef : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            changeTheme(theme.value, e.currentTarget);
                        }}
                        key={theme.value}
                    >
                        {theme.label}
                        {currentTheme === theme.value && <Check />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
