import AppLayout from '@/layouts/app-layout';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import ModuleContentController from '@/actions/App/Http/Controllers/ModuleContentController';
import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
import ModuleQuizController from '@/actions/App/Http/Controllers/ModuleQuizController';
import ModuleStageController from '@/actions/App/Http/Controllers/ModuleStageController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';



export type ModuleStageRecord = App.Data.ModuleStage.ModuleStageData;

export type ModuleStageCollection = PaginationMeta & {
  data: App.Data.ModuleStage.ModuleStageData[];
};

interface ModuleStageCreateProps {}

export default function ModuleStageCreate() {
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

  const mapModuleSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const mapModuleContentSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const mapModuleQuizSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const fetchModuleOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(ModuleController.index().url, { params });

    return response;
  };

  const fetchModuleContentOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(ModuleContentController.index().url, { params });

    return response;
  };

  const fetchModuleQuizOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(ModuleQuizController.index().url, { params });

    return response;
  };

  const [moduleId, setModuleId] = useState<number | string | null>(null);
  const [moduleContentId, setModuleContentId] = useState<number | string | null>(null);
  const [moduleQuizId, setModuleQuizId] = useState<number | string | null>(null);

  return (
    <AppLayout>
      <Head title="Create Module Stage" />
      <Form {...ModuleStageController.store.form()}
        transform={(data) => ({ ...data, module_id: (() => {
    if (moduleId === null) {
      return null;
    }

    if (typeof moduleId === 'number') {
      return moduleId;
    }

    const numeric = Number.parseInt(String(moduleId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })(),
        module_content_id: (() => {
    if (moduleContentId === null) {
      return null;
    }

    if (typeof moduleContentId === 'number') {
      return moduleContentId;
    }

    const numeric = Number.parseInt(String(moduleContentId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })(),
        module_quiz_id: (() => {
    if (moduleQuizId === null) {
      return null;
    }

    if (typeof moduleQuizId === 'number') {
      return moduleQuizId;
    }

    const numeric = Number.parseInt(String(moduleQuizId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })() })}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Create Module Stage</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="module_able">Module Able</Label>
                <Input
                  id="module_able"
                  name="module_able"
                  type="text"
                  required
                />
                <InputError message={errors.module_able} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  required
                />
                <InputError message={errors.order} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="module_id">Module</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="module-selector"
                  placeholder={`Select Module`}
                  fetchData={fetchModuleOptions}
                  dataMapper={mapModuleSelectorResponse}
                  selectedDataId={moduleId}
                  setSelectedData={(value) => setModuleId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.module_id} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="module_content_id">Module Content</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="module_content-selector"
                  placeholder={`Select Module Content`}
                  fetchData={fetchModuleContentOptions}
                  dataMapper={mapModuleContentSelectorResponse}
                  selectedDataId={moduleContentId}
                  setSelectedData={(value) => setModuleContentId(value)}
                  nullable
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.module_content_id} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="module_quiz_id">Module Quiz</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="module_quiz-selector"
                  placeholder={`Select Module Quiz`}
                  fetchData={fetchModuleQuizOptions}
                  dataMapper={mapModuleQuizSelectorResponse}
                  selectedDataId={moduleQuizId}
                  setSelectedData={(value) => setModuleQuizId(value)}
                  nullable
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.module_quiz_id} />
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
