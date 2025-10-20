import { cn } from '@/lib/utils';
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useCallback, useMemo, useRef } from 'react';

type CertificateOverlayBoxProps = {
    editable: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    onPositionChange: (value: { x: number; y: number }) => void;
    onSizeChange?: (value: { width: number; height: number }) => void;
    children?: ReactNode;
    guidance?: ReactNode;
    className?: string;
    isSelected?: boolean;
    onSelect?: () => void;
    resizeHandle?: ReactNode;
};

const MIN_BOX_PERCENT = 5;
const MAX_BOX_PERCENT = 100;

export function CertificateOverlayBox({
    editable,
    position,
    size,
    onPositionChange,
    onSizeChange,
    children,
    guidance,
    className,
    isSelected = false,
    onSelect,
    resizeHandle,
}: CertificateOverlayBoxProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

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
            onPositionChange({
                x: Math.round(next.x * 100) / 100,
                y: Math.round(next.y * 100) / 100,
            });
        },
        [clampPosition, onPositionChange],
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

            onSelect?.();

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
        [applyPosition, editable, onSelect, position],
    );

    const startResize = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!editable || !onSizeChange) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const overlay = overlayRef.current;
            if (!overlay) {
                return;
            }

            onSelect?.();

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

                onSizeChange({
                    width: Math.round(nextWidth * 100) / 100,
                    height: Math.round(nextHeight * 100) / 100,
                });

                const clamped = clampPosition(initialPosition.x, initialPosition.y, nextWidth, nextHeight);
                onPositionChange({
                    x: Math.round(clamped.x * 100) / 100,
                    y: Math.round(clamped.y * 100) / 100,
                });
            };

            const handlePointerUp = () => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp, { once: true });
        },
        [clampPosition, editable, onPositionChange, onSelect, onSizeChange, position, size],
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

    return (
        <div ref={overlayRef} className='pointer-events-none absolute inset-0 select-none' role='presentation'>
            <div
                ref={boxRef}
                className={cn(
                    'pointer-events-auto absolute translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded border border-white/70 bg-black/20 shadow-lg backdrop-blur-sm transition',
                    editable ? 'cursor-move' : 'cursor-default',
                    isSelected ? 'ring-2 ring-primary' : '',
                    className,
                )}
                style={boxStyle}
                onPointerDown={startDrag}
            >
                <div className='h-full w-full'>{children}</div>
                {editable && onSizeChange ? (
                    <div
                        role='presentation'
                        onPointerDown={startResize}
                        className='absolute bottom-2 right-2 flex h-6 w-6 cursor-se-resize items-center justify-center rounded bg-white/85 text-black shadow'
                    >
                        {resizeHandle ?? (
                            <svg viewBox='0 0 24 24' className='h-4 w-4 text-black/70' aria-hidden>
                                <path d='M9 15h6v6M15 9h6v6M3 9h6v6' stroke='currentColor' strokeWidth='2' fill='none' />
                            </svg>
                        )}
                    </div>
                ) : null}
            </div>
            {guidance ? (
                <div className='pointer-events-none absolute inset-x-4 bottom-4 flex justify-center text-center text-xs text-white/85'>{guidance}</div>
            ) : null}
        </div>
    );
}
