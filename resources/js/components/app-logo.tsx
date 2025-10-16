import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { BookMarked } from 'lucide-react';

export default function AppLogo() {
    const { name } = usePage<SharedData>().props;

    return (
        <>
            <div className='flex aspect-square size-8 items-center justify-center'>
                <BookMarked />
            </div>
            <div className='ml-1 grid flex-1 text-left text-sm'>
                <span className='mb-0.5 truncate leading-tight font-semibold'>{name}</span>
            </div>
        </>
    );
}
