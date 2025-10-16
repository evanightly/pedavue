import AppLayout from '@/layouts/app-layout';
import UserController from '@/actions/App/Http/Controllers/UserController';
import qp from '@/lib/qp';
import type { ChangeEvent, FormEvent } from 'react';
import type { DataTableFilters } from '@/components/ui/data-table-types';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { confirm } from '@/lib/confirmation-utils';
import { useCallback, useEffect, useRef, useState } from 'react';


export type UserRecord = App.Data.User.UserData;

export type UserCollection = PaginationMeta & {
  data: App.Data.User.UserData[];
};

interface UserIndexProps {
  users: UserCollection;
  filters?: DataTableFilters | null;
  sort?: string | null;
  filteredData?: Record<string, unknown> | null;
}

export default function UserIndex({ users, filters = null, sort = null, filteredData: initialFilteredData = null }: UserIndexProps) {
  const rows = Array.isArray(users?.data) ? users.data : [];
    void initialFilteredData;
  const paginationLinks = Array.isArray(users?.links)
    ? (users.links as Array<{ url: string | null; label?: unknown; active?: boolean }>)
    : [];
  const paginationMeta = (users?.meta as { from?: number; to?: number; total?: number } | undefined);
  const paginationSummary =
    paginationMeta &&
    typeof paginationMeta.from === 'number' &&
    typeof paginationMeta.to === 'number' &&
    typeof paginationMeta.total === 'number'
      ? `Showing ${paginationMeta.from} to ${paginationMeta.to} of ${paginationMeta.total} results`
      : null;

  const basePathTarget = UserController.index().url;
  const basePath =
    typeof basePathTarget === 'string'
      ? basePathTarget
      : basePathTarget && typeof basePathTarget === 'object' && 'url' in basePathTarget && typeof basePathTarget.url === 'string'
        ? basePathTarget.url
        : String(basePathTarget ?? '');
  const filtersRecord =
    filters && typeof filters === 'object' && !Array.isArray(filters)
      ? (filters as DataTableFilters)
      : null;
  const columnFilterRecord =
    filtersRecord &&
    typeof filtersRecord.columnFilters === 'object' &&
    filtersRecord.columnFilters !== null &&
    !Array.isArray(filtersRecord.columnFilters)
      ? (filtersRecord.columnFilters as Record<string, unknown>)
      : {};
  const searchFilter = (() => {
    const raw = filtersRecord ? filtersRecord.search : null;

    if (Array.isArray(raw)) {
      return raw.length > 0 ? String(raw[0]) : '';
    }

    if (raw === undefined || raw === null) {
      return '';
    }

    return String(raw);
  })();
  const activeSort = typeof sort === 'string' ? sort : '';
  const [filtersState, setFiltersState] = useState<{ search: string; sort: string }>(() => ({
    search: searchFilter,
    sort: activeSort,
  }));
  const [searchInput, setSearchInput] = useState(searchFilter);
  const syncFromServerRef = useRef(false);

  useEffect(() => {
    syncFromServerRef.current = true;
    setFiltersState({ search: searchFilter, sort: activeSort });
    setSearchInput(searchFilter);
  }, [searchFilter, activeSort]);

  useEffect(() => {
    if (syncFromServerRef.current) {
      syncFromServerRef.current = false;
      return;
    }

    const nextSearch = filtersState.search.trim();
    const nextSort = filtersState.sort ? String(filtersState.sort).trim() : '';

    if (nextSearch === searchFilter && nextSort === activeSort) {
      return;
    }

    const merge: Record<string, unknown> = {};
    const remove: Record<string, unknown> = {};

    const baseFilterValues = { ...columnFilterRecord };
    const hadSearch = typeof filtersRecord?.search === 'string' && filtersRecord.search.trim().length > 0;

    if (nextSearch.length > 0) {
      baseFilterValues.search = nextSearch;
    } else {
      delete baseFilterValues.search;
    }

    const filterKeys = Object.keys(baseFilterValues);

    if (filterKeys.length > 0) {
      merge.filter = baseFilterValues;
      if (hadSearch && nextSearch.length === 0) {
        remove.filter = { search: true };
      }
    } else if (Object.keys(columnFilterRecord).length > 0 || hadSearch) {
      remove.filter = true;
    }

    if (nextSort.length > 0) {
      merge.sort = nextSort;
    } else if (activeSort.length > 0) {
      remove.sort = true;
    }

    const shouldResetPage = nextSearch !== searchFilter || nextSort !== activeSort;

    if (shouldResetPage) {
      merge.page = 1;
      remove.page = true;
    }

    const target = qp(basePath, {
      merge,
      remove,
    });

    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl === target) {
        return;
      }
    }

    router.get(
      target,
      {},
      {
        preserveScroll: true,
        preserveState: true,
      }
    );
  }, [filtersState, basePath, activeSort, searchFilter, columnFilterRecord]);

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFiltersState((previous) => ({
      ...previous,
      search: searchInput.trim(),
    }));
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setFiltersState((previous) => ({
      ...previous,
      search: '',
    }));
  };

  const handleSortChange = (value: string) => {
    setFiltersState((previous) => ({
      ...previous,
      sort: value,
    }));
  };
  const resolveDestroyUrl = useCallback((id: number | string) => UserController.destroy(id).url, []);
  const handleDelete = useCallback(
    (id: number | string) => {
      confirm.delete(
        'This action cannot be undone. Delete this user?',
        () => {
          router.delete(resolveDestroyUrl(id), {
            preserveScroll: true,
            preserveState: false,
          });
        }
      );
    },
    [resolveDestroyUrl]
  );
  return (
    <AppLayout title="Users">
      <Head title="Users" />
      <div className="space-y-6 px-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">Manage users in one place.</p>
          </div>
          <Button asChild>
            <Link
              href={UserController.create().url}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              New User
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-4 rounded-lg border bg-card/60 p-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row sm:items-center">
            <Input
              name="search"
              value={searchInput}
              onChange={handleSearchInputChange}
              placeholder="Search users..."
              className="w-full sm:max-w-xs"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">Search</Button>
              {filtersState.search.length > 0 || searchInput.length > 0 ? (
                <Button type="button" variant="outline" size="sm" onClick={handleResetSearch}">
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
          <div className="flex w-full items-center gap-3 sm:w-auto sm:justify-end">
            <span className="text-sm font-medium text-muted-foreground">Sort</span>
            <Select value={filtersState.sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default order</SelectItem>
                <SelectItem value="-created_at">Newest first</SelectItem>
                <SelectItem value="created_at">Oldest first</SelectItem>
                <SelectItem value="name">Name A to Z</SelectItem>
                <SelectItem value="-name">Name Z to A</SelectItem>
                <SelectItem value="email">Email A to Z</SelectItem>
                <SelectItem value="-email">Email Z to A</SelectItem>
                <SelectItem value="password">Password A to Z</SelectItem>
                <SelectItem value="-password">Password Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            No users found yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <table className="w-full table-auto">
              <thead className="bg-muted/50">
                <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Created At</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Updated At</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/40">
              <td className="px-4 py-3 text-sm font-medium text-foreground">{record.id}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">{record.name === null || record.name === undefined ? '—' : typeof record.name === 'object' ? JSON.stringify(record.name, null, 2) : String(record.name)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">{record.email === null || record.email === undefined ? '—' : typeof record.email === 'object' ? JSON.stringify(record.email, null, 2) : String(record.email)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">{record.password === null || record.password === undefined ? '—' : typeof record.password === 'object' ? JSON.stringify(record.password, null, 2) : String(record.password)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">{record.created_at === null || record.created_at === undefined ? '—' : typeof record.created_at === 'object' ? JSON.stringify(record.created_at, null, 2) : String(record.created_at)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">{record.updated_at === null || record.updated_at === undefined ? '—' : typeof record.updated_at === 'object' ? JSON.stringify(record.updated_at, null, 2) : String(record.updated_at)}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <Link href={UserController.show(record.id).url} className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    View
                  </Link>
                  <Link href={UserController.edit(record.id).url} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(record.id)}
                    className="text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                  >
                    Delete
                  </button>
                </div>
              </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginationLinks.length > 1 && (
              <div className="flex flex-col gap-4 border-t bg-muted/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
                {paginationSummary ? (
                  <p className="text-sm text-muted-foreground">{paginationSummary}</p>
                ) : (
                  <span className="sr-only">Pagination summary</span>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {paginationLinks.map((link, index) => {
                    if (!link || typeof link.label !== 'string') {
                      return null;
                    }
                    const label = String(link.label)
                      .replace(/&laquo;/g, '«')
                      .replace(/&raquo;/g, '»')
                      .replace(/&nbsp;/g, ' ');
                    if (!link.url) {
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm text-muted-foreground/60"
                        >
                          {label}
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        className={`inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm transition-colors hover:bg-muted/80 ${link.active ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'}`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
