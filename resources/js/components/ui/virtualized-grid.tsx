import { useEffect, useRef, useState } from 'react';

interface VirtualizedGridProps<T> {
    items: T[] | null | undefined;
    renderItem: (item: T, index: number) => React.ReactNode;
    minItemWidth?: number;
    itemHeight?: number;
    gap?: number;
    height?: string | number;
    className?: string;
    emptyState?: React.ReactNode;
}

export function VirtualizedGrid<T>({
    items,
    renderItem,
    minItemWidth = 320,
    itemHeight = 350,
    gap = 16,
    height = '70vh',
    className = '',
    emptyState,
}: VirtualizedGridProps<T>) {
    // Early return for empty/null items
    const safeItems = items || [];

    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({
        width: 0,
        columns: 1,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Calculate grid dimensions
    useEffect(() => {
        const calculateDimensions = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.clientWidth;

            // Only proceed if we have actual dimensions
            if (containerWidth === 0) {
                // Retry after a short delay to allow for layout
                setTimeout(calculateDimensions, 100);
                return;
            }

            const columns = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));

            setDimensions({
                width: containerWidth,
                columns,
            });
            setIsLoading(false);
        };

        // Initial calculation with a small delay to ensure layout is complete
        const timeoutId = setTimeout(calculateDimensions, 50);

        const resizeObserver = new ResizeObserver(() => {
            calculateDimensions();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [minItemWidth, gap]);

    // Force recalculation when items change
    useEffect(() => {
        if (safeItems.length > 0 && dimensions.width === 0) {
            setIsLoading(true);
            // Recalculate dimensions when items change
            const timeoutId = setTimeout(() => {
                if (containerRef.current) {
                    const containerWidth = containerRef.current.clientWidth;
                    if (containerWidth > 0) {
                        const columns = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));
                        setDimensions((prev) => ({
                            ...prev,
                            width: containerWidth,
                            columns,
                        }));
                        setIsLoading(false);
                    }
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [safeItems.length, gap, minItemWidth]);

    if (safeItems.length === 0 && emptyState) {
        return (
            <div ref={containerRef} className={className} style={{ height }}>
                <div className='flex h-full items-center justify-center'>{emptyState}</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={className} style={{ height }}>
            {isLoading && safeItems.length > 0 ? (
                <div className='flex h-full items-center justify-center'>
                    <div className='text-muted-foreground'>Loading...</div>
                </div>
            ) : dimensions.width > 0 && safeItems.length > 0 ? (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${dimensions.columns}, 1fr)`,
                        gap: `${gap}px`,
                        width: '100%',
                        height: '100%',
                        overflow: 'auto',
                    }}
                >
                    {safeItems.map((item, index) => (
                        <div key={index}>{renderItem(item, index)}</div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
