import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useMemo, useState, useCallback } from 'react';

export type ModuleContentRecord = App.Data.ModuleContent.ModuleContentData;

interface Props {
  record: ModuleContentRecord;
}

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
  } catch (e) {
    // fallback regex
    const m = (url as string).match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  return null;
}

export default function VideoModuleContentShow({ record }: Props) {
  // avoid TS issues with generated DTO types by using any for nested props
  const scenes: any[] = (record as any).video_scenes ?? [];

  const [index, setIndex] = useState(0);

  const scene = scenes[index] ?? null;

  const videoId = useMemo(() => {
    return extractYouTubeId(record.content_url as any) ?? null;
  }, [record.content_url]);

  const iframeSrc = useMemo(() => {
    if (!videoId) return null;
    const params = new URLSearchParams();
    if (scene?.time_chapter) {
      params.set('start', String(Number(scene.time_chapter)));
    }
    // autoplay when the scene loads; mute to improve autoplay behavior in browsers
    params.set('autoplay', '1');
    params.set('mute', '0');
    params.set('rel', '0');

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, scene]);

  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, Math.max(0, scenes.length - 1))), [scenes.length]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  return (
    <AppLayout>
      <Head title={record.title ?? 'Video'} />
  <div className="mx-auto max-w-full px-6 py-6">
        <h1 className="text-2xl font-semibold mb-4">{record.title}</h1>

        {scenes.length === 0 ? (
          <div className="rounded-lg border bg-card p-4">No scenes available for this video.</div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-9">
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
                {iframeSrc ? (
                  <iframe
                    title={`video-${record.id}-${scene?.id ?? index}`}
                    src={iframeSrc}
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white">Invalid YouTube URL</div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={goPrev} disabled={index <= 0} className="btn btn-sm">
                    Previous
                  </button>
                  <button onClick={goNext} disabled={index >= scenes.length - 1} className="btn btn-sm">
                    Next
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">Scene {index + 1} of {scenes.length}</div>
              </div>
            </div>

            <div className="col-span-3">
              <div className="sticky top-20 rounded-lg border bg-card p-4">
                <h3 className="font-semibold">Scene Details</h3>
                <div className="mt-2 text-sm text-muted-foreground">Time: {scene?.time_chapter ?? '—'}s</div>
                <div className="mt-1 text-sm text-muted-foreground">Interaction type: {scene?.interaction_type ?? '—'}</div>
                <div className="mt-1 text-sm text-muted-foreground">Visual: {scene?.visual ?? '—'}</div>
                <div className="mt-1 text-sm text-muted-foreground">Voice over: {scene?.voice_over ?? '—'}</div>

                <div className="mt-4">
                  <h4 className="font-medium">Interactions</h4>
                  {scene ? (
                    // Render UI according to the scene interaction_type
                    <div className="mt-2">
                      {scene.interaction_type === 'multiple_choice' && (
                        <MultipleChoiceView interactions={scene.scene_interactions ?? []} />
                      )}

                      {scene.interaction_type === 'single_choice' && (
                        <SingleChoiceView interactions={scene.scene_interactions ?? []} />
                      )}

                      {scene.interaction_type === 'essay' && (
                        <EssayView interactions={scene.scene_interactions ?? []} />
                      )}

                      {scene.interaction_type === 'view_event' && (
                        <ViewEventView interactions={scene.scene_interactions ?? []} />
                      )}

                      {!['multiple_choice', 'single_choice', 'essay', 'view_event'].includes(scene.interaction_type) && (
                        <div className="mt-2 text-sm text-muted-foreground">No interactions UI available for this interaction type.</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-muted-foreground">No interactions for this scene.</div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium">All Scenes</h4>
                <ul className="mt-2 space-y-1">
                  {scenes.map((s: any, idx: number) => (
                    <li key={s.id ?? idx}>
                      <button
                        onClick={() => setIndex(idx)}
                        className={`w-full text-left p-2 rounded ${idx === index ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                        Scene {idx + 1} — {s.time_chapter}s — {s.interaction_type}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// --- Interaction view components (internal to this file) ---
function MultipleChoiceView({ interactions }: { interactions: any[] }) {
  // Prefer `interactable_data` when available (QuizData or QuizQuestionData).
  const first = interactions?.[0] ?? null;
  let opts: any[] = [];

  if (first?.interactable_data) {
    const inter = first.interactable_data as any;
    // If it's a QuizQuestionData-like structure
    if (inter.quiz_question_options) {
      opts = inter.quiz_question_options ?? [];
    } else if (inter.quiz_questions && inter.quiz_questions.length > 0) {
      // take first question's options
      opts = inter.quiz_questions[0].quiz_question_options ?? [];
    }
  }

  if (opts.length === 0) {
    // fallback to legacy payload
    opts = interactions?.[0]?.payload?.options ?? interactions?.[0]?.payload?.choices ?? [];
  }

  // Normalize options to { id, label } so we never render an object directly
  const normalizedOpts = (opts ?? []).map((o: any, i: number) => {
    if (o == null) return { id: i, label: '' };
    if (typeof o === 'string' || typeof o === 'number') return { id: i, label: String(o) };
    const label = String(o.option_text ?? o.choice ?? o.text ?? o.value ?? o.answer ?? o.option ?? o.name ?? o.title ?? '');
    return { id: o.id ?? i, label };
  });

  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <div>
      {normalizedOpts.length === 0 ? (
        <div className="text-sm text-muted-foreground">No options available.</div>
      ) : (
        <>
        <h4>{first?.interactable_data?.question ?? first?.payload?.question ?? ''}</h4>
        <div className="text-sm text-muted-foreground">Select all that apply:</div>
        <ul className="space-y-2">
          {normalizedOpts.map((o: any) => (
            <li key={o.id} className="flex items-center gap-2">
              <input id={`mc-${o.id}`} type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4" />
              <label htmlFor={`mc-${o.id}`} className="text-sm">{o.label}</label>
            </li>
          ))}
        </ul>
        </>
      )}
      <div className="mt-3">
        <button type="button" onClick={() => console.log('submit MC', selected)} className="btn btn-sm">
          Submit
        </button>
      </div>
    </div>
  );
}

function SingleChoiceView({ interactions }: { interactions: any[] }) {
  const first = interactions?.[0] ?? null;
  let opts: any[] = [];

  if (first?.interactable_data) {
    const inter = first.interactable_data as any;
    if (inter.quiz_question_options) {
      opts = inter.quiz_question_options ?? [];
    } else if (inter.quiz_questions && inter.quiz_questions.length > 0) {
      opts = inter.quiz_questions[0].quiz_question_options ?? [];
    }
  }

  if (opts.length === 0) {
    opts = interactions?.[0]?.payload?.options ?? interactions?.[0]?.payload?.choices ?? [];
  }

  const normalizedOpts = (opts ?? []).map((o: any, i: number) => {
    if (o == null) return { id: i, label: '' };
    if (typeof o === 'string' || typeof o === 'number') return { id: i, label: String(o) };
    const label = String(o.option_text ?? o.choice ?? o.text ?? o.value ?? o.answer ?? o.option ?? o.name ?? o.title ?? '');
    return { id: o.id ?? i, label };
  });

  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      {normalizedOpts.length === 0 ? (
        <div className="text-sm text-muted-foreground">No options available.</div>
      ) : (
        <>
        <h4>{first?.interactable_data?.question ?? first?.payload?.question ?? ''}</h4>
        <div className="text-sm text-muted-foreground">Select one:</div>
        <ul className="space-y-2">
          {normalizedOpts.map((o: any) => (
            <li key={o.id} className="flex items-center gap-2">
              <input name="single" id={`sc-${o.id}`} type="radio" checked={selected === o.id} onChange={() => setSelected(o.id)} className="h-4 w-3" />
              <label htmlFor={`sc-${o.id}`} className="text-sm">{o.label}</label>
            </li>
          ))}
        </ul>
        </>
      )}
      <div className="mt-3">
        <button type="button" onClick={() => console.log('submit SC', selected)} className="btn btn-sm">
          Submit
        </button>
      </div>
    </div>
  );
}

function EssayView({ interactions }: { interactions: any[] }) {
  const [text, setText] = useState('');

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border p-2 text-sm" rows={6} />
      <div className="mt-3">
        <button type="button" onClick={() => console.log('submit essay', text)} className="btn btn-sm">
          Submit
        </button>
      </div>
    </div>
  );
}

function ViewEventView({ interactions }: { interactions: any[] }) {
  // view_event may just be an informational event
  const payload = interactions?.[0]?.payload ?? null;
  return (
    <div>
      <div className="text-sm">This is a view event interaction.</div>
      {payload && <pre className="mt-2 rounded border p-2 text-xs">{JSON.stringify(payload, null, 2)}</pre>}
    </div>
  );
}
