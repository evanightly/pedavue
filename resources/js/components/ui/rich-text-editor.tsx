import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NodeSelection } from 'prosemirror-state';
import { DOMSerializer } from 'prosemirror-model';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Type,
    Link as LinkIcon,
    Highlighter,
    Palette,
    Quote,
    CheckSquare,
    GripVertical,
    Plus,
    Blocks,
    Text,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Undo,
    Redo,
    type LucideIcon,
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    mode?: 'simple' | 'block';
    minHeight?: string;
}

const textColors = [
    { name: 'Default', value: 'currentColor' },
    { name: 'Gray', value: '#9CA3AF' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Pink', value: '#EC4899' },
];

const backgroundColors = [
    { name: 'Default', value: 'transparent' },
    { name: 'Gray', value: '#F3F4F6' },
    { name: 'Red', value: '#FEE2E2' },
    { name: 'Orange', value: '#FFEDD5' },
    { name: 'Yellow', value: '#FEF3C7' },
    { name: 'Green', value: '#D1FAE5' },
    { name: 'Blue', value: '#DBEAFE' },
    { name: 'Purple', value: '#F3E8FF' },
    { name: 'Pink', value: '#FCE7F3' },
];

type SlashCommandOption = {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    command: (editor: Editor) => void;
};

const slashCommandOptions: SlashCommandOption[] = [
    {
        key: 'text',
        label: 'Teks',
        description: 'Paragraf standar',
        icon: Type,
        command: (editor) => {
            editor.chain().focus().setParagraph().run();
        },
    },
    {
        key: 'h1',
        label: 'Heading 1',
        description: 'Judul besar untuk bagian baru',
        icon: Heading1,
        command: (editor) => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
        },
    },
    {
        key: 'h2',
        label: 'Heading 2',
        description: 'Subjudul utama',
        icon: Heading2,
        command: (editor) => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
        },
    },
    {
        key: 'bullet',
        label: 'Daftar Bullet',
        description: 'Daftar dengan poin',
        icon: List,
        command: (editor) => {
            editor.chain().focus().toggleBulletList().run();
        },
    },
    {
        key: 'numbered',
        label: 'Daftar Nomor',
        description: 'Daftar bernomor urut',
        icon: ListOrdered,
        command: (editor) => {
            editor.chain().focus().toggleOrderedList().run();
        },
    },
    {
        key: 'todo',
        label: 'Daftar Tugas',
        description: 'Checklist untuk to-do',
        icon: CheckSquare,
        command: (editor) => {
            editor.chain().focus().toggleTaskList().run();
        },
    },
    {
        key: 'quote',
        label: 'Quote',
        description: 'Soroti kutipan penting',
        icon: Quote,
        command: (editor) => {
            editor.chain().focus().toggleBlockquote().run();
        },
    },
    {
        key: 'image',
        label: 'Gambar',
        description: 'Sisipkan gambar dari URL',
        icon: ImageIcon,
        command: (editor) => {
            const url = window.prompt('Masukkan URL gambar');

            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        },
    },
];

const filterSlashOptions = (query: string): SlashCommandOption[] => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        return slashCommandOptions;
    }

    return slashCommandOptions.filter((option) => {
        const labelMatch = option.label.toLowerCase().includes(normalized);
        const keyMatch = option.key.toLowerCase().includes(normalized);

        return labelMatch || keyMatch;
    });
};

const iconButtonClass = cn(
    'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40',
    'hover:bg-muted hover:text-foreground',
);

const colorButtonClass = 'h-8 w-8 rounded-md border border-border transition-all hover:scale-105 focus:outline-none focus:ring-1 focus:ring-primary/40';

