import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

type Alignment = 'left' | 'center' | 'right';

type CertificateNameOverlayProps = {
    editable: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    onPositionChange: (value: { x: number; y: number }) => void;
    onSizeChange: (value: { width: number; height: number }) => void;
    sampleText: string;
    guidance?: ReactNode;
    fontFamily: string;
    fontWeight: string;
    textAlign: Alignment;
    textColor: string;
    letterSpacing: number;
};

const MIN_BOX_PERCENT = 10;
const MAX_BOX_PERCENT = 100;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 128;

export function CertificateNameOverlay({
    editable,
    position,
    size,
    onPositionChange,
    onSizeChange,
    sampleText,
    guidance,
    fontFamily,
    fontWeight,
    textAlign,
    textColor,
    letterSpacing,
}: CertificateNameOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    const clampPosition = useCallback(
        (x: number, y: number, width: number = size.width, height: number = size.height) => {
            const halfWidth = width / 2;
            const halfHeight = height / 2;

            return {
                x: Math.min(100 - halfWidth, Math.max(halfWidth, x)),
                y: Math.min(100 - halfHeight, Math.max(halfHeight, y)),
            };
        },
        [size.height, size.width],
    );

    const applyPosition = useCallback(
        (x: number, y: number) => {
            const next = clampPosition(x, y);
            onPositionChange(next);
        },
        [clampPosition, onPositionChange],
    );

    const autoResizeText = useCallback(() => {
        const box = boxRef.current;
        const text = textRef.current;

        if (!box || !text) {
            return;
        }

        const boxRect = box.getBoundingClientRect();

        if (boxRect.width <= 0 || boxRect.height <= 0) {
            return;
        }

        let min = MIN_FONT_SIZE;
        let max = MAX_FONT_SIZE;
        let best = min;

        while (min <= max) {
            const mid = Math.floor((min + max) / 2);
            text.style.fontSize = `${mid}px`;
            const fits = text.scrollWidth <= boxRect.width && text.scrollHeight <= boxRect.height;

            if (fits) {
                best = mid;
                min = mid + 1;
            } else {
                max = mid - 1;
            }
        }

        text.style.fontSize = `${best}px`;
    }, []);

    useLayoutEffect(() => {
        autoResizeText();
    }, [autoResizeText, sampleText, size.height, size.width, fontFamily, fontWeight, textAlign, letterSpacing]);

    const handleBackgroundPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!editable) {
                return;
            }

            if (event.target !== overlayRef.current) {
                return;
            }

            const overlay = overlayRef.current;
            if (!overlay) {
                return;
            }

            const bounds = overlay.getBoundingClientRect();
            const relativeX = ((event.clientX - bounds.left) / bounds.width) * 100;
            const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100;

            applyPosition(relativeX, relativeY);
        },
        [applyPosition, editable],
    );

    const startDrag = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!editable) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const overlay = overlayRef.current;
            if (!overlay) {
                return;
            }

            const bounds = overlay.getBoundingClientRect();
            const startX = event.clientX;
            const startY = event.clientY;
            const initial = { ...position };

            const handlePointerMove = (moveEvent: PointerEvent) => {
                const deltaX = ((moveEvent.clientX - startX) / bounds.width) * 100;
                const deltaY = ((moveEvent.clientY - startY) / bounds.height) * 100;
                applyPosition(initial.x + deltaX, initial.y + deltaY);
            };

            const handlePointerUp = () => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp, { once: true });
        },
        [applyPosition, editable, position],
    );

    const startResize = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!editable) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const overlay = overlayRef.current;
            if (!overlay) {
                return;
            }

            const bounds = overlay.getBoundingClientRect();
            const startX = event.clientX;
            const startY = event.clientY;
            const initialSize = { ...size };
            const initialPosition = { ...position };

            const handlePointerMove = (moveEvent: PointerEvent) => {
                const deltaX = ((moveEvent.clientX - startX) / bounds.width) * 100;
                const deltaY = ((moveEvent.clientY - startY) / bounds.height) * 100;

                const nextWidth = Math.min(MAX_BOX_PERCENT, Math.max(MIN_BOX_PERCENT, initialSize.width + deltaX));
                const nextHeight = Math.min(MAX_BOX_PERCENT, Math.max(MIN_BOX_PERCENT, initialSize.height + deltaY));

                onSizeChange({ width: nextWidth, height: nextHeight });

                const clamped = clampPosition(initialPosition.x, initialPosition.y, nextWidth, nextHeight);
                onPositionChange(clamped);
            };

            const handlePointerUp = () => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp, { once: true });
        },
        [clampPosition, editable, onPositionChange, onSizeChange, position, size],
    );

    const boxStyle: CSSProperties = useMemo(
        () => ({
            left: `${position.x}%`,
            top: `${position.y}%`,
            width: `${size.width}%`,
            height: `${size.height}%`,
        }),
        [position.x, position.y, size.height, size.width],
    );

    const textStyle: CSSProperties = useMemo(
        () => ({
            fontFamily,
            fontWeight,
            textAlign,
            color: textColor,
            letterSpacing: `${letterSpacing}px`,
        }),
        [fontFamily, fontWeight, letterSpacing, textAlign, textColor],
    );

    return (
        <div
            ref={overlayRef}
            className='pointer-events-none absolute inset-0 select-none'
            onPointerDown={handleBackgroundPointerDown}
            role='presentation'
        >
            <div className='pointer-events-auto absolute inset-0'>
                <div
                    ref={boxRef}
                    className={cn(
                        'absolute flex translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded border border-white/70 bg-black/25 p-3 text-white shadow-lg backdrop-blur-sm transition-colors',
                        editable ? 'cursor-move' : 'cursor-default',
                    )}
                    style={boxStyle}
                    onPointerDown={startDrag}
                >
                    <div ref={textRef} className='w-full leading-tight' style={textStyle}>
                        {sampleText}
                    </div>
                    {editable ? (
                        <div
                            role='presentation'
                            onPointerDown={startResize}
                            className='absolute bottom-2 right-2 flex h-6 w-6 cursor-se-resize items-center justify-center rounded bg-white/80 text-black shadow'
                        >
                            <svg viewBox='0 0 24 24' className='h-4 w-4 text-black/70' aria-hidden>
                                <path d='M9 15h6v6M15 9h6v6M3 9h6v6' stroke='currentColor' strokeWidth='2' fill='none' />
                            </svg>
                        </div>
                    ) : null}
                </div>
            </div>
            {guidance ? (
                <div className='pointer-events-none absolute inset-x-4 bottom-4 flex justify-center text-center text-xs text-white/85'>{guidance}</div>
            ) : null}
        </div>
    );
}
