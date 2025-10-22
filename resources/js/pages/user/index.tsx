import UserController from '@/actions/App/Http/Controllers/UserController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnFilterMeta, DataTableFilters, PaginationMeta } from '@/components/ui/data-table-types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { confirm } from '@/lib/confirmation-utils';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react';

type User = App.Data.User.UserData;

interface UserIndexProps {
    users: PaginationMeta & { data: User[] };
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
}

export default function UserIndex({ users, filters = null, sort = null, filteredData: initialFilteredData = null }: UserIndexProps) {
    const resolveDestroyUrl = useCallback((id: number) => UserController.destroy(id).url, []);
    const handleDelete = useCallback(
        (id: number) => {
            confirm.delete('This action cannot be undone. Delete this user?', () => {
                router.delete(resolveDestroyUrl(id), {
                    preserveScroll: true,
                    preserveState: false,
                });
            });
        },
        [resolveDestroyUrl],
    );

    const filteredData = initialFilteredData ?? undefined;
    const searchValue = typeof filters?.search === 'string' ? filters.search : '';
    const activeSort = typeof sort === 'string' ? sort : undefined;
    const columnFilters =
        filters?.columnFilters && typeof filters.columnFilters === 'object' && !Array.isArray(filters.columnFilters)
            ? (filters.columnFilters as Record<string, unknown>)
            : {};
    const columns = useMemo<(ColumnDef<User> & ColumnFilterMeta)[]>(
        () => [
            {
                id: 'id',
                accessorKey: 'id',
                header: 'ID',
                cell: ({ row }) => <span className='text-sm font-medium text-foreground'>{row.original.id}</span>,
                enableSorting: true,
                enableFiltering: false,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: 'Name',
                cell: ({ getValue, row }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return (
                        <div className='flex items-center gap-2'>
                            <Avatar>
                                <AvatarImage className='object-cover' src={row.original?.avatar_url ?? ''} alt={row.original?.name ?? ''} />
                                <AvatarFallback>{row.original?.name?.charAt(0).toUpperCase() ?? '?'}</AvatarFallback>
                            </Avatar>
                            {String(value)}
                        </div>
                    );
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by name...' },
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: 'Email',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by email...' },
            },
            {
                id: 'roles',
                accessorKey: 'roles',
                header: 'Roles',
                cell: ({ row }) => {
                    const roles = row.original.roles;
                    if (!roles || roles.length === 0) {
                        return '—';
                    }
                    return roles.map((role) => role.name).join(', ');
                },
                enableSorting: false,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by roles...' },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: 'Created At',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter by created at...' },
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: 'Updated At',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter by updated at...' },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem asChild>
                                    <Link href={UserController.show(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        View
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={UserController.edit(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        handleDelete(row.original.id);
                                    }}
                                    className='flex items-center gap-2 text-sm text-destructive focus:text-destructive'
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
                enableSorting: false,
                enableFiltering: false,
            },
        ],
        [handleDelete],
    );

    return (
        <AppLayout>
            <Head title='Users' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Notes</h1>
                        <p className='text-muted-foreground'>Manage users in one place.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        <Button asChild>
                            <Link href={UserController.create().url}>New User</Link>
                        </Button>
                    </div>
                </div>
                <DataTable<User>
                    title='Users'
                    data={users.data}
                    columns={columns}
                    pagination={users}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Search users...'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={UserController.index}
                    resetRoute={UserController.index().url}
                    emptyMessage='No users found'
                    emptyDescription='Try adjusting your filters or create a new user'
                />
            </div>
        </AppLayout>
    );
}
