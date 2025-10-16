'use client';

import { useTheme, type Theme } from '@/hooks/use-theme';
import { getAvailableThemes } from '@/utils/generated-themes';
import { Check, SwatchBook } from 'lucide-react';
import { useRef, useState } from 'react';
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
    const [open, setOpen] = useState(false);

    const changeTheme = async (newTheme: Theme) => {
        if (!themeButtonRef.current || newTheme === currentTheme) return;

        await document.startViewTransition(() => {
            flushSync(() => {
                updateTheme(newTheme);
            });
        }).ready;

        const { top, left, width, height } = themeButtonRef.current.getBoundingClientRect();
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
                    Theme
                </DropdownMenuItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {themes.map((theme) => (
                    <DropdownMenuItem
                        ref={theme.value === currentTheme ? themeButtonRef : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            changeTheme(theme.value);
                        }}
                        key={theme.value}
                    >
                        {theme.label}
                        {currentTheme === theme.value && <Check className='ml-2 h-4 w-4' />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
