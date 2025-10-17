import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
    onDrop: (file: File) => void;
    preview?: string | null;
    onRemove: () => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    disabled?: boolean;
    className?: string;
}

export function ImageDropzone({
    onDrop,
    preview,
    onRemove,
    accept = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
    },
    maxSize = 2097152, // 2MB
    disabled = false,
    className,
}: ImageDropzoneProps) {
    const handleDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onDrop(acceptedFiles[0]);
            }
        },
        [onDrop],
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
        onDrop: handleDrop,
        accept,
        maxSize,
        maxFiles: 1,
        disabled: disabled || !!preview,
        multiple: false,
    });

    const isFileTooLarge = fileRejections.length > 0 && fileRejections[0].file.size > maxSize;

    if (preview) {
        return (
            <div className={cn('relative rounded-lg border-2 border-muted-foreground/25 bg-muted/5 p-2', className)}>
                <img src={preview} alt='Preview' className='max-h-96 w-full rounded object-contain' />
                <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    onClick={onRemove}
                    className='absolute right-4 top-4 shadow-lg'
                    aria-label='Hapus gambar'
                >
                    <X className='h-4 w-4' />
                </Button>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={cn(
                'flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 p-8 transition-all',
                isDragActive && !isDragReject && 'border-primary bg-primary/5',
                isDragReject && 'border-destructive bg-destructive/5',
                !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20',
                disabled && 'cursor-not-allowed opacity-50',
                className,
            )}
        >
            <input {...getInputProps()} />
            <div className='flex flex-col items-center gap-2 text-center'>
                {isDragActive ? (
                    <>
                        <FileImage className='h-10 w-10 text-primary' />
                        <div>
                            <p className='text-sm font-medium text-primary'>Lepaskan file di sini</p>
                            <p className='text-xs text-muted-foreground'>untuk upload gambar</p>
                        </div>
                    </>
                ) : (
                    <>
                        <Upload className='h-10 w-10 text-muted-foreground' />
                        <div>
                            <p className='text-sm font-medium text-foreground'>Klik untuk upload atau drag & drop</p>
                            <p className='text-xs text-muted-foreground'>PNG, JPG, JPEG hingga {(maxSize / 1024 / 1024).toFixed(0)}MB</p>
                        </div>
                    </>
                )}
                {isFileTooLarge && <p className='text-xs text-destructive'>File terlalu besar. Maksimal {(maxSize / 1024 / 1024).toFixed(0)}MB</p>}
            </div>
        </div>
    );
}
