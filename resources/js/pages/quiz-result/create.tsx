import AppLayout from '@/layouts/app-layout';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import QuizController from '@/actions/App/Http/Controllers/QuizController';
import QuizResultController from '@/actions/App/Http/Controllers/QuizResultController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';



export type QuizResultRecord = App.Data.QuizResult.QuizResultData;

export type QuizResultCollection = PaginationMeta & {
  data: App.Data.QuizResult.QuizResultData[];
};

interface QuizResultCreateProps {}

export default function QuizResultCreate() {
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

  const mapQuizSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const fetchQuizOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(QuizController.index().url, { params });

    return response;
  };

  const [userId, setUserId] = useState<number | string | null>(null);
  const [quizId, setQuizId] = useState<number | string | null>(null);

  return (
    <AppLayout>
      <Head title="Create Quiz Result" />
      <Form {...QuizResultController.store.form()}
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
        quiz_id: (() => {
    if (quizId === null) {
      return null;
    }

    if (typeof quizId === 'number') {
      return quizId;
    }

    const numeric = Number.parseInt(String(quizId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })() })}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Create Quiz Result</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  required
                />
                <InputError message={errors.score} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="attempt">Attempt</Label>
                <Input
                  id="attempt"
                  name="attempt"
                  type="number"
                  required
                />
                <InputError message={errors.attempt} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="started_at">Started At</Label>
                <Input
                  id="started_at"
                  name="started_at"
                  type="datetime-local"
                  required
                />
                <InputError message={errors.started_at} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="finished_at">Finished At</Label>
                <Input
                  id="finished_at"
                  name="finished_at"
                  type="datetime-local"
                  required
                />
                <InputError message={errors.finished_at} />
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
                <Label htmlFor="quiz_id">Quiz</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="quiz-selector"
                  placeholder={`Select Quiz`}
                  fetchData={fetchQuizOptions}
                  dataMapper={mapQuizSelectorResponse}
                  selectedDataId={quizId}
                  setSelectedData={(value) => setQuizId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.quiz_id} />
              </div>
            </div>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </Form>
    </AppLayout>
  );
}