const NotionBubbleMenu = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Masukkan URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }, [editor]);

    const handleTextColor = useCallback(
        (color: string) => {
            if (color === 'currentColor') {
                editor.chain().focus().unsetColor().run();
                return;
            }

            editor.chain().focus().setColor(color).run();
        },
        [editor],
    );

    const handleHighlight = useCallback(
        (color: string) => {
            if (color === 'transparent') {
                editor.chain().focus().unsetHighlight().run();
                return;
            }

            editor.chain().focus().toggleHighlight({ color }).run();
        },
        [editor],
    );

    return (
        <BubbleMenu
            editor={editor}
            options={{ placement: 'top', offset: 12 }}
            shouldShow={({ state }) => {
                const { selection } = state;

                return !selection.empty && selection.from !== selection.to;
            }}
        >
            <div className='flex items-center gap-1 rounded-lg border bg-popover px-2 py-1 shadow-lg'>
                <button
                    type='button'
                    className={cn(iconButtonClass, editor.isActive('bold') && 'bg-muted text-foreground font-semibold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title='Bold'
                >
                    <Bold className='h-4 w-4' />
                </button>
                <button
                    type='button'
                    className={cn(iconButtonClass, editor.isActive('italic') && 'bg-muted text-foreground')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title='Italic'
                >
                    <Italic className='h-4 w-4' />
                </button>
                <button
                    type='button'
                    className={cn(iconButtonClass, editor.isActive('underline') && 'bg-muted text-foreground')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title='Underline'
                >
                    <UnderlineIcon className='h-4 w-4' />
                </button>
                <button
                    type='button'
                    className={cn(iconButtonClass, editor.isActive('strike') && 'bg-muted text-foreground')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title='Strikethrough'
                >
                    <Strikethrough className='h-4 w-4' />
                </button>
                <button
                    type='button'
                    className={cn(iconButtonClass, editor.isActive('code') && 'bg-muted text-foreground')}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    title='Code'
                >
                    <Code className='h-4 w-4' />
                </button>

                <span className='mx-1 h-5 w-px bg-border/70' />

                <button
                    type='button'
                    className={cn(iconButtonClass, editor.isActive('link') && 'bg-muted text-foreground')}
                    onClick={setLink}
                    title='Tambah tautan'
                >
                    <LinkIcon className='h-4 w-4' />
                </button>

                <Popover>
                    <PopoverTrigger asChild>
                        <button type='button' className={iconButtonClass} title='Warna teks'>
                            <Palette className='h-4 w-4' />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto min-w-[200px] space-y-2 p-3' align='start'>
                        <p className='text-xs font-medium text-muted-foreground'>Warna teks</p>
                        <div className='grid grid-cols-5 gap-2'>
                            {textColors.map((color) => (
                                <button
                                    key={color.value}
                                    type='button'
                                    className={cn(
                                        colorButtonClass,
                                        editor.isActive('textStyle', { color: color.value }) && 'border-primary ring-2 ring-primary/60',
                                    )}
                                    style={{ backgroundColor: color.value === 'currentColor' ? '#f3f4f6' : color.value }}
                                    onClick={() => handleTextColor(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <button type='button' className={iconButtonClass} title='Highlight'>
                            <Highlighter className='h-4 w-4' />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto min-w-[200px] space-y-2 p-3' align='start'>
                        <p className='text-xs font-medium text-muted-foreground'>Warna latar</p>
                        <div className='grid grid-cols-5 gap-2'>
                            {backgroundColors.map((color) => (
                                <button
                                    key={color.value}
                                    type='button'
                                    className={cn(
                                        colorButtonClass,
                                        editor.isActive('highlight', { color: color.value }) && 'border-primary ring-2 ring-primary/60',
                                    )}
                                    style={{ backgroundColor: color.value === 'transparent' ? '#ffffff' : color.value }}
                                    onClick={() => handleHighlight(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </BubbleMenu>
    );
};

type BlockOption = {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    action: () => void;
    hidden?: boolean;
};

type SlashMenuState = {
    open: boolean;
    query: string;
    selectedIndex: number;
    range: { from: number; to: number } | null;
    coords: { top: number; left: number } | null;
};

const createDefaultSlashState = (): SlashMenuState => ({
    open: false,
    query: '',
    selectedIndex: 0,
    range: null,
    coords: null,
});

const floatingButtonClass = cn(
    'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40',
    'hover:bg-muted hover:text-foreground',
);

const NotionFloatingMenu = ({ editor, mode }: { editor: Editor | null; mode: 'simple' | 'block' }) => {
    const [open, setOpen] = useState(false);

    if (!editor || mode !== 'block') {
        return null;
    }

    const blockOptions: BlockOption[] = [
        {
            key: 'text',
            label: 'Teks',
            description: 'Mulai dengan paragraf biasa',
            icon: Type,
            action: () => editor.chain().focus().setParagraph().run(),
        },
        {
            key: 'h1',
            label: 'Heading 1',
            description: 'Judul besar untuk halaman',
            icon: Heading1,
            action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
            key: 'h2',
            label: 'Heading 2',
            description: 'Subjudul utama',
            icon: Heading2,
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
            key: 'bullet',
            label: 'Daftar Bullet',
            description: 'Daftar dengan poin',
            icon: List,
            action: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
            key: 'numbered',
            label: 'Daftar Nomor',
            description: 'Daftar bernomor',
            icon: ListOrdered,
            action: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
            key: 'todo',
            label: 'Daftar Tugas',
            description: 'Checklist interaktif',
            icon: CheckSquare,
            action: () => editor.chain().focus().toggleTaskList().run(),
        },
        {
            key: 'quote',
            label: 'Quote',
            description: 'Soroti kutipan penting',
            icon: Quote,
            action: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
            key: 'image',
            label: 'Gambar',
            description: 'Sisipkan gambar dari URL',
            icon: ImageIcon,
            action: () => {
                const url = window.prompt('Masukkan URL gambar');

                if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                }
            },
        },
    ];

    const selectBlockForDrag = () => {
        const { state, view } = editor;
        const { selection } = state;
        const { $from } = selection;

        for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth);

            if (!node.type.isBlock) {
                continue;
            }

            const pos = $from.before(depth);
            const nodeSelection = NodeSelection.create(state.doc, pos);

            view.dispatch(state.tr.setSelection(nodeSelection));
            view.focus();

            const domNode = view.nodeDOM(pos);

            if (domNode instanceof HTMLElement) {
                return domNode;
            }

            break;
        }

        return null;
    };

    return (
        <FloatingMenu
            editor={editor}
            className='z-20'
            shouldShow={(props) => {
                const { state, editor: floatingEditor } = props;
                const { selection } = state;

                if (!floatingEditor.isFocused) {
                    return false;
                }

                if (!selection.empty) {
                    return false;
                }

                const { $from } = selection;

                if (!$from || !$from.parent.type.isTextblock) {
                    return false;
                }

                return true;
            }}
            options={{ placement: 'left-start', offset: { mainAxis: 0, crossAxis: -32 } }}
        >
            <div className='flex items-center gap-1 rounded-full border border-border/80 bg-popover px-2 py-1 shadow-lg'>
                <button
                    type='button'
                    className={floatingButtonClass}
                    title='Seret blok'
                    data-drag-handle='true'
                    draggable
                    onPointerDown={() => {
                        selectBlockForDrag();
                    }}
                    onDragStart={(event) => {
                        const domNode = selectBlockForDrag();

                        if (!domNode) {
                            event.preventDefault();
                            return;
                        }

                        const { state, view } = editor;

                        domNode.setAttribute('draggable', 'true');

                        const slice = state.selection.content();
                        const serializer = DOMSerializer.fromSchema(state.schema);
                        const fragment = serializer.serializeFragment(slice.content, { document }) as DocumentFragment;
                        const container = document.createElement('div');
                        container.appendChild(fragment);
                        const html = container.innerHTML;
                        const text = slice.content.textBetween(0, slice.content.size, '\n');

                        if (event.dataTransfer) {
                            event.dataTransfer.clearData();

                            if (html) {
                                event.dataTransfer.setData('text/html', html);
                            }

                            event.dataTransfer.setData('text/plain', text);
                            event.dataTransfer.effectAllowed = 'move';

                            const dragImage = domNode.cloneNode(true) as HTMLElement;
                            dragImage.style.position = 'absolute';
                            dragImage.style.pointerEvents = 'none';
                            dragImage.style.top = '-9999px';
                            dragImage.style.left = '-9999px';
                            document.body.appendChild(dragImage);
                            event.dataTransfer.setDragImage(dragImage, 0, 0);

                            requestAnimationFrame(() => {
                                dragImage.remove();
                            });
                        }

                        view.dragging = { slice, move: !event.ctrlKey && !event.metaKey };

                        domNode.addEventListener(
                            'dragend',
                            () => {
                                domNode.removeAttribute('draggable');

                                if (view.dragging) {
                                    view.dragging = null;
                                }
                            },
                            { once: true },
                        );
                    }}
                >
                    <GripVertical className='h-4 w-4' />
                </button>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button type='button' className={floatingButtonClass} title='Tambahkan blok'>
                            <Plus className='h-4 w-4' />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align='start' className='w-72 space-y-1 p-2'>
                        {blockOptions.map((option) => (
                            <button
                                key={option.key}
                                type='button'
                                onClick={() => {
                                    option.action();
                                    setOpen(false);
                                }}
                                className='flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/40'
                            >
                                <option.icon className='mt-0.5 h-5 w-5 text-muted-foreground' />
                                <div className='space-y-0.5'>
                                    <p className='text-sm font-medium text-foreground'>{option.label}</p>
                                    <p className='text-xs text-muted-foreground'>{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </PopoverContent>
                </Popover>
            </div>
        </FloatingMenu>
    );
};

const SimpleToolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const canUndo = editor.can().chain().focus().undo().run();
    const canRedo = editor.can().chain().focus().redo().run();

    return (
        <div className='flex flex-wrap items-center gap-1'>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent')}
                title='Heading 1'
            >
                <Heading1 className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent')}
                title='Heading 2'
            >
                <Heading2 className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={cn(editor.isActive('paragraph') && 'bg-accent')}
                title='Paragraf'
            >
                <Type className='h-4 w-4' />
            </Button>

            <div className='mx-2 h-6 w-px bg-border/60' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn(editor.isActive('bold') && 'bg-accent')}
                title='Bold'
            >
                <Bold className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn(editor.isActive('italic') && 'bg-accent')}
                title='Italic'
            >
                <Italic className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={cn(editor.isActive('underline') && 'bg-accent')}
                title='Underline'
            >
                <UnderlineIcon className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={cn(editor.isActive('strike') && 'bg-accent')}
                title='Strikethrough'
            >
                <Strikethrough className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={cn(editor.isActive('code') && 'bg-accent')}
                title='Kode inline'
            >
                <Code className='h-4 w-4' />
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button type='button' variant='ghost' size='sm' title='Warna teks'>
                        <Palette className='h-4 w-4' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto min-w-[200px] space-y-2 p-3' align='start'>
                    <p className='text-xs font-medium text-muted-foreground'>Warna teks</p>
                    <div className='grid grid-cols-5 gap-2'>
                        {textColors.map((color) => (
                            <button
                                key={color.value}
                                type='button'
                                onClick={() => {
                                    if (color.value === 'currentColor') {
                                        editor.chain().focus().unsetColor().run();
                                    } else {
                                        editor.chain().focus().setColor(color.value).run();
                                    }
                                }}
                                className={cn(
                                    colorButtonClass,
                                    editor.isActive('textStyle', { color: color.value }) && 'border-primary ring-2 ring-primary/60',
                                )}
                                style={{ backgroundColor: color.value === 'currentColor' ? '#f3f4f6' : color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <Button type='button' variant='ghost' size='sm' title='Warna latar'>
                        <Highlighter className='h-4 w-4' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto min-w-[200px] space-y-2 p-3' align='start'>
                    <p className='text-xs font-medium text-muted-foreground'>Warna latar</p>
                    <div className='grid grid-cols-5 gap-2'>
                        {backgroundColors.map((color) => (
                            <button
                                key={color.value}
                                type='button'
                                onClick={() => {
                                    if (color.value === 'transparent') {
                                        editor.chain().focus().unsetHighlight().run();
                                    } else {
                                        editor.chain().focus().toggleHighlight({ color: color.value }).run();
                                    }
                                }}
                                className={cn(
                                    colorButtonClass,
                                    editor.isActive('highlight', { color: color.value }) && 'border-primary ring-2 ring-primary/60',
                                )}
                                style={{ backgroundColor: color.value === 'transparent' ? '#ffffff' : color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <div className='mx-2 h-6 w-px bg-border/60' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
                title='Rata kiri'
            >
                <AlignLeft className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
                title='Rata tengah'
            >
                <AlignCenter className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
                title='Rata kanan'
            >
                <AlignRight className='h-4 w-4' />
            </Button>

            <div className='mx-2 h-6 w-px bg-border/60' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editor.isActive('bulletList') && 'bg-accent')}
                title='Daftar bullet'
            >
                <List className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editor.isActive('orderedList') && 'bg-accent')}
                title='Daftar nomor'
            >
                <ListOrdered className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={cn(editor.isActive('taskList') && 'bg-accent')}
                title='Daftar tugas'
            >
                <CheckSquare className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(editor.isActive('blockquote') && 'bg-accent')}
                title='Quote'
            >
                <Quote className='h-4 w-4' />
            </Button>

            <div className='mx-2 h-6 w-px bg-border/60' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!canUndo}
                title='Undo'
            >
                <Undo className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!canRedo}
                title='Redo'
            >
                <Redo className='h-4 w-4' />
            </Button>
        </div>
    );
};

const SlashCommandMenu = ({
    state,
    options,
    onSelect,
}: {
    state: SlashMenuState;
    options: SlashCommandOption[];
    onSelect: (option: SlashCommandOption) => void;
}) => {
    if (!state.open || !state.coords || options.length === 0) {
        return null;
    }

    return (
        <div
            className='fixed z-50 w-72 rounded-lg border border-border/80 bg-popover/95 backdrop-blur shadow-xl'
            style={{ top: state.coords.top + 32, left: state.coords.left }}
        >
            <div className='max-h-72 overflow-y-auto p-2'>
                {options.map((option, index) => {
                    const isActive = index === state.selectedIndex;

                    return (
                        <button
                            key={option.key}
                            type='button'
                            onMouseDown={(event) => {
                                event.preventDefault();
                                onSelect(option);
                            }}
                            className={cn(
                                'flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors',
                                isActive ? 'bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <option.icon className='mt-0.5 h-5 w-5 flex-shrink-0' />
                            <div className='space-y-0.5'>
                                <p className='text-sm font-medium leading-none'>{option.label}</p>
                                <p className='text-xs text-muted-foreground'>{option.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export function RichTextEditor({
    content,
    onChange,
    placeholder = 'Ketik "/" untuk membuka perintah atau mulai menulis...',
    className,
    mode = 'block',
    minHeight = '150px',
}: RichTextEditorProps) {
    const [editorMode, setEditorMode] = useState<'simple' | 'block'>(mode);
    const [slashState, setSlashState] = useState<SlashMenuState>(createDefaultSlashState);
    const slashStateRef = useRef<SlashMenuState>(createDefaultSlashState());

    const headingLevels = useMemo<Array<1 | 2 | 3 | 4 | 5 | 6>>(
        () => (editorMode === 'block' ? [1, 2, 3, 4, 5, 6] : [1, 2]),
        [editorMode],
    );

    const setSlashStateWithRef = useCallback(
        (valueOrUpdater: SlashMenuState | ((previous: SlashMenuState) => SlashMenuState)) => {
            setSlashState((previous) => {
                const next =
                    typeof valueOrUpdater === 'function'
                        ? (valueOrUpdater as (prev: SlashMenuState) => SlashMenuState)(previous)
                        : valueOrUpdater;

                if (next === previous) {
                    slashStateRef.current = previous;
                    return previous;
                }

                const nextState = { ...next };
                slashStateRef.current = nextState;

                return nextState;
            });
        },
        [],
    );

    const filteredSlashOptions = useMemo(() => {
        if (!slashState.open) {
            return [];
        }

        return filterSlashOptions(slashState.query);
    }, [slashState.open, slashState.query]);

    useEffect(() => {
        if (!slashState.open) {
            return;
        }

        setSlashStateWithRef((previous) => {
            if (!previous.open) {
                return previous;
            }

            const boundedIndex = Math.min(previous.selectedIndex, Math.max(filteredSlashOptions.length - 1, 0));

            if (boundedIndex === previous.selectedIndex) {
                return previous;
            }

            return {
                ...previous,
                selectedIndex: boundedIndex,
            };
    });
    }, [filteredSlashOptions.length, slashState.open, setSlashStateWithRef]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: headingLevels,
                },
                code: {
                    HTMLAttributes: {
                        class: 'bg-muted px-1.5 py-0.5 rounded text-sm font-mono',
                    },
                },
                codeBlock: {
                    HTMLAttributes: {
                        class: 'bg-muted p-4 rounded-lg font-mono text-sm my-2',
                    },
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            TaskList.configure({
                HTMLAttributes: {
                    class: 'not-prose',
                },
            }),
            TaskItem.configure({
                HTMLAttributes: {
                    class: 'flex items-start gap-2',
                },
                nested: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline underline-offset-4',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
                includeChildren: true,
                showOnlyWhenEditable: true,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: cn(
                    'ProseMirror notion-content mx-auto w-full max-w-3xl px-1 focus:outline-none',
                    'prose prose-stone dark:prose-invert max-w-none text-base leading-[1.75] sm:px-2',
                    'prose-headings:font-semibold prose-headings:tracking-tight',
                    'prose-h1:mt-6 prose-h1:mb-3 prose-h1:text-4xl prose-h1:leading-tight',
                    'prose-h2:mt-5 prose-h2:mb-2 prose-h2:text-3xl',
                    'prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-2xl',
                    'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1',
                    'prose-blockquote:border-l-2 prose-blockquote:border-border/70 prose-blockquote:pl-4',
                    'prose-pre:bg-muted prose-pre:border prose-pre:border-border/60 prose-pre:rounded-lg',
                    'prose-code:rounded-md prose-code:bg-muted px-1.5 py-0.5 prose-code:text-sm',
                    'prose-img:my-4 prose-img:rounded-lg prose-a:text-primary prose-a:underline',
                ),
                spellcheck: 'true',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    }, [editorMode, headingLevels, placeholder]);

    const applySlashOption = useCallback(
        (option: SlashCommandOption) => {
            if (!editor) {
                return;
            }

            const { range } = slashStateRef.current;

            if (!range) {
                return;
            }

            editor.chain().focus().deleteRange(range).run();
            option.command(editor);
            setSlashStateWithRef(createDefaultSlashState());
        },
        [editor, setSlashStateWithRef],
    );

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    useEffect(() => {
        setEditorMode(mode);
    }, [mode]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const updateSlashState = () => {
            const { state } = editor;
            const { selection } = state;

            if (!selection.empty) {
                if (slashStateRef.current.open) {
                    setSlashStateWithRef(createDefaultSlashState());
                }

                return;
            }

            const { $from } = selection;

            if (!$from) {
                if (slashStateRef.current.open) {
                    setSlashStateWithRef(createDefaultSlashState());
                }

                return;
            }

            const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\u0000', '\u0000');
            const slashIndex = textBefore.lastIndexOf('/');

            if (slashIndex === -1) {
                if (slashStateRef.current.open) {
                    setSlashStateWithRef(createDefaultSlashState());
                }

                return;
            }

            if (slashIndex > 0) {
                const charBeforeSlash = textBefore[slashIndex - 1];

                if (charBeforeSlash && !/[\s\u0000]/.test(charBeforeSlash)) {
                    if (slashStateRef.current.open) {
                        setSlashStateWithRef(createDefaultSlashState());
                    }

                    return;
                }
            }

            const query = textBefore.slice(slashIndex + 1);
            const from = $from.start() + slashIndex;
            const to = from + query.length + 1;

            let coords: { top: number; left: number } | null = null;

            try {
                const position = editor.view.coordsAtPos(from);
                coords = { top: position.bottom, left: position.left };
            } catch (_error) {
                coords = null;
            }

            if (!coords) {
                if (slashStateRef.current.open) {
                    setSlashStateWithRef(createDefaultSlashState());
                }

                return;
            }

            setSlashStateWithRef({
                open: true,
                query,
                selectedIndex: 0,
                range: { from, to },
                coords,
            });
        };

        const hideSlash = () => {
            if (slashStateRef.current.open) {
                setSlashStateWithRef(createDefaultSlashState());
            }
        };

        editor.on('selectionUpdate', updateSlashState);
        editor.on('transaction', updateSlashState);
        editor.on('update', updateSlashState);
        editor.on('blur', hideSlash);

        return () => {
            editor.off('selectionUpdate', updateSlashState);
            editor.off('transaction', updateSlashState);
            editor.off('update', updateSlashState);
            editor.off('blur', hideSlash);
        };
    }, [editor, setSlashStateWithRef]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            const currentSlashState = slashStateRef.current;

            if (!currentSlashState.open) {
                return;
            }

            const options = filterSlashOptions(currentSlashState.query);

            if (event.key === 'ArrowDown') {
                if (!options.length) {
                    return;
                }

                event.preventDefault();
                setSlashStateWithRef((previous) => ({
                    ...previous,
                    selectedIndex: (previous.selectedIndex + 1) % options.length,
                }));

                return;
            }

            if (event.key === 'ArrowUp') {
                if (!options.length) {
                    return;
                }

                event.preventDefault();
                setSlashStateWithRef((previous) => ({
                    ...previous,
                    selectedIndex: (previous.selectedIndex - 1 + options.length) % options.length,
                }));

                return;
            }

            if (event.key === 'Enter') {
                if (!options.length) {
                    return;
                }

                event.preventDefault();
                const option = options[currentSlashState.selectedIndex] ?? options[0];

                if (option) {
                    applySlashOption(option);
                }

                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                setSlashStateWithRef(createDefaultSlashState());
                return;
            }
        };

        const dom = editor.view.dom as HTMLElement;
        dom.addEventListener('keydown', handleKeyDown);

        return () => {
            dom.removeEventListener('keydown', handleKeyDown);
        };
    }, [editor, applySlashOption, setSlashStateWithRef]);

    return (
        <div className={cn('rounded-3xl border border-border/40 pt-4', className)}>
            <div className='mx-auto w-full space-y-4'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setEditorMode(editorMode === 'simple' ? 'block' : 'simple')}
                        title={editorMode === 'simple' ? 'Ubah ke mode blok' : 'Ubah ke mode sederhana'}
                        className='ml-auto gap-2 rounded-full border border-transparent px-3 py-1 text-xs'
                    >
                        {editorMode === 'simple' ? <Blocks className='h-4 w-4' /> : <Text className='h-4 w-4' />}
                        <span>{editorMode === 'simple' ? 'Mode Blok' : 'Mode Sederhana'}</span>
                    </Button>
                </div>
                {editorMode === 'simple' ? (
                    <div className='w-fit mx-auto rounded-xl border border-border/40 bg-card px-3 py-2 shadow-sm'>
                        <SimpleToolbar editor={editor} />
                    </div>
                ) : null}
                <div className='relative rounded-2xl border border-border/40 bg-card px-6 py-8 shadow-sm transition-colors hover:border-border/60'>
                    {editor ? (
                        <>
                            <NotionBubbleMenu editor={editor} />
                            <NotionFloatingMenu editor={editor} mode={editorMode} />
                        </>
                    ) : null}
                    <EditorContent editor={editor} style={{ minHeight }} />
                </div>
            </div>
            <SlashCommandMenu state={slashState} options={filteredSlashOptions} onSelect={applySlashOption} />
            <style>{`
                .notion-content {
                    min-height: ${minHeight};
                }

                .notion-content > * {
                    position: relative;
                }

                .notion-content > * + * {
                    margin-top: 0.75rem;
                }
            `}</style>
        </div>
    );
}
