import { Button } from '@/components/ui/button';
import {
    MediaPlayer,
    MediaPlayerAudio,
    MediaPlayerControls,
    MediaPlayerControlsOverlay,
    MediaPlayerFullscreen,
    MediaPlayerLoading,
    MediaPlayerPlay,
    MediaPlayerSeek,
    MediaPlayerTime,
    MediaPlayerVideo,
    MediaPlayerVolume,
    MediaPlayerVolumeIndicator,
} from '@/components/ui/media-player';
import { cn } from '@/lib/utils';
import { Download, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

type ModuleContentRecord = Partial<App.Data.ModuleContent.ModuleContentData> & {
    id?: number | null;
    title?: string | null;
    description?: string | null;
    file_path?: string | null;
    subtitle_path?: string | null;
    content_url?: string | null;
    file_url?: string | null;
    subtitle_url?: string | null;
    content_type?: string | null;
};

type PreviewType = 'video' | 'audio' | 'image' | 'pdf' | 'file' | 'embed';

interface ModuleStagePreviewProps {
    content?: ModuleContentRecord | null;
    className?: string;
}

function getExtension(url: string | null | undefined): string | null {
    if (!url) {
        return null;
    }

    try {
        const normalized = url.split('?')[0] ?? '';
        const segments = normalized.split('.');
        if (segments.length < 2) {
            return null;
        }

        return segments.pop()?.toLowerCase() ?? null;
    } catch (error) {
        return null;
    }
}

function resolvePreviewType(content: ModuleContentRecord | null | undefined, fileUrl: string | null, contentUrl: string | null): PreviewType | null {
    if (fileUrl) {
        const extension = getExtension(fileUrl);
        const type = content?.content_type?.toLowerCase() ?? '';

        if ((extension && ['mp4', 'webm', 'mov', 'mkv'].includes(extension)) || type.includes('video')) {
            return 'video';
        }

        if ((extension && ['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) || type.includes('audio')) {
            return 'audio';
        }

        if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'heic'].includes(extension)) {
            return 'image';
        }

        if (extension === 'pdf' || type.includes('pdf')) {
            return 'pdf';
        }

        return 'file';
    }

    if (contentUrl) {
        return 'embed';
    }

    return null;
}

export default function ModuleStagePreview({ content = null, className }: ModuleStagePreviewProps) {
    const fileUrl = useMemo(() => {
        if (content?.file_url) {
            return content.file_url;
        }

        if (typeof content?.file_path === 'string' && content.file_path.trim() !== '') {
            return `/storage/${content.file_path.replace(/^\//, '')}`;
        }

        return null;
    }, [content?.file_path, content?.file_url]);

    const contentUrl = useMemo(() => {
        if (!content?.content_url) {
            return null;
        }

        return content.content_url;
    }, [content?.content_url]);

    const previewType = useMemo(() => resolvePreviewType(content, fileUrl, contentUrl), [content, fileUrl, contentUrl]);

    if (!previewType) {
        return null;
    }

    if (previewType === 'video') {
        return (
            <MediaPlayer className={cn('relative h-96 overflow-hidden rounded-lg bg-black', className)} autoHide>
                <MediaPlayerVideo src={fileUrl ?? undefined} preload='metadata' className='h-full'>
                    {content?.subtitle_url ? (
                        <track key='subtitle' kind='subtitles' src={content.subtitle_url} srcLang='id' label='Subtitel' default />
                    ) : null}
                </MediaPlayerVideo>
                <MediaPlayerLoading />
                <MediaPlayerControlsOverlay />
                <MediaPlayerControls className='flex items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3'>
                    <MediaPlayerPlay className='shrink-0' />
                    <MediaPlayerSeek className='flex-1' />
                    <MediaPlayerTime variant='progress' />
                    <MediaPlayerVolume className='hidden w-32 sm:flex' />
                    <MediaPlayerFullscreen />
                </MediaPlayerControls>
                <MediaPlayerVolumeIndicator />
            </MediaPlayer>
        );
    }

    if (previewType === 'audio') {
        return (
            <MediaPlayer className={cn('relative w-full overflow-hidden rounded-lg border border-border bg-card', className)} withoutTooltip>
                <MediaPlayerAudio src={fileUrl ?? undefined} preload='metadata' />
                <MediaPlayerControls className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4'>
                    <div className='flex items-center gap-2'>
                        <MediaPlayerPlay />
                        <MediaPlayerTime variant='progress' />
                    </div>
                    <div className='flex w-full flex-1 items-center gap-3'>
                        <MediaPlayerSeek className='flex-1' />
                        <MediaPlayerVolume className='w-32' />
                    </div>
                </MediaPlayerControls>
                <MediaPlayerVolumeIndicator />
            </MediaPlayer>
        );
    }

    if (previewType === 'image') {
        return (
            <div className={cn('relative overflow-hidden rounded-lg border border-border bg-muted/30', className)}>
                <img src={fileUrl ?? undefined} alt={content?.title ?? 'Pratinjau konten'} className='h-full w-full object-cover' />
            </div>
        );
    }

    if (previewType === 'pdf') {
        return (
            <div className={cn('relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-muted/30', className)}>
                <iframe src={`${fileUrl}#toolbar=0`} title={content?.title ?? 'Pratinjau dokumen'} className='h-full w-full' loading='lazy' />
            </div>
        );
    }

    if (previewType === 'file') {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground',
                    className,
                )}
            >
                <p>Berkas dapat diunduh untuk dipelajari secara offline.</p>
                <Button variant='outline' size='sm' asChild>
                    <a href={fileUrl ?? '#'} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-2'>
                        <Download className='h-4 w-4' /> Unduh materi
                    </a>
                </Button>
            </div>
        );
    }

    return (
        <div className={cn('relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/10', className)}>
            <iframe
                src={contentUrl ?? undefined}
                title={content?.title ?? 'Pratinjau konten'}
                className='h-full w-full'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
                allowFullScreen
                loading='lazy'
            />
            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-3 text-xs text-white'>
                Jika pratinjau tidak tampil, buka tautan langsung.
                <a href={contentUrl ?? '#'} target='_blank' rel='noopener noreferrer' className='ml-2 inline-flex items-center gap-1 underline'>
                    <ExternalLink className='h-3.5 w-3.5' /> Lihat materi
                </a>
            </div>
        </div>
    );
}
