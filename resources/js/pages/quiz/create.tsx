// import CertificateController from '@/actions/App/Http/Controllers/CertificateController';
import QuizController from '@/actions/App/Http/Controllers/QuizController';
// import EnrollmentController from '@/actions/App/Http/Controllers/EnrollmentController';
// import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import { questions } from '@/routes/quizzes/import';
import { Form, Head } from '@inertiajs/react';
import { CheckedState } from '@radix-ui/react-checkbox';
import axios from 'axios';
import { FileInput, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export type QuizRecord = App.Data.Quiz.QuizData;

export type QuizCollection = PaginationMeta & {
    data: App.Data.Quiz.QuizData[];
};

interface QuizCreateProps {}

export default function QuizCreate() {
    const [isQuestionShuffled, setIsQuestionShuffled] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<string | null>(null);
    const [description, setDescription] = useState<string>('');

    const handleImportDrop = (file: File) => {
        setImportFile(file);
        setImportPreview(file.name);
    };

    const removeImport = () => {
        setImportFile(null);
        setImportPreview(null);
    };

    return (
        <AppLayout>
            <Head title='Create Quiz' />
            <Form
                {...QuizController.store.form()}
                transform={(data) => ({
                    ...data,
                    import: importFile,
                })}
                options={{ preserveScroll: true }}
                className='p-8'
            >
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Buat Quiz Baru</h1>
                            <p className='text-sm text-muted-foreground'>Lengkapi informasi di bawah ini untuk membuat quiz baru.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Informasi Dasar</h3>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='grid gap-2 md:col-span-2'>
                                        <Label htmlFor='name'>
                                            Nama <span className='text-destructive'>*</span>
                                        </Label>
                                        <Input id='name' name='name' type='text' placeholder='Masukkan nama quiz' required />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className='flex flex-col gap-2'>
                                        <Label htmlFor='duration'>
                                            Durasi <span className='text-xs text-muted-foreground'>(dalam menit)</span>
                                        </Label>
                                        <Input id='duration' name='duration' type='number' min='0' step='1' placeholder='Contoh: 120' />
                                        <InputError message={errors.duration} />
                                    </div>
                                </div>
                                <div className='space-y-4'>
                                    <h3 className='text-sm font-medium text-foreground'>Pengaturan</h3>
                                    <div className='flex items-center gap-3 rounded-lg border p-4'>
                                        <Checkbox
                                            id='is_question_shuffled'
                                            name='is_question_shuffled'
                                            checked={isQuestionShuffled}
                                            onCheckedChange={() => setIsQuestionShuffled(!isQuestionShuffled)}
                                        />
                                        <input type="hidden" name="is_question_shuffled" value={+isQuestionShuffled} />
                                        <div className='grid gap-1'>
                                            <Label htmlFor='is_question_shuffled' className='cursor-pointer text-sm leading-none font-medium'>
                                                Acak soal
                                            </Label>
                                            <p className='text-xs text-muted-foreground'>
                                                Acak urutan soal sehingga setiap pengguna mendapatkan urutan soal yang berbeda setiap kali mengikuti
                                                quiz ini
                                            </p>
                                        </div>
                                    </div>
                                    <InputError message={errors.is_question_shuffled} />
                                </div>
                                <div className='space-y-4'>
                                    <div className='grid gap-2'>
                                        <Label htmlFor='file'>
                                            Import soal dari Excel <span className='text-destructive'>*</span>
                                        </Label>
                                        <ImageDropzone
                                            onDrop={handleImportDrop}
                                            preview={importPreview}
                                            onRemove={removeImport}
                                            accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet+xml': ['.xlsx'] }}
                                        />
                                        <InputError message={errors.file} />
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Deskripsi</h3>
                                <div className='grid gap-2'>
                                    <Label htmlFor='description'>
                                        Deskripsi Quiz <span className='text-destructive'>*</span>
                                    </Label>
                                    <input type='hidden' name='description' value={description} />
                                    <RichTextEditor
                                        content={description}
                                        onChange={setDescription}
                                        placeholder='Jelaskan tentang quiz ini, apa yang akan dipelajari, dan manfaatnya...'
                                        mode='block'
                                        minHeight='200px'
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </div>
                        </div>
                        <Button type='submit' disabled={processing} className='w-full sm:w-auto'>
                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                            {processing ? 'Menyimpan…' : 'Simpan Quiz'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
