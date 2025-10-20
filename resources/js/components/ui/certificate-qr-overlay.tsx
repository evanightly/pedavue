import { CertificateOverlayBox } from './certificate-overlay-box';

type CertificateQrOverlayProps = {
    editable: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    onPositionChange: (value: { x: number; y: number }) => void;
    onSizeChange: (value: { width: number; height: number }) => void;
    isSelected?: boolean;
    onSelect?: () => void;
};

export function CertificateQrOverlay({
    editable,
    position,
    size,
    onPositionChange,
    onSizeChange,
    isSelected,
    onSelect,
}: CertificateQrOverlayProps) {
    return (
        <CertificateOverlayBox
            editable={editable}
            position={position}
            size={size}
            onPositionChange={onPositionChange}
            onSizeChange={onSizeChange}
            isSelected={isSelected}
            onSelect={onSelect}
            className='border border-primary/80 bg-white/90'
        >
            <div className='flex h-full w-full flex-col items-center justify-center gap-1 text-primary'>
                <span className='text-xs font-semibold uppercase tracking-wide'>Area QR</span>
                <span className='text-[10px] font-medium text-primary/70'>Kartu akan ditempatkan di sini</span>
            </div>
        </CertificateOverlayBox>
    );
}
