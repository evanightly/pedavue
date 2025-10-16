import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface MasonryGridProps<T> {
    items: T[] | null | undefined;
    renderItem: (item: T, index: number) => React.ReactNode;
    minItemWidth?: number;
    gap?: number;
    className?: string;
    emptyState?: React.ReactNode;
}

export interface MasonryGridRef {
    recalculate: () => void;
}

export const MasonryGrid = forwardRef<MasonryGridRef, MasonryGridProps<any>>((props, ref) => {
    const { items, renderItem, minItemWidth = 320, gap = 16, className = '', emptyState } = props;
    const safeItems = items || [];
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [dimensions, setDimensions] = useState({
        width: 0,
        columns: 1,
        columnWidth: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [columnHeights, setColumnHeights] = useState<number[]>([]);
    const [layoutComplete, setLayoutComplete] = useState(false);
    const [stableHeight, setStableHeight] = useState(0);

    // Calculate container dimensions and columns
    useEffect(() => {
        const calculateDimensions = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.clientWidth;

            if (containerWidth === 0) {
                setTimeout(calculateDimensions, 100);
                return;
            }

            const columns = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));
            const columnWidth = (containerWidth - (columns - 1) * gap) / columns;

            setDimensions({
                width: containerWidth,
                columns,
                columnWidth,
            });
            setColumnHeights(new Array(columns).fill(0));
            setIsLoading(false);
        };

        const timeoutId = setTimeout(calculateDimensions, 50);

        const resizeObserver = new ResizeObserver(() => {
            setLayoutComplete(false);
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

    // Masonry layout calculation
    useEffect(() => {
        if (!isLoading && dimensions.columns > 0 && safeItems.length > 0 && !layoutComplete) {
            const layoutItems = () => {
                const newColumnHeights = new Array(dimensions.columns).fill(0);
                let allItemsPositioned = true;

                itemRefs.current.forEach((itemRef, index) => {
                    if (itemRef && index < safeItems.length) {
                        // Reset position to get natural height
                        itemRef.style.position = 'static';
                        itemRef.style.width = `${dimensions.columnWidth}px`;

                        // Force reflow to get accurate height
                        itemRef.offsetHeight;

                        const itemHeight = itemRef.offsetHeight;

                        // Find the shortest column
                        const shortestColumnIndex = newColumnHeights.indexOf(Math.min(...newColumnHeights));

                        // Position the item
                        const leftPosition = shortestColumnIndex * (dimensions.columnWidth + gap);
                        const topPosition = newColumnHeights[shortestColumnIndex];

                        itemRef.style.position = 'absolute';
                        itemRef.style.left = `${leftPosition}px`;
                        itemRef.style.top = `${topPosition}px`;
                        itemRef.style.width = `${dimensions.columnWidth}px`;

                        // Update column height
                        newColumnHeights[shortestColumnIndex] += itemHeight + gap;
                    } else {
                        allItemsPositioned = false;
                    }
                });

                setColumnHeights(newColumnHeights);

                if (allItemsPositioned) {
                    setLayoutComplete(true);
                    // Update stable height only when layout is complete
                    const maxHeight = Math.max(...newColumnHeights);
                    setStableHeight(maxHeight);
                }
            };

            // Use requestAnimationFrame for better timing
            const frameId = requestAnimationFrame(layoutItems);

            return () => cancelAnimationFrame(frameId);
        }
    }, [isLoading, dimensions, safeItems.length, layoutComplete, gap]);

    // Reset layout when items change
    useEffect(() => {
        setLayoutComplete(false);
        setStableHeight(0);
        itemRefs.current = itemRefs.current.slice(0, safeItems.length);
    }, [safeItems.length]);

    // Expose recalculate method via ref
    useImperativeHandle(
        ref,
        () => ({
            recalculate: () => {
                setLayoutComplete(false);
                setStableHeight(0);
            },
        }),
        [],
    );

    // Handle image loading to trigger relayout
    useEffect(() => {
        if (containerRef.current && !layoutComplete) {
            const images = containerRef.current.querySelectorAll('img');
            let loadedImages = 0;
            const totalImages = images.length;

            if (totalImages === 0) return;

            const onImageLoad = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    setLayoutComplete(false); // Trigger relayout after images load
                }
            };

            images.forEach((img) => {
                if (img.complete) {
                    onImageLoad();
                } else {
                    img.addEventListener('load', onImageLoad, { once: true });
                    img.addEventListener('error', onImageLoad, { once: true });
                }
            });
        }
    }, [safeItems.length, layoutComplete]);

    if (safeItems.length === 0 && emptyState) {
        return (
            <div ref={containerRef} className={className} style={{ minHeight: '400px' }}>
                <div className='flex h-full items-center justify-center'>{emptyState}</div>
            </div>
        );
    }

    const totalHeight = columnHeights.length > 0 ? Math.max(...columnHeights) : 0;
    const displayHeight = layoutComplete ? stableHeight : Math.max(stableHeight, totalHeight);

    return (
        <div ref={containerRef} className={className}>
            {dimensions.width > 0 && safeItems.length > 0 ? (
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: displayHeight > 0 ? `${displayHeight}px` : 'auto',
                        minHeight: '400px', // Stable minimum height
                        transition: layoutComplete ? 'height 0.3s ease' : 'none',
                    }}
                >
                    {safeItems.map((item, index) => (
                        <div
                            key={index}
                            ref={(el) => {
                                itemRefs.current[index] = el;
                            }}
                            style={{
                                position: 'absolute',
                                transition: 'opacity 0.2s ease',
                                opacity: isLoading ? 0 : 1,
                            }}
                        >
                            {renderItem(item, index)}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
});
