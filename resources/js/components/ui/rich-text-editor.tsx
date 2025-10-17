import { useEditor, EditorContent, type Editor } from '@tiptap/react';
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
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Image as ImageIcon,
    Heading1,
    Heading2,
    Heading3,
    Type,
    Maximize2,
    Minimize2,
    Palette,
    Highlighter,
    GripVertical,
    Blocks,
    Text,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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

const MenuBar = ({ editor, mode }: { editor: Editor | null; mode: 'simple' | 'block' }) => {
    if (!editor) {
        return null;
    }

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        const url = window.prompt('Image URL');

        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    return (
        <div className='flex flex-wrap items-center gap-1'>
            {/* Headings - Block mode only */}
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
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={cn(editor.isActive('heading', { level: 3 }) && 'bg-accent')}
                        title='Heading 3'
                    >
                        <Heading3 className='h-4 w-4' />
                    </Button>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className={cn(editor.isActive('paragraph') && 'bg-accent')}
                        title='Paragraph'
                    >
                        <Type className='h-4 w-4' />
                    </Button>

                    <div className='mx-2 h-6 w-px bg-border' />

            {/* Text Formatting */}
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
                title='Code'
            >
                <Code className='h-4 w-4' />
            </Button>

            {/* Text Color Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button type='button' variant='ghost' size='sm' title='Text Color'>
                        <Palette className='h-4 w-4' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-2' align='start'>
                    <div className='grid grid-cols-3 gap-1'>
                        {textColors.map((color) => (
                            <button
                                key={color.value}
                                type='button'
                                onClick={() => editor.chain().focus().setColor(color.value).run()}
                                className={cn(
                                    'h-8 w-8 rounded border-2 transition-all hover:scale-110',
                                    editor.isActive('textStyle', { color: color.value })
                                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                                        : 'border-border',
                                )}
                                style={{ backgroundColor: color.value === 'currentColor' ? '#e5e7eb' : color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Background Color Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button type='button' variant='ghost' size='sm' title='Background Color'>
                        <Highlighter className='h-4 w-4' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-2' align='start'>
                    <div className='grid grid-cols-3 gap-1'>
                        {backgroundColors.map((color) => (
                            <button
                                key={color.value}
                                type='button'
                                onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
                                className={cn(
                                    'h-8 w-8 rounded border-2 transition-all hover:scale-110',
                                    editor.isActive('highlight', { color: color.value })
                                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                                        : 'border-border',
                                )}
                                style={{ backgroundColor: color.value === 'transparent' ? '#ffffff' : color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <div className='mx-2 h-6 w-px bg-border' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
                title='Align Left'
            >
                <AlignLeft className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
                title='Align Center'
            >
                <AlignCenter className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
                title='Align Right'
            >
                <AlignRight className='h-4 w-4' />
            </Button>

            <div className='mx-2 h-6 w-px bg-border' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editor.isActive('bulletList') && 'bg-accent')}
                title='Bullet List'
            >
                <List className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editor.isActive('orderedList') && 'bg-accent')}
                title='Numbered List'
            >
                <ListOrdered className='h-4 w-4' />
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

            <div className='mx-2 h-6 w-px bg-border' />

            <Button type='button' variant='ghost' size='sm' onClick={setLink} className={cn(editor.isActive('link') && 'bg-accent')} title='Link'>
                <LinkIcon className='h-4 w-4' />
            </Button>
            <Button type='button' variant='ghost' size='sm' onClick={addImage} title='Image'>
                <ImageIcon className='h-4 w-4' />
            </Button>

            <div className='mx-2 h-6 w-px bg-border' />

            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                title='Undo'
            >
                <Undo className='h-4 w-4' />
            </Button>
            <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                title='Redo'
            >
                <Redo className='h-4 w-4' />
            </Button>
        </div>
    );
};

export function RichTextEditor({
    content,
    onChange,
    placeholder = 'Mulai menulis di sini...',
    className,
    mode = 'block',
    minHeight = '150px',
}: RichTextEditorProps) {
    const [editorMode, setEditorMode] = useState<'simple' | 'block'>(mode);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: editorMode === 'block' ? { levels: [1, 2, 3, 4, 5, 6] } : false,
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
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm focus:outline-none max-w-none p-3',
                    editorMode === 'block' && 'sm:prose lg:prose-base',
                    '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:before:content-none [&_code]:after:content-none',
                    '[&_.ProseMirror]:min-h-[100px]',
                    '[&_.ProseMirror>*+*]:mt-2',
                    '[&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h1]:mb-2',
                    '[&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h2]:mb-2',
                    '[&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1',
                    '[&_.ProseMirror_p]:my-1 [&_.ProseMirror_p]:leading-6',
                    '[&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ol]:my-2',
                    '[&_.ProseMirror_li]:my-0.5',
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className={cn('rounded-lg border border-input bg-background', className)}>
            <div className='flex items-center justify-between border-b bg-muted/30 px-3 py-1.5'>
                <div className='flex-1'>
                    <MenuBar editor={editor} mode={editorMode} />
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setEditorMode(editorMode === 'simple' ? 'block' : 'simple')}
                        title={editorMode === 'simple' ? 'Switch to Block Editor' : 'Switch to Simple Editor'}
                    >
                        {editorMode === 'simple' ? <Blocks/> : <Text/>}
                    </Button>
                </div>
            </div>
            <div 
                className='relative pl-6 [&_.ProseMirror>*]:group [&_.ProseMirror>*]:relative [&_.ProseMirror>*:hover]:bg-muted/5 [&_.ProseMirror>*:hover]:rounded-sm [&_.ProseMirror>*]:transition-colors'
                style={{ minHeight }}
            >
                <style>{`
                    .ProseMirror > *:hover::before {
                        content: '';
                        position: absolute;
                        left: -20px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 16px;
                        height: 16px;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='5' r='1'/%3E%3Ccircle cx='9' cy='12' r='1'/%3E%3Ccircle cx='9' cy='19' r='1'/%3E%3Ccircle cx='15' cy='5' r='1'/%3E%3Ccircle cx='15' cy='12' r='1'/%3E%3Ccircle cx='15' cy='19' r='1'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: center;
                        cursor: grab;
                        opacity: 0;
                        transition: opacity 0.2s;
                    }
                    .ProseMirror > *:hover::before {
                        opacity: 1;
                    }
                `}</style>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
