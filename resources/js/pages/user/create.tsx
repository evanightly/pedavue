import UserController from '@/actions/App/Http/Controllers/UserController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface UserCreateProps {}

export default function UserCreate() {
    return (
        <AppLayout>
            <Head title='Create User' />
            <Form {...UserController.store.form()} options={{ preserveScroll: true }} className='p-8'>
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Create User</h1>
                            <p className='text-sm text-muted-foreground'>Provide the necessary information below and submit when you're ready.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='name'>Name</Label>
                                <Input id='name' name='name' type='text' required />
                                <InputError message={errors.name} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='email'>Email</Label>
                                <Input id='email' name='email' type='text' required />
                                <InputError message={errors.email} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='password'>Password</Label>
                                <Input id='password' name='password' type='text' required />
                                <InputError message={errors.password} />
                            </div>
                        </div>
                        <Button type='submit' disabled={processing} className='w-full sm:w-auto'>
                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                            {processing ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
