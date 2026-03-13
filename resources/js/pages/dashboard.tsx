import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BarChart3, FolderOpen, History, Users } from 'lucide-react';
import { EventTypeBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, ChangeLogEntry } from '@/types';

interface Props {
    stats: {
        total_partners: number;
        active_partners: number;
        inactive_partners: number;
        with_details: number;
        without_details: number;
        categories: number;
        changes: number;
    };
    categories: (Category & {
        partners_count: number;
        partners_active_count: number;
        partners_with_details_count: number;
        partners_without_details_count: number;
        partners_synced_count: number;
    })[];
    recentChanges: ChangeLogEntry[];
    lastSync: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

export default function Dashboard({ stats, categories, recentChanges, lastSync }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        title="Aktive Partner"
                        value={stats.active_partners}
                        subtitle={`${stats.inactive_partners} inaktiv`}
                        icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    />
                    <StatCard
                        title="Mit Details"
                        value={stats.with_details}
                        subtitle={`${stats.without_details} fehlen`}
                        icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
                    />
                    <StatCard
                        title="Kategorien"
                        value={stats.categories}
                        icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
                    />
                    <StatCard
                        title="Änderungen"
                        value={stats.changes}
                        subtitle={lastSync ? `Letzter Sync: ${new Date(lastSync).toLocaleDateString('de-DE')}` : undefined}
                        icon={<History className="h-4 w-4 text-muted-foreground" />}
                    />
                </div>

                {/* Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kategorien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kategorie</TableHead>
                                    <TableHead className="text-right">Gesamt</TableHead>
                                    <TableHead className="text-right">Aktiv</TableHead>
                                    <TableHead className="text-right">Mit Details</TableHead>
                                    <TableHead className="text-right">Ohne Details</TableHead>
                                    <TableHead className="text-right">BOS-ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell>
                                            <Link
                                                href={`/partners?category=${cat.slug}`}
                                                className="hover:underline"
                                            >
                                                {cat.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right">{cat.partners_count}</TableCell>
                                        <TableCell className="text-right">{cat.partners_active_count}</TableCell>
                                        <TableCell className="text-right">{cat.partners_with_details_count}</TableCell>
                                        <TableCell className="text-right">
                                            {cat.partners_without_details_count > 0 ? (
                                                <span className="text-orange-600 dark:text-orange-400">{cat.partners_without_details_count}</span>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">{cat.partners_synced_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Recent Changes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Letzte Änderungen</CardTitle>
                        <Link
                            href="/changes"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Alle anzeigen <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentChanges.length === 0 && (
                                <p className="text-sm text-muted-foreground">Keine Änderungen vorhanden.</p>
                            )}
                            {recentChanges.map((change) => (
                                <div key={change.id} className="flex items-center justify-between gap-2 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <EventTypeBadge event={change.event} />
                                        {change.partner ? (
                                            <Link
                                                href={`/partners/${change.partner.id}`}
                                                className="truncate hover:underline"
                                            >
                                                {change.partner.name}
                                            </Link>
                                        ) : (
                                            <span className="truncate text-muted-foreground">Unbekannt</span>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground whitespace-nowrap">
                                        {new Date(change.detected_at).toLocaleDateString('de-DE')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Link
                            href="/commands"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Commands ausführen
                        </Link>
                        <Link
                            href="/partners"
                            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                        >
                            Partner verwalten
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, subtitle, icon }: { title: string; value: number; subtitle?: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}
