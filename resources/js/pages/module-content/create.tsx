import AppLayout from '@/layouts/app-layout';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import ModuleContentController from '@/actions/App/Http/Controllers/ModuleContentController';
import ModuleStageController from '@/actions/App/Http/Controllers/ModuleStageController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';



export type ModuleContentRecord = App.Data.ModuleContent.ModuleContentData;

export type ModuleContentCollection = PaginationMeta & {
  data: App.Data.ModuleContent.ModuleContentData[];
};

interface ModuleContentCreateProps {}

export default function ModuleContentCreate() {
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

  const mapModuleStageSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const fetchModuleStageOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(ModuleStageController.index().url, { params });

    return response;
  };

  const [moduleStageId, setModuleStageId] = useState<number | string | null>(null);

  return (
    <AppLayout>
      <Head title="Create Module Content" />
      <Form {...ModuleContentController.store.form()}
        transform={(data) => ({ ...data, module_stage_id: (() => {
    if (moduleStageId === null) {
      return null;
    }

    if (typeof moduleStageId === 'number') {
      return moduleStageId;
    }

    const numeric = Number.parseInt(String(moduleStageId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })() })}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Create Module Content</h1>
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
                />
                <InputError message={errors.title} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                />
                <InputError message={errors.description} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="file_path">File Path</Label>
                <Input
                  id="file_path"
                  name="file_path"
                  type="text"
                />
                <InputError message={errors.file_path} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content_url">Content Url</Label>
                <Textarea
                  id="content_url"
                  name="content_url"
                  rows={4}
                />
                <InputError message={errors.content_url} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                />
                <InputError message={errors.duration} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Input
                  id="content_type"
                  name="content_type"
                  type="text"
                  required
                />
                <InputError message={errors.content_type} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="module_stage_id">Module Stage</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="module_stage-selector"
                  placeholder={`Select Module Stage`}
                  fetchData={fetchModuleStageOptions}
                  dataMapper={mapModuleStageSelectorResponse}
                  selectedDataId={moduleStageId}
                  setSelectedData={(value) => setModuleStageId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.module_stage_id} />
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
