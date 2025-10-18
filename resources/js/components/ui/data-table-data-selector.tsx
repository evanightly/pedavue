import { cn } from '@/lib/utils';
import { FilterOptions, Resource } from '@/types';
import { useDebounce } from '@uidotdev/usehooks';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import { ChangeEvent, memo, useEffect, useMemo, useState } from 'react';

interface DataTableDataSelectorProps<T extends Resource> {
    /**
     * ID for the GenericDataSelector component
     */
    id?: string;

    /**
     * Data to display in the list, e.g. manual state control
     *
     * Usage:
     * const [data, setData] = useState<UserResource[]>([]);
     * <GenericDataSelector data={data} />
     */
    data?: T[];

    /**
     * Function to fetch data based on filters
     * This function should accept an object with the search term
     * and may resolve to an array of resources or a raw response
     * that can be transformed via the dataMapper prop.
     *
     * Usage:
     * fetchData={(filters) => fetchUsers(filters)}
     * @param filters
     */
    fetchData?: (filters: FilterOptions) => Promise<T[] | unknown>;

    /**
     * Function to set the selected data
     * This function should accept the identifier of the selected data
     * (numeric or string) or null when clearing the selection.
     *
     * Usage:
     * setSelectedData={(id) => setData({ ...data, progress_id: id })}
     * @param id
     */
    setSelectedData: (id: number | string | null) => void;

    /**
     * Placeholder text for the search input
     * Default is 'Search...'
     */
    customSearchPlaceholder?: string;

    /**
     * Placeholder text for the button
     * Default is 'Select...'
     */
    placeholder?: string;

    /**
     * ID of the currently selected data (number or string)
     * If this is set, the label for the selected data will be displayed in the button
     */
    selectedDataId?: number | string | null;

    /**
     * Function to render each item in the list
     * This function should return a string to display in the list
     *
     * Usage:
     * renderItem={(item: UserResource) => `${item.name} - ${item.location}`}
     * @param item
     */
    renderItem: (item: T) => string;

    /**
     * Initial search term
     * Useful for pre-populating the search input, e.g. when editing
     */
    initialSearch?: string;

    /**
     * Key to use as the label for each item
     * Default is 'name'
     * Can be overridden to use a different key
     *
     * Dynamic label key for the entity (e.g., 'name', 'location', 'username')
     */
    labelKey?: keyof T;

    /**
     * Optional class name for the button
     * Useful for custom styling
     */
    buttonClassName?: string;

    /**
     * Optional class name for the popover content
     * Useful for custom styling
     */
    popoverContentClassName?: string;

    /**
     * Allow the selection to be cleared
     * If true, a '- Clear Selection -' option will be displayed
     */
    nullable?: boolean;

    /**
     * Custom label function
     * This function is called to generate the label for each item in the list
     *
     * Usage:
     * customLabel={(item: UserResource) => `${item.name} - ${item.location}`}
     * @param item
     */
    customLabel?: (item: T) => string;

    /**
     * Allows mapping the fetch response to the expected resource array shape
     *
     * Usage:
     * dataMapper={(response) => response.data as UserResource[]}
     * @param response
     */
    dataMapper?: (response: any) => T[] | undefined;

    /**
     * Function to call when the search term changes
     * This function should accept the new search term
     *
     * Usage:
     * onSearchChange={(searchTerm) => console.log(searchTerm)}
     * @param searchTerm
     */
    onSearchChange?: (searchTerm: string) => void;

    /**
     * Disable the search state
     * If false, the search input will not be disabled
     * Default is true
     */
    disabledSearchState?: boolean;
}

const DataTableDataSelector = <T extends Resource>({
    id,
    data,
    fetchData,
    setSelectedData,
    placeholder = 'Select...',
    selectedDataId,
    renderItem,
    initialSearch,
    labelKey = 'name' as keyof T, // Default to 'name' but can be overridden
    buttonClassName,
    popoverContentClassName,
    nullable,
    customLabel,
    customSearchPlaceholder,
    onSearchChange,
    disabledSearchState = true,
    dataMapper,
}: DataTableDataSelectorProps<T>) => {
    const [searchTerm, setSearchTerm] = useState(initialSearch ?? '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [fetchedData, setFetchedData] = useState<T[]>([]);
    const [openPopover, setOpenPopover] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!fetchData || data) {
            return;
        }

        let isActive = true;

        const load = async () => {
            setIsFetching(true);

            const filters: FilterOptions = {};
            const normalizedSearch = debouncedSearchTerm.trim();

            if (normalizedSearch.length > 0) {
                filters.search = normalizedSearch;
            }

            try {
                const response = await fetchData(filters);

                if (!isActive) {
                    return;
                }

                const mapped = dataMapper ? dataMapper(response) : response;
                setFetchedData(Array.isArray(mapped) ? (mapped as T[]) : []);
            } catch (error) {
                console.error('Failed to fetch selector options', error);

                if (isActive) {
                    setFetchedData([]);
                }
            } finally {
                if (isActive) {
                    setIsFetching(false);
                }
            }
        };

        void load();

        return () => {
            isActive = false;
        };
    }, [data, dataMapper, debouncedSearchTerm, fetchData]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (onSearchChange) {
            onSearchChange(e.target.value);
        }
    };

    const handleSelectItem = (id: number | string) => {
        setSelectedData(id);
        setOpenPopover(false);
    };

    const handleClearItem = () => {
        setSelectedData(null);
        setOpenPopover(false);
    };

    const getLabel = (item: T): string => {
        if (customLabel) {
            return customLabel(item);
        }
        const value = item[labelKey];
        return typeof value === 'string' ? value : 'Select...';
    };

    const items = data ?? fetchedData;

    const selectedItem = useMemo(() => {
        if (!selectedDataId) {
            return undefined;
        }

        return items.find((item) => String(item.id) === String(selectedDataId));
    }, [items, selectedDataId]);

    const buttonLabel = useMemo(() => {
        if (selectedItem) {
            return getLabel(selectedItem);
        }

        if (selectedDataId !== undefined && selectedDataId !== null && selectedDataId !== '') {
            return `#${selectedDataId}`;
        }

        return placeholder;
    }, [placeholder, selectedDataId, selectedItem]);

    return (
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger id={id} asChild>
                <Button variant='outline' role='combobox' className={cn('w-full justify-between', buttonClassName)} aria-expanded={openPopover}>
                    {buttonLabel}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('w-[200px] p-0', popoverContentClassName)}>
                <Command shouldFilter={false}>
                    <CommandInput
                        value={searchTerm}
                        placeholder={customSearchPlaceholder ?? 'Search...'}
                        onInput={handleSearchChange}
                        disabled={disabledSearchState && isFetching}
                        className='border-none focus:ring-0'
                    />
                    <CommandList>
                        <CommandGroup>
                            {nullable && <CommandItem onSelect={handleClearItem}>Clear Selection</CommandItem>}
                            {isFetching && <CommandItem disabled>Loading...</CommandItem>}
                            {!isFetching && items.length === 0 && <CommandItem disabled>No results found</CommandItem>}
                            {!isFetching &&
                                items.map((item) => {
                                    const isSelected = selectedDataId !== undefined && selectedDataId !== null && String(selectedDataId) === String(item.id);

                                    return (
                                        <CommandItem onSelect={() => handleSelectItem(item.id)} key={String(item.id)}>
                                            <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                            {renderItem(item)}
                                        </CommandItem>
                                    );
                                })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default memo(DataTableDataSelector) as typeof DataTableDataSelector;
