import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ChangeDiff } from '@/components/change-diff';
import { EventTypeBadge } from '@/components/status-badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, ChangeLogEntry, PaginatedData } from '@/types';

interface Props {
    changes: PaginatedData<ChangeLogEntry>;
    eventTypes: string[];
    filters: {
        event?: string;
        since?: string;
        partner?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Changes', href: '/changes' },
];

export default function ChangesIndex({ changes, eventTypes, filters }: Props) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (id: number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const applyFilters = useCallback(
        (newFilters: Record<string, string | undefined>) => {
            const merged = { ...filters, ...newFilters };
            const cleaned: Record<string, string> = {};

            for (const [k, v] of Object.entries(merged)) {
                if (v && v !== 'all') {
                    cleaned[k] = v;
                }
            }

            router.get('/changes', cleaned, {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [filters],
    );

    const handleExport = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/export/changes';
        const csrf =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';
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
            <Head title="Changes" />
            <div className="flex flex-col gap-4 p-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={filters.event ?? 'all'}
                        onValueChange={(v) =>
                            applyFilters({ event: v === 'all' ? undefined : v })
                        }
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Event-Typ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Events</SelectItem>
                            {eventTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={filters.since ?? ''}
                        onChange={(e) =>
                            applyFilters({ since: e.target.value || undefined })
                        }
                        className="w-44"
                    />
                    <Input
                        placeholder="Partner suchen..."
                        value={filters.partner ?? ''}
                        onChange={(e) =>
                            applyFilters({
                                partner: e.target.value || undefined,
                            })
                        }
                        className="w-64"
                    />
                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                        >
                            <Download className="mr-1 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8" />
                                <TableHead>Datum</TableHead>
                                <TableHead>Partner</TableHead>
                                <TableHead>Event</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {changes.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        Keine Änderungen gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                            {changes.data.map((change) => (
                                <>
                                    <TableRow
                                        key={change.id}
                                        className={
                                            change.changes
                                                ? 'cursor-pointer'
                                                : ''
                                        }
                                        onClick={() =>
                                            change.changes &&
                                            toggleRow(change.id)
                                        }
                                    >
                                        <TableCell>
                                            {change.changes &&
                                                (expandedRows.has(change.id) ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                ))}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(
                                                change.detected_at,
                                            ).toLocaleString('de-DE')}
                                        </TableCell>
                                        <TableCell>
                                            {change.partner ? (
                                                <Link
                                                    href={`/partners/${change.partner.id}`}
                                                    className="hover:underline"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {change.partner.name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <EventTypeBadge
                                                event={change.event}
                                            />
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(change.id) &&
                                        change.changes && (
                                            <TableRow key={`${change.id}-diff`}>
                                                <TableCell />
                                                <TableCell
                                                    colSpan={3}
                                                    className="bg-muted/50"
                                                >
                                                    <ChangeDiff
                                                        changes={change.changes}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {changes.last_page > 1 && (
                    <Pagination>
                        <PaginationContent>
                            {changes.current_page > 1 && (
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={`/changes?${buildQuery(filters, changes.current_page - 1)}`}
                                    />
                                </PaginationItem>
                            )}
                            {Array.from(
                                { length: changes.last_page },
                                (_, i) => i + 1,
                            )
                                .filter((page) => {
                                    return (
                                        page === 1 ||
                                        page === changes.last_page ||
                                        Math.abs(page - changes.current_page) <=
                                            2
                                    );
                                })
                                .map((page, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    const items = [];

                                    if (prev && page - prev > 1) {
                                        items.push(
                                            <PaginationItem
                                                key={`ellipsis-${page}`}
                                            >
                                                <span className="px-2 text-muted-foreground">
                                                    ...
                                                </span>
                                            </PaginationItem>,
                                        );
                                    }

                                    items.push(
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={`/changes?${buildQuery(filters, page)}`}
                                                isActive={
                                                    page ===
                                                    changes.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>,
                                    );

                                    return items;
                                })}
                            {changes.current_page < changes.last_page && (
                                <PaginationItem>
                                    <PaginationNext
                                        href={`/changes?${buildQuery(filters, changes.current_page + 1)}`}
                                    />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                )}

                <div className="text-sm text-muted-foreground">
                    {changes.total} Änderungen insgesamt
                </div>
            </div>
        </AppLayout>
    );
}

function buildQuery(
    filters: Record<string, string | undefined>,
    page: number,
): string {
    const params = new URLSearchParams();

    for (const [k, v] of Object.entries(filters)) {
        if (v) {
            params.set(k, v);
        }
    }

    if (page > 1) {
        params.set('page', String(page));
    }

    return params.toString();
}
