import AppLayout from '@/layouts/app-layout';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
import EnrollmentRequestController from '@/actions/App/Http/Controllers/EnrollmentRequestController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import UserController from '@/actions/App/Http/Controllers/UserController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';



export type EnrollmentRequestRecord = App.Data.EnrollmentRequest.EnrollmentRequestData;

export type EnrollmentRequestCollection = PaginationMeta & {
  data: App.Data.EnrollmentRequest.EnrollmentRequestData[];
};

interface EnrollmentRequestEditProps {
  record: EnrollmentRequestRecord;
}

export default function EnrollmentRequestEdit({ record }: EnrollmentRequestEditProps) {
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

  const mapUserSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const fetchUserOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(UserController.index().url, { params });

    return response;
  };

  const fetchCourseOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(CourseController.index().url, { params });

    return response;
  };

  const [userId, setUserId] = useState<number | string | null>(() => {
    const direct = record?.user_id;

    if (typeof direct === 'number' || typeof direct === 'string') {
      return direct;
    }

    const related = record?.user;

    if (related && typeof related === 'object' && 'id' in related) {
      return (related as { id?: number | string }).id ?? null;
    }

    return null;
  });
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
      <Head title="Edit Enrollment Request" />
      <Form {...EnrollmentRequestController.update.form(record.id)}
        transform={(data) => ({ ...data, user_id: (() => {
    if (userId === null) {
      return null;
    }

    if (typeof userId === 'number') {
      return userId;
    }

    const numeric = Number.parseInt(String(userId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })(),
        course_id: (() => {
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
              <h1 className="text-2xl font-semibold tracking-tight">Edit Enrollment Request</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  defaultValue={normalizeFieldValue(record.message) as string}
                />
                <InputError message={errors.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  name="status"
                  type="text"
                  required
                  defaultValue={normalizeFieldValue(record.status)}
                />
                <InputError message={errors.status} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="user_id">User</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="user-selector"
                  placeholder={`Select User`}
                  fetchData={fetchUserOptions}
                  dataMapper={mapUserSelectorResponse}
                  selectedDataId={userId}
                  setSelectedData={(value) => setUserId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.user_id} />
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
