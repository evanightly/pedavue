import AppLayout from '@/layouts/app-layout';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
import CourseInstructorController from '@/actions/App/Http/Controllers/CourseInstructorController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import type { ColumnDef } from '@tanstack/react-table';
import type { ColumnFilterMeta } from '@/components/ui/data-table-types';
import type { DataTableFilters } from '@/components/ui/data-table-types';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { confirm } from '@/lib/confirmation-utils';
import { useCallback, useMemo } from 'react';



export type CourseInstructorRecord = App.Data.CourseInstructor.CourseInstructorData;

export type CourseInstructorCollection = PaginationMeta & {
  data: App.Data.CourseInstructor.CourseInstructorData[];
};

interface CourseInstructorIndexProps {
  courseInstructors: CourseInstructorCollection;
  filters?: DataTableFilters | null;
  sort?: string | null;
  filteredData?: Record<string, unknown> | null;
}

export default function CourseInstructorIndex({ courseInstructors, filters = null, sort = null, filteredData: initialFilteredData = null }: CourseInstructorIndexProps) {
  const resolveDestroyUrl = useCallback((id: number) => CourseInstructorController.destroy(id).url, []);
  const handleDelete = useCallback(
    (id: number) => {
      confirm.delete(
        'This action cannot be undone. Delete this course instructor?',
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

  const filteredData = initialFilteredData ?? undefined;
  const searchValue = typeof filters?.search === 'string' ? filters.search : '';
  const activeSort = typeof sort === 'string' ? sort : undefined;
  const columnFilters =
    filters?.columnFilters && typeof filters.columnFilters === 'object' && !Array.isArray(filters.columnFilters)
      ? (filters.columnFilters as Record<string, unknown>)
      : {};
  const columns = useMemo<(ColumnDef<CourseInstructorRecord> & ColumnFilterMeta)[]>(() => [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.id}</span>
      ),
      enableSorting: true,
      enableFiltering: false,
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
      id: 'instructor_id',
      accessorKey: 'instructor_id',
      header: 'Instructor',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by instructor...',
        searchPlaceholder: 'Search instructor...',
        fetchDataUrl: UserController.index().url,
        valueMapKey: 'instructorOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'course_id',
      accessorKey: 'course_id',
      header: 'Course',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by course...',
        searchPlaceholder: 'Search course...',
        fetchDataUrl: CourseController.index().url,
        valueMapKey: 'courseOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={CourseInstructorController.show(row.original.id).url} className="flex items-center gap-2 text-sm">
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={CourseInstructorController.edit(row.original.id).url} className="flex items-center gap-2 text-sm">
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleDelete(row.original.id);
                }}
                className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
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
  ], [handleDelete]);

  return (
    <AppLayout>
      <Head title="Course Instructors" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Instructors</h1>
            <p className="text-muted-foreground">Manage course instructors in one place.</p>
          </div>
          <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
            <Button asChild>
              <Link href={CourseInstructorController.create().url}>
                New Course Instructor
              </Link>
            </Button>
          </div>
        </div>
        <DataTable<CourseInstructorRecord>
          title="Course Instructors"
          data={courseInstructors.data}
          columns={columns}
          pagination={courseInstructors}
          filters={{
            search: searchValue,
            sort: activeSort,
            columnFilters,
          }}
          filteredData={filteredData}
          searchPlaceholder="Search course instructors..."
          enableSearch
          enableColumnFilters
          enableMultiSort
          routeFunction={CourseInstructorController.index}
          resetRoute={CourseInstructorController.index().url}
          emptyMessage="No course instructors found"
          emptyDescription="Try adjusting your filters or create a new course instructor"
        />
      </div>
    </AppLayout>
  );
}
