// resources/js/components/ui/column-filters.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import GenericDataSelector from '@/components/ui/data-table-data-selector';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { FilterOptions } from '@/types';
import axios from 'axios';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';
import { ColumnFilter } from './data-table-types';

interface ColumnFilterProps extends React.HTMLAttributes<HTMLDivElement> {
    column: {
        id: string;
        header: string;
    };
    filter: ColumnFilter;
    value?: any;
    onChange: (value: any) => void;
    onClear: () => void;
}

export function ColumnFilterComponent({ column, filter, value, onChange, onClear, className }: ColumnFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasValue = value !== undefined && value !== null && value !== '';

    const renderFilter = () => {
        switch (filter.type) {
            case 'text':
                return (
                    <div className={cn('w-64 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <Input
                            placeholder={filter.placeholder || `Filter ${column.header.toLowerCase()}...`}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className='w-full'
                        />
                    </div>
                );

            case 'select':
                return (
                    <div className={cn('w-64 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <Select value={value || ''} onValueChange={onChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={filter.placeholder || `Select ${column.header.toLowerCase()}...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'multiselect':
                return (
                    <div className={cn('w-72 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <div className='max-h-48 space-y-2 overflow-y-auto'>
                            {filter.options?.map((option) => {
                                const selectedValues = Array.isArray(value) ? value : [];
                                const isChecked = selectedValues.includes(option.value);

                                return (
                                    <div key={option.value} className='flex items-center space-x-2'>
                                        <Checkbox
                                            id={`${column.id}-${option.value}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                                const currentValues = Array.isArray(value) ? value : [];
                                                if (checked) {
                                                    onChange([...currentValues, option.value]);
                                                } else {
                                                    onChange(currentValues.filter((v: string) => v !== option.value));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`${column.id}-${option.value}`} className='text-sm'>
                                            {option.label}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'number':
                return (
                    <div className={cn('w-64 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <Input
                            type='number'
                            placeholder={filter.placeholder || `Filter ${column.header.toLowerCase()}...`}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                            min={filter.min}
                            max={filter.max}
                            step={filter.step || 1}
                            className='w-full'
                        />
                    </div>
                );

            case 'numberrange':
                const rangeValue = Array.isArray(value) ? value : [filter.min || 0, filter.max || 100];
                return (
                    <div className={cn('w-80 p-4', className)}>
                        <Label className='mb-3 block text-sm font-medium'>{column.header}</Label>
                        <div className='space-y-4'>
                            <Slider
                                value={rangeValue}
                                onValueChange={onChange}
                                min={filter.min || 0}
                                max={filter.max || 100}
                                step={filter.step || 1}
                                className='w-full'
                            />
                            <div className='flex justify-between text-xs text-muted-foreground'>
                                <span>{rangeValue[0]}</span>
                                <span>{rangeValue[1]}</span>
                            </div>
                        </div>
                    </div>
                );

            case 'boolean':
                return (
                    <div className={cn('w-64 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <Select value={value?.toString() || ''} onValueChange={(val) => onChange(val === 'true')}>
                            <SelectTrigger>
                                <SelectValue placeholder='Select...' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='true'>Yes</SelectItem>
                                <SelectItem value='false'>No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'selector':
                return (
                    <div className={cn('w-72 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <GenericDataSelector
                            placeholder={filter.placeholder || `Select ${column.header.toLowerCase()}...`}
                            customSearchPlaceholder={filter.searchPlaceholder || 'Search...'}
                            selectedDataId={value ? parseInt(value) : null}
                            setSelectedData={(id: number | null) => onChange(id?.toString() || null)}
                            fetchData={async (filters: FilterOptions) => {
                                if (!filter.fetchDataUrl) return [];
                                try {
                                    const response = await axios.get(filter.fetchDataUrl, {
                                        params: {
                                            'filter[search]': filters.search,
                                            page_size: 50, // Limit results for selector
                                        },
                                        headers: {
                                            Accept: 'application/json',
                                        },
                                    });
                                    // Handle paginated response format
                                    return response.data.data || response.data;
                                } catch (error) {
                                    console.error('Error fetching selector data:', error);
                                    return [];
                                }
                            }}
                            renderItem={(item: any) => item[filter.labelKey || 'name']}
                            labelKey={(filter.labelKey as any) || 'name'}
                            nullable={true}
                        />
                    </div>
                );

            case 'date':
                return (
                    <div className={cn('w-80 p-4', className)}>
                        <Label className='mb-2 block text-sm font-medium'>{column.header}</Label>
                        <Calendar
                            mode='single'
                            selected={value ? new Date(value) : undefined}
                            onSelect={(date) => onChange(date?.toISOString().split('T')[0])}
                            className='rounded-md border'
                        />
                    </div>
                );

            case 'daterange':
                const dateRange = Array.isArray(value) ? value : [null, null];
                const fromDate = dateRange[0] ? new Date(dateRange[0]) : undefined;
                const toDate = dateRange[1] ? new Date(dateRange[1]) : undefined;

                return (
                    <div className={cn('w-96 p-4', className)}>
                        <Label className='mb-3 block text-sm font-medium'>{column.header}</Label>
                        <DateRangePicker
                            initialDateFrom={fromDate}
                            initialDateTo={toDate || fromDate}
                            align='start'
                            locale='en-US'
                            showCompare={false}
                            onUpdate={({ range }) => {
                                const from = range.from ? range.from.toISOString().split('T')[0] : null;
                                const to = range.to ? range.to.toISOString().split('T')[0] : null;
                                onChange([from, to]);
                            }}
                        />
                    </div>
                );

            case 'custom':
                if (filter.component) {
                    const CustomComponent = filter.component;
                    return <CustomComponent column={column} value={value} onChange={onChange} onClear={onClear} />;
                }
                return null;

            default:
                return null;
        }
    };

    const getDisplayValue = () => {
        if (!hasValue) return null;

        switch (filter.type) {
            case 'multiselect':
                const selectedOptions = filter.options?.filter((opt) => Array.isArray(value) && value.includes(opt.value)) || [];
                return selectedOptions.length > 0 ? `${selectedOptions.length} selected` : null;

            case 'select':
                const selectedOption = filter.options?.find((opt) => opt.value === value);
                return selectedOption?.label || value;

            case 'numberrange':
                return Array.isArray(value) ? `${value[0]} - ${value[1]}` : null;

            case 'daterange':
                if (Array.isArray(value) && value[0]) {
                    const fromDate = new Date(value[0]);
                    const toDate = value[1] ? new Date(value[1]) : null;

                    if (value[0] === value[1]) {
                        // Same date - show as single date
                        return fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }

                    if (toDate) {
                        // Date range
                        return `${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    }

                    // Only from date
                    return `From ${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                }
                return null;

            case 'boolean':
                return value ? 'Yes' : 'No';

            case 'custom':
                if (filter.getDisplayValue) {
                    return filter.getDisplayValue(value);
                }
                return value ? 'Custom filter applied' : null;

            default:
                return String(value);
        }
    };

    const displayValue = getDisplayValue();

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant='ghost' size='sm' className={cn('h-8 border-dashed', hasValue && 'border-solid bg-muted/50')}>
                    <Filter />
                    {displayValue && (
                        <>
                            <Badge variant='secondary' className='mr-1 text-xs'>
                                {displayValue}
                            </Badge>
                        </>
                    )}
                    {column.header}
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
                {renderFilter()}
                {hasValue && (
                    <div className='border-t p-2'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                onClear();
                                setIsOpen(false);
                            }}
                            className='w-full text-muted-foreground'
                        >
                            <X className='mr-2 h-3 w-3' />
                            Clear Filter
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
