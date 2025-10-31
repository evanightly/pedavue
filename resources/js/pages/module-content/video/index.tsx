import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import ModuleContentController from '@/actions/App/Http/Controllers/ModuleContentController';

export type ModuleContentRecord = App.Data.ModuleContent.ModuleContentData;

export type ModuleContentCollection = PaginationMeta & {
  data: App.Data.ModuleContent.ModuleContentData[];
};

interface Props {
  moduleContents: ModuleContentCollection;
}

export default function VideoModuleContentsIndex({ moduleContents }: Props) {
  return (
    <AppLayout>
      <Head title="Video Module Contents" />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Video Module Contents</h1>
        <p className="text-muted-foreground">Listing of module contents with content type video.</p>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {moduleContents.data.length === 0 && (
            <div className="rounded-lg border bg-card p-4">No video module contents found.</div>
          )}

          {moduleContents.data.map((mc) => (
            <div key={mc.id as any} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{mc.title}</h2>
                  <div className="text-sm text-muted-foreground">{mc.description}</div>
                </div>
                <div>
                  <Link href={ModuleContentController.videoShow(mc.id as number).url} className="text-sm text-primary">
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </div>
    </AppLayout>
  );
}
