import RoleController from '@/actions/App/Http/Controllers/RoleController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export type RoleRecord = App.Data.Role.RoleData;

export type RoleCollection = PaginationMeta & {
    data: App.Data.Role.RoleData[];
};

interface PermissionOption {
    id: number;
    name: string;
    group?: string | null;
}

interface RoleCreateProps {
    allPermissions: PermissionOption[];
}

export default function RoleCreate({ allPermissions }: RoleCreateProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const handlePermissionToggle = (permissionId: number) => {
        setSelectedPermissions((prev) => (prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]));
    };

    // Group permissions by their group property
    const groupedPermissions = allPermissions.reduce(
        (acc, permission) => {
            const group = permission.group || 'Other';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(permission);
            return acc;
        },
        {} as Record<string, PermissionOption[]>,
    );

    return (
        <AppLayout>
            <Head title='Create Role' />
            <Form {...RoleController.store.form()} options={{ preserveScroll: true }} className='p-8'>
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Create Role</h1>
                            <p className='text-sm text-muted-foreground'>Provide the necessary information below and submit when you're ready.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='name'>Name</Label>
                                <Input id='name' name='name' type='text' required />
                                <InputError message={errors.name} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='guard_name'>Guard Name</Label>
                                <Input id='guard_name' name='guard_name' type='text' defaultValue='web' required />
                                <InputError message={errors.guard_name} />
                            </div>

                            <div className='grid gap-3'>
                                <Label>Permissions</Label>
                                <div className='space-y-4 rounded-md border p-4'>
                                    {Object.entries(groupedPermissions).map(([group, permissions]) => (
                                        <div key={group} className='space-y-2'>
                                            <h3 className='text-sm font-medium'>{group}</h3>
                                            <div className='space-y-2 pl-4'>
                                                {permissions.map((permission) => {
                                                    const checked = selectedPermissions.includes(permission.id);

                                                    return (
                                                        <div key={permission.id} className='flex items-center gap-2'>
                                                            <Checkbox
                                                                id={`permission-${permission.id}`}
                                                                checked={checked}
                                                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                            />
                                                            <Label htmlFor={`permission-${permission.id}`} className='cursor-pointer font-normal'>
                                                                {permission.name}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedPermissions.map((permissionId) => (
                                    <input key={permissionId} type='hidden' name='permissionIds[]' value={permissionId} />
                                ))}
                                <InputError message={errors.permissionIds} />
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
