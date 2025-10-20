import { CertificateOverlayBox } from './certificate-overlay-box';

type CertificateImageOverlayProps = {
    editable: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    onPositionChange: (value: { x: number; y: number }) => void;
    onSizeChange: (value: { width: number; height: number }) => void;
    imageUrl: string | null;
    label?: string | null;
    isSelected?: boolean;
    onSelect?: () => void;
};

export function CertificateImageOverlay({
    editable,
    position,
    size,
    onPositionChange,
    onSizeChange,
    imageUrl,
    label,
    isSelected,
    onSelect,
}: CertificateImageOverlayProps) {
    return (
        <CertificateOverlayBox
            editable={editable}
            position={position}
            size={size}
            onPositionChange={onPositionChange}
            onSizeChange={onSizeChange}
            isSelected={isSelected}
            onSelect={onSelect}
            className='border-dashed border-white/80 bg-black/30'
        >
            <div className='relative flex h-full w-full items-center justify-center'>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={label ?? 'Overlay Sertifikat'}
                        className='h-full w-full object-contain'
                    />
                ) : (
                    <div className='flex h-full w-full items-center justify-center text-xs font-medium text-white'>
                        Unggah gambar overlay
                    </div>
                )}
                {label ? (
                    <span className='absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white'>
                        {label}
                    </span>
                ) : null}
            </div>
        </CertificateOverlayBox>
    );
}
