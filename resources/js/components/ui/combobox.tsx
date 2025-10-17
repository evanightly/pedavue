'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    allowCustom?: boolean;
    name?: string;
    id?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = 'Select an option...',
    emptyText = 'No option found.',
    searchPlaceholder = 'Search...',
    allowCustom = false,
    name,
    id,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || '');
    const [searchValue, setSearchValue] = React.useState('');

    const currentValue = value !== undefined ? value : internalValue;

    const handleSelect = (selectedValue: string) => {
        const newValue = selectedValue === currentValue ? '' : selectedValue;
        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
        setOpen(false);
        setSearchValue('');
    };

    const handleCustomValue = () => {
        if (allowCustom && searchValue.trim()) {
            const newValue = searchValue.trim();
            if (value === undefined) {
                setInternalValue(newValue);
            }
            onValueChange?.(newValue);
            setOpen(false);
            setSearchValue('');
        }
    };

    const displayValue = React.useMemo(() => {
        const option = options.find((option) => option.value === currentValue);
        return option ? option.label : currentValue || placeholder;
    }, [currentValue, options, placeholder]);

    const filteredOptions = React.useMemo(() => {
        if (!searchValue) return options;
        return options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()));
    }, [options, searchValue]);

    const showCustomOption = allowCustom && searchValue.trim() && !filteredOptions.some((opt) => opt.value === searchValue.trim());

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant='outline'
                        role='combobox'
                        aria-expanded={open}
                        className='w-full justify-between font-normal'
                    >
                        <span className={cn(!currentValue && 'text-muted-foreground')}>{displayValue}</span>
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0' align='start'>
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onValueChange={setSearchValue}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && allowCustom && searchValue.trim()) {
                                    e.preventDefault();
                                    handleCustomValue();
                                }
                            }}
                        />
                        <CommandList>
                            <CommandEmpty className='p-0'>
                                {showCustomOption ? (
                                    <div className='px-2 py-1.5'>
                                        <button
                                            type='button'
                                            onClick={handleCustomValue}
                                            className='w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground'
                                        >
                                            Gunakan: &quot;{searchValue}&quot;
                                        </button>
                                    </div>
                                ) : (
                                    emptyText
                                )}
                            </CommandEmpty>
                            <CommandGroup className={cn(
                                showCustomOption && 'p-0'
                            )}>
                                {filteredOptions.map((option) => (
                                    <CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
                                        <Check
                                            className={cn('mr-2 h-4 w-4', currentValue === option.value ? 'opacity-100' : 'opacity-0')}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {/* Hidden input to submit the value with the form */}
            {name && <input type='hidden' name={name} value={currentValue} />}
        </>
    );
}
