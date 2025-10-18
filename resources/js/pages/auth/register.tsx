import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import { login } from '@/routes';
import { Head, useForm } from '@inertiajs/react';

import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AuthLayout from '@/layouts/auth-layout';
import { FormEvent, useMemo } from 'react';

type RoleOption = {
    value: string;
    label: string;
};

type CourseOption = {
    id: number;
    title: string | null;
};

type CourseSelectorOption = {
    id: string;
    title: string;
};

type RegisterProps = {
    roleOptions: RoleOption[];
    courseOptions: CourseOption[];
    defaultRole: string;
    defaultCourseId?: number | null;
    redirectTo?: string | null;
};

export default function Register({ roleOptions, courseOptions, defaultRole, defaultCourseId = null, redirectTo = null }: RegisterProps) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: defaultRole,
        course_id: defaultCourseId ? String(defaultCourseId) : '',
        enrollment_message: '',
        redirect_to: redirectTo ?? '',
    });
    const studentRoleValue = useMemo(
        () => roleOptions.find((option) => option.value === 'Student')?.value ?? defaultRole,
        [roleOptions, defaultRole],
    );
    const courseSelectorOptions = useMemo<CourseSelectorOption[]>(
        () =>
            courseOptions.map((course) => ({
                id: String(course.id),
                title: course.title ?? `Kursus #${course.id}`,
            })),
        [courseOptions],
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(RegisteredUserController.store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset('password', 'password_confirmation', 'enrollment_message'),
        });
    };

    return (
        <AuthLayout title='Create an account' description='Enter your details below to create your account'>
            <Head title='Register' />
            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                {(() => {
                    const selectedRole = form.data.role?.length ? form.data.role : defaultRole;
                    const isStudent = selectedRole === studentRoleValue;

                    return (
                        <>
                            <div className='grid gap-6'>
                                <div className='grid gap-2'>
                                    <Label htmlFor='name'>Name</Label>
                                    <Input
                                        id='name'
                                        type='text'
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete='name'
                                        name='name'
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        placeholder='Full name'
                                    />
                                    <InputError message={form.errors.name} className='mt-2' />
                                </div>

                                <div className='grid gap-2'>
                                    <Label htmlFor='email'>Email address</Label>
                                    <Input
                                        id='email'
                                        type='email'
                                        required
                                        tabIndex={2}
                                        autoComplete='email'
                                        name='email'
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                        placeholder='email@example.com'
                                    />
                                    <InputError message={form.errors.email} />
                                </div>

                                <div className='grid gap-2'>
                                    <Label htmlFor='password'>Password</Label>
                                    <Input
                                        id='password'
                                        type='password'
                                        required
                                        tabIndex={3}
                                        autoComplete='new-password'
                                        name='password'
                                        value={form.data.password}
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        placeholder='Password'
                                    />
                                    <InputError message={form.errors.password} />
                                </div>

                                <div className='grid gap-2'>
                                    <Label htmlFor='password_confirmation'>Confirm password</Label>
                                    <Input
                                        id='password_confirmation'
                                        type='password'
                                        required
                                        tabIndex={4}
                                        autoComplete='new-password'
                                        name='password_confirmation'
                                        value={form.data.password_confirmation}
                                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                        placeholder='Confirm password'
                                    />
                                    <InputError message={form.errors.password_confirmation} />
                                </div>

                                <div className='grid gap-2'>
                                    <Label>Role</Label>
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(value) => {
                                            form.setData('role', value);
                                            if (value !== studentRoleValue) {
                                                form.setData('course_id', '');
                                                form.setData('enrollment_message', '');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className='h-11'>
                                            <SelectValue placeholder='Select role' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.role} />
                                </div>

                                {isStudent ? (
                                    <>
                                        <div className='grid gap-2'>
                                            <Label>Pilih kursus (opsional)</Label>
                                            <GenericDataSelector
                                                data={courseSelectorOptions}
                                                selectedDataId={form.data.course_id.length ? form.data.course_id : null}
                                                setSelectedData={(identifier) => form.setData('course_id', identifier ? String(identifier) : '')}
                                                placeholder='Pilih kursus yang ingin diikuti'
                                                nullable
                                                buttonClassName='h-11'
                                                renderItem={(item) => <span className='truncate'>{item.title}</span>}
                                            />
                                            <p className='text-xs text-muted-foreground'>Anda bisa melewati opsi ini dan memilih kursus nanti.</p>
                                            <InputError message={form.errors.course_id} />
                                        </div>

                                        <div className='grid gap-2'>
                                            <Label htmlFor='enrollment_message'>Pesan pendaftaran (opsional)</Label>
                                            <Textarea
                                                id='enrollment_message'
                                                name='enrollment_message'
                                                tabIndex={5}
                                                value={form.data.enrollment_message}
                                                onChange={(event) => form.setData('enrollment_message', event.target.value)}
                                                placeholder='Ceritakan alasan kamu ingin mengikuti kursus ini (opsional)'
                                            />
                                            <InputError message={form.errors.enrollment_message} />
                                        </div>
                                    </>
                                ) : null}

                                <Button
                                    type='submit'
                                    className='mt-2 w-full'
                                    tabIndex={isStudent ? 6 : 5}
                                    data-test='register-user-button'
                                    disabled={form.processing}
                                >
                                    {form.processing && <Spinner />}
                                    Create account
                                </Button>
                            </div>

                            <div className='text-center text-sm text-muted-foreground'>
                                Already have an account?{' '}
                                <TextLink href={login()} tabIndex={isStudent ? 7 : 6}>
                                    Log in
                                </TextLink>
                            </div>
                        </>
                    );
                })()}
            </form>
        </AuthLayout>
    );
}
