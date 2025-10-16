import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DataTableColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    column: {
        getCanSort: () => boolean;
        toggleSorting: (desc?: boolean, shiftKey?: boolean) => void;
        getIsSorted: () => false | 'asc' | 'desc';
    };
    title: string;
    sortIndex?: number; // For multi-sort indication
    enableMultiSort?: boolean;
}

export function DataTableColumnHeader({ column, title, className, sortIndex, enableMultiSort = false, ...props }: DataTableColumnHeaderProps) {
    if (!column.getCanSort()) {
        return (
            <div className={className} {...props}>
                {title}
            </div>
        );
    }

    const sortDirection = column.getIsSorted();
    const isActiveSorted = sortDirection !== false;

    return (
        <div className={cn('flex items-center space-x-2', className)} {...props}>
            <Button
                variant='ghost'
                onClick={(e) => column.toggleSorting(sortDirection === 'asc', e.shiftKey)}
                className='rounded p-2 group-[.table-compact]:h-8'
                title={enableMultiSort ? 'Click to sort. Shift+Click for multi-sort.' : 'Click to sort.'}
            >
                <span>{title}</span>
                <div className='flex items-center gap-1'>
                    {/* Sort Priority Badge for Multi-Sort */}
                    {enableMultiSort && isActiveSorted && sortIndex !== undefined && (
                        <Badge variant='secondary' className='ml-1 h-4 px-1 text-xs'>
                            {sortIndex + 1}
                        </Badge>
                    )}

                    {/* Sort Direction Icons */}
                    <div className='relative h-4 w-4'>
                        <ChevronUp
                            className={cn(
                                'absolute -top-1 size-4 transition-colors',
                                sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground',
                            )}
                        />
                        <ChevronDown
                            className={cn(
                                'absolute top-1 size-4 transition-colors',
                                sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground',
                            )}
                        />
                    </div>
                </div>
            </Button>
        </div>
    );
}
