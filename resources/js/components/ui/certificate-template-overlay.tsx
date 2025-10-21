import { CertificateImageOverlay } from './certificate-image-overlay';
import { CertificateNameOverlay } from './certificate-name-overlay';
import { CertificateQrOverlay } from './certificate-qr-overlay';

type NameOverlayProps = Parameters<typeof CertificateNameOverlay>[0];

type CertificateTemplateOverlayProps = {
    enabled: boolean;
    nameOverlay: NameOverlayProps;
    qrOverlay?: {
        editable: boolean;
        position: { x: number; y: number };
        size: { width: number; height: number };
        onPositionChange: (value: { x: number; y: number }) => void;
        onSizeChange: (value: { width: number; height: number }) => void;
        isSelected?: boolean;
        onSelect?: () => void;
    } | null;
    imageOverlays: Array<{
        key: string;
        editable: boolean;
        position: { x: number; y: number };
        size: { width: number; height: number };
        onPositionChange: (value: { x: number; y: number }) => void;
        onSizeChange: (value: { width: number; height: number }) => void;
        imageUrl: string | null;
        label?: string | null;
        isSelected?: boolean;
        onSelect?: () => void;
    }>;
};

export function CertificateTemplateOverlay({ enabled, nameOverlay, qrOverlay, imageOverlays }: CertificateTemplateOverlayProps) {
    if (!enabled) {
        return null;
    }

    return (
        <div className='pointer-events-none absolute inset-0'>
            <CertificateNameOverlay {...nameOverlay} />
            {qrOverlay ? <CertificateQrOverlay {...qrOverlay} /> : null}
            {imageOverlays.map(({ key, ...overlay }) => (
                <CertificateImageOverlay key={key} {...overlay} />
            ))}
        </div>
    );
}
