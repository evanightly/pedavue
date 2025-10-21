import AppLayout from '@/layouts/app-layout';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';



export type ModuleRecord = App.Data.Module.ModuleData;

export type ModuleCollection = PaginationMeta & {
  data: App.Data.Module.ModuleData[];
};

interface ModuleEditProps {
  record: ModuleRecord;
}

export default function ModuleEdit({ record }: ModuleEditProps) {
  const normalizeFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (_error) {
        return '';
      }
    }

    return String(value);
  };

  const normalizeSelectorItems = (payload: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(payload)) {
      return payload as Array<Record<string, unknown>>;
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidateKeys = ['data', 'records', 'items', 'results'];

      for (const key of candidateKeys) {
        const value = record[key];

        if (Array.isArray(value)) {
          return value as Array<Record<string, unknown>>;
        }

        if (
          value &&
          typeof value === 'object' &&
          Array.isArray((value as Record<string, unknown>).data)
        ) {
          return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
        }
      }

      for (const value of Object.values(record)) {
        if (Array.isArray(value)) {
          return value as Array<Record<string, unknown>>;
        }

        if (
          value &&
          typeof value === 'object' &&
          Array.isArray((value as Record<string, unknown>).data)
        ) {
          return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
        }
      }
    }

    return [];
  };

  const mapCourseSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
    if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
      const data = (response as Record<string, unknown>).data;
      const normalized = normalizeSelectorItems(data);

      if (normalized.length > 0) {
        return normalized;
      }
    }

    const fallback = normalizeSelectorItems(response);

    if (fallback.length > 0) {
      return fallback;
    }

    return [];
  };

  const fetchCourseOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(CourseController.index().url, { params });

    return response;
  };

  const [courseId, setCourseId] = useState<number | string | null>(() => {
    const direct = record?.course_id;

    if (typeof direct === 'number' || typeof direct === 'string') {
      return direct;
    }

    const related = record?.course;

    if (related && typeof related === 'object' && 'id' in related) {
      return (related as { id?: number | string }).id ?? null;
    }

    return null;
  });

  return (
    <AppLayout>
      <Head title="Edit Module" />
      <Form {...ModuleController.update.form(record.id)}
        transform={(data) => ({ ...data, course_id: (() => {
    if (courseId === null) {
      return null;
    }

    if (typeof courseId === 'number') {
      return courseId;
    }

    const numeric = Number.parseInt(String(courseId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })() })}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Edit Module</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  defaultValue={normalizeFieldValue(record.title)}
                />
                <InputError message={errors.title} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={normalizeFieldValue(record.description) as string}
                />
                <InputError message={errors.description} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="thumbnail">Thumbnail</Label>
                <Input
                  id="thumbnail"
                  name="thumbnail"
                  type="text"
                  defaultValue={normalizeFieldValue(record.thumbnail)}
                />
                <InputError message={errors.thumbnail} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  defaultValue={normalizeFieldValue(record.duration)}
                />
                <InputError message={errors.duration} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  required
                  defaultValue={normalizeFieldValue(record.order)}
                />
                <InputError message={errors.order} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="course_id">Course</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="course-selector"
                  placeholder={`Select Course`}
                  fetchData={fetchCourseOptions}
                  dataMapper={mapCourseSelectorResponse}
                  selectedDataId={courseId}
                  setSelectedData={(value) => setCourseId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.course_id} />
              </div>
            </div>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}
      </Form>
    </AppLayout>
  );
}
