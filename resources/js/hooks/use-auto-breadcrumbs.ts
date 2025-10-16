import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import * as RouteDefinitions from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Derives breadcrumb trails automatically from the current Inertia page.
 *
 * 1. Seeds the trail with "Home" (using the dashboard route).
 * 2. Attempts to match each URL segment against IDs found in the hydrated page props
 *    (useful for routes like `/bookmark-domains/367/edit`, where the domain is already in props).
 * 3. Falls back to a humanised segment label. Labels for static segments are inferred from the
 *    generated Wayfinder route definitions, keeping them in sync with Laravel's router.
 * 4. Allows page components to supply optional `breadcrumbResolvers` (either an array of
 *    resolver functions or an object keyed by segment) for custom cases, such as slug segments or
 *    nested relationships.
 */

interface EntityLike {
    id?: number | string;
    name?: string;
    title?: string;
}

type BreadcrumbResolverContext = {
    segment: string;
    index: number;
    segments: string[];
    props: Record<string, unknown>;
    href: string;
};

type BreadcrumbResolver = (context: BreadcrumbResolverContext) => BreadcrumbItem | null | undefined;

const HOME_CRUMB: BreadcrumbItem = {
    title: 'Home',
    href: DashboardController.index().url,
};

type RouteExport = {
    definition?: { url?: string };
};

function normaliseResolverInput(input: unknown): BreadcrumbResolver[] {
    if (!input) {
        return [];
    }

    const resolvers: BreadcrumbResolver[] = [];

    const pushResolver = (resolver: unknown) => {
        if (typeof resolver === 'function') {
            resolvers.push(resolver as BreadcrumbResolver);
        }
    };

    if (Array.isArray(input)) {
        input.forEach(pushResolver);
        return resolvers;
    }

    if (typeof input === 'function') {
        pushResolver(input);
        return resolvers;
    }

    if (input && typeof input === 'object') {
        Object.entries(input as Record<string, unknown>).forEach(([segmentKey, resolver]) => {
            if (typeof resolver !== 'function') {
                return;
            }

            const matcher = resolver as BreadcrumbResolver;
            resolvers.push((context) => {
                if (context.segment.toLowerCase() !== segmentKey.toLowerCase()) {
                    return null;
                }

                return matcher(context);
            });
        });
    }

    return resolvers;
}

const segmentLabelMap = (() => {
    const entries = new Map<string, string>();

    Object.values(RouteDefinitions).forEach((route) => {
        if (typeof route !== 'function') {
            return;
        }

        const definition = (route as RouteExport).definition;
        if (!definition || typeof definition.url !== 'string') {
            return;
        }

        definition.url
            .split('/')
            .filter(Boolean)
            .filter((segment) => !segment.startsWith('{'))
            .forEach((segment) => {
                const normalized = segment.toLowerCase();
                if (!entries.has(normalized)) {
                    entries.set(normalized, humanizeSegment(segment));
                }
            });
    });

    return entries;
})();

function humanizeSegment(segment: string): string {
    if (!segment) {
        return '';
    }

    return segment
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function resolveEntityBreadcrumb(idSegment: string, props: Record<string, unknown>, href: string): BreadcrumbItem | null {
    if (!/^[0-9]+$/.test(idSegment)) {
        return null;
    }

    const visited = new Set<unknown>();
    const idAsString = idSegment;

    const queue: unknown[] = [props];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current || typeof current !== 'object') {
            continue;
        }

        if (visited.has(current)) {
            continue;
        }

        visited.add(current);

        if (!Array.isArray(current)) {
            const entity = current as EntityLike & Record<string, unknown>;
            if (entity.id !== undefined && String(entity.id) === idAsString) {
                const title = entity.name ?? entity.title ?? `#${idSegment}`;
                return { title, href };
            }
        }

        Object.values(current).forEach((value) => {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        });
    }

    return null;
}

function buildHref(segments: string[], index: number): string {
    const path = segments.slice(0, index + 1).join('/');
    return `/${path}`;
}

/**
 * Example – inside an Inertia page:
 *
 * ```tsx
 * const product = usePage<PageProps>().props.product;
 * return (
 *   <AppLayout
 *     breadcrumbResolvers={{
 *       products: ({ href }) => ({ title: 'Products', href }),
 *       [product.slug]: () => ({ title: product.name, href: route('products.show', product) }),
 *     }}
 *   >
 *     ...
 *   </AppLayout>
 * )
 * ```
 */
export function useAutoBreadcrumbs(): BreadcrumbItem[] {
    const page = usePage<SharedData & Record<string, unknown>>();
    const urlSegments = page.url.split('?')[0]?.split('/').filter(Boolean) ?? [];
    const customResolvers = normaliseResolverInput((page.props as Record<string, unknown>).breadcrumbResolvers);

    if (urlSegments.length === 0) {
        return [HOME_CRUMB];
    }

    const breadcrumbs: BreadcrumbItem[] = [HOME_CRUMB];

    urlSegments.forEach((segment, index) => {
        const href = buildHref(urlSegments, index);
        const entityBreadcrumb = resolveEntityBreadcrumb(segment, page.props, href);
        if (entityBreadcrumb) {
            breadcrumbs.push(entityBreadcrumb);
            return;
        }

        for (const resolver of customResolvers) {
            const resolved = resolver({ segment, index, segments: urlSegments, props: page.props, href });
            if (resolved) {
                breadcrumbs.push(resolved);
                return;
            }
        }

        const normalized = segment.toLowerCase();
        const title = segmentLabelMap.get(normalized) ?? humanizeSegment(segment);

        breadcrumbs.push({
            title,
            href,
        });
    });

    return breadcrumbs;
}
