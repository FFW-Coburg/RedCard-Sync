import { Head, router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { CommandStatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, CommandRun } from '@/types';

interface Props {
    commandRun: CommandRun;
}

export default function CommandShow({ commandRun }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Commands', href: '/commands' },
        {
            title: `Run #${commandRun.id}`,
            href: `/commands/runs/${commandRun.id}`,
        },
    ];

    // Auto-refresh while running
    useEffect(() => {
        if (
            commandRun.status !== 'pending' &&
            commandRun.status !== 'running'
        ) {
            return;
        }

        const interval = setInterval(() => {
            router.reload();
        }, 3000);

        return () => clearInterval(interval);
    }, [commandRun.status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Command Run #${commandRun.id}`} />
            <div className="flex flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <Link
                        href="/commands"
                        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-3 w-3" /> Zurück
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="font-mono text-2xl font-bold">
                            {commandRun.command}
                        </h1>
                        <CommandStatusBadge status={commandRun.status} />
                    </div>
                    <div className="mt-1 space-x-4 text-sm text-muted-foreground">
                        {commandRun.started_at && (
                            <span>
                                Gestartet:{' '}
                                {new Date(commandRun.started_at).toLocaleString(
                                    'de-DE',
                                )}
                            </span>
                        )}
                        {commandRun.completed_at && (
                            <span>
                                Fertig:{' '}
                                {new Date(
                                    commandRun.completed_at,
                                ).toLocaleString('de-DE')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Parameters */}
                {commandRun.parameters &&
                    Object.keys(commandRun.parameters).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Parameter</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableBody>
                                        {Object.entries(
                                            commandRun.parameters,
                                        ).map(([key, value]) => (
                                            <TableRow key={key}>
                                                <TableCell className="font-mono text-sm font-medium">
                                                    {key}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {String(value)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                {/* Output */}
                <Card>
                    <CardHeader>
                        <CardTitle>Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {commandRun.output ? (
                            <ScrollArea className="h-[400px] rounded-md border bg-muted/50 p-4">
                                <pre className="font-mono text-sm whitespace-pre-wrap">
                                    {commandRun.output}
                                </pre>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {commandRun.status === 'pending' ||
                                commandRun.status === 'running'
                                    ? 'Warte auf Output...'
                                    : 'Kein Output vorhanden.'}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Result Stats */}
                {commandRun.result &&
                    Object.keys(commandRun.result).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Ergebnis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableBody>
                                        {Object.entries(commandRun.result).map(
                                            ([key, value]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium">
                                                        {key}
                                                    </TableCell>
                                                    <TableCell>
                                                        {String(value)}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </AppLayout>
    );
}
