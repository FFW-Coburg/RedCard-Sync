import { Head, Link, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useCallback, useState } from 'react';
import { DetailsBadge, PartnerStatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, PaginatedData, PartnerListItem } from '@/types';

interface Props {
    partners: PaginatedData<PartnerListItem>;
    categories: Category[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
        details?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Partners', href: '/partners' },
];

export default function PartnersIndex({ partners, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = useCallback(
        (newFilters: Record<string, string | undefined>) => {
            const merged = { ...filters, ...newFilters };
            // Remove empty values
            const cleaned: Record<string, string> = {};
            for (const [k, v] of Object.entries(merged)) {
                if (v && v !== 'all') cleaned[k] = v;
            }
            router.get('/partners', cleaned, { preserveState: true, preserveScroll: true });
        },
        [filters],
    );

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            applyFilters({ search: value || undefined });
        }, 300),
        [applyFilters],
    );

    const handleExport = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/export/partners';
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_token';
        input.value = csrf;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Partners" />
            <div className="flex flex-col gap-4 p-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="Partner suchen..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            debouncedSearch(e.target.value);
                        }}
                        className="w-64"
                    />
                    <Select
                        value={filters.category ?? 'all'}
                        onValueChange={(v) => applyFilters({ category: v === 'all' ? undefined : v })}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Kategorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Kategorien</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.slug} value={cat.slug}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(v) => applyFilters({ status: v === 'all' ? undefined : v })}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle</SelectItem>
                            <SelectItem value="active">Aktiv</SelectItem>
                            <SelectItem value="inactive">Inaktiv</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.details ?? 'all'}
                        onValueChange={(v) => applyFilters({ details: v === 'all' ? undefined : v })}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Details" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle</SelectItem>
                            <SelectItem value="fetched">Mit Details</SelectItem>
                            <SelectItem value="missing">Ohne Details</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="mr-1 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Ort</TableHead>
                                <TableHead>Kategorien</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Keine Partner gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                            {partners.data.map((partner) => (
                                <TableRow key={partner.id}>
                                    <TableCell>
                                        <Link
                                            href={`/partners/${partner.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {partner.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {partner.postal_code} {partner.city}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {partner.categories?.map((cat) => (
                                                <Badge key={cat.id} variant="outline" className="text-xs">
                                                    {cat.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <PartnerStatusBadge isActive={partner.is_active} />
                                    </TableCell>
                                    <TableCell>
                                        <DetailsBadge fetched={partner.details_fetched} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {partners.last_page > 1 && (
                    <Pagination>
                        <PaginationContent>
                            {partners.current_page > 1 && (
                                <PaginationItem>
                                    <PaginationPrevious href={`/partners?${buildQuery(filters, partners.current_page - 1)}`} />
                                </PaginationItem>
                            )}
                            {Array.from({ length: partners.last_page }, (_, i) => i + 1)
                                .filter((page) => {
                                    const current = partners.current_page;
                                    return page === 1 || page === partners.last_page || Math.abs(page - current) <= 2;
                                })
                                .map((page, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const items = [];
                                    if (prev && page - prev > 1) {
                                        items.push(
                                            <PaginationItem key={`ellipsis-${page}`}>
                                                <span className="px-2 text-muted-foreground">...</span>
                                            </PaginationItem>,
                                        );
                                    }
                                    items.push(
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={`/partners?${buildQuery(filters, page)}`}
                                                isActive={page === partners.current_page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>,
                                    );
                                    return items;
                                })}
                            {partners.current_page < partners.last_page && (
                                <PaginationItem>
                                    <PaginationNext href={`/partners?${buildQuery(filters, partners.current_page + 1)}`} />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                )}

                <div className="text-sm text-muted-foreground">
                    {partners.total} Partner insgesamt
                    {partners.from && partners.to && ` (${partners.from}–${partners.to})`}
                </div>
            </div>
        </AppLayout>
    );
}

function buildQuery(filters: Record<string, string | undefined>, page: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
    }
    if (page > 1) params.set('page', String(page));
    return params.toString();
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: unknown[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    }) as T;
}
