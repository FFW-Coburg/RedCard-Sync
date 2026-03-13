import { Head, Link, router, usePage } from '@inertiajs/react';
import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CommandStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, CommandRun } from '@/types';

interface CommandDef {
    label: string;
    description: string;
    parameters: {
        name: string;
        label: string;
        type: 'boolean' | 'select' | 'number';
        default?: unknown;
        options?: Record<string, string>;
    }[];
}

interface Props {
    runs: CommandRun[];
    availableCommands: Record<string, CommandDef>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Commands', href: '/commands' },
];

export default function CommandsIndex({ runs, availableCommands }: Props) {
    const [selectedCommand, setSelectedCommand] = useState('');
    const [params, setParams] = useState<Record<string, unknown>>({});
    const [submitting, setSubmitting] = useState(false);
    const { props } = usePage();
    const flash = (props as Record<string, unknown>).flash as Record<string, string> | undefined;

    const commandDef = selectedCommand ? availableCommands[selectedCommand] : null;

    // Initialize params when command changes
    useEffect(() => {
        if (commandDef) {
            const defaults: Record<string, unknown> = {};
            for (const p of commandDef.parameters) {
                defaults[p.name] = p.default ?? (p.type === 'boolean' ? false : '');
            }
            setParams(defaults);
        }
    }, [selectedCommand]);

    // Auto-refresh when there are pending/running jobs
    useEffect(() => {
        const hasActive = runs.some((r) => r.status === 'pending' || r.status === 'running');
        if (!hasActive) return;

        const interval = setInterval(() => {
            router.reload({ only: ['runs'] });
        }, 3000);

        return () => clearInterval(interval);
    }, [runs]);

    const handleRun = () => {
        if (!selectedCommand) return;
        setSubmitting(true);
        router.post(
            '/commands/run',
            { command: selectedCommand, parameters: params },
            {
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Commands" />
            <div className="flex flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                {/* Command Runner */}
                <Card>
                    <CardHeader>
                        <CardTitle>Command ausführen</CardTitle>
                        <CardDescription>Wähle einen Command und konfiguriere die Parameter.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Command</Label>
                                <Select value={selectedCommand} onValueChange={setSelectedCommand}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Command wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(availableCommands).map(([key, cmd]) => (
                                            <SelectItem key={key} value={key}>
                                                {cmd.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {commandDef && (
                                    <p className="text-sm text-muted-foreground">{commandDef.description}</p>
                                )}
                            </div>

                            {commandDef && (
                                <div className="space-y-3">
                                    <Label>Parameter</Label>
                                    {commandDef.parameters.map((param) => (
                                        <div key={param.name}>
                                            {param.type === 'boolean' && (
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={param.name}
                                                        checked={!!params[param.name]}
                                                        onCheckedChange={(checked) =>
                                                            setParams((p) => ({ ...p, [param.name]: !!checked }))
                                                        }
                                                    />
                                                    <Label htmlFor={param.name}>{param.label}</Label>
                                                </div>
                                            )}
                                            {param.type === 'number' && (
                                                <div className="space-y-1">
                                                    <Label htmlFor={param.name}>{param.label}</Label>
                                                    <Input
                                                        id={param.name}
                                                        type="number"
                                                        value={String(params[param.name] ?? '')}
                                                        onChange={(e) =>
                                                            setParams((p) => ({ ...p, [param.name]: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                            )}
                                            {param.type === 'select' && param.options && (
                                                <div className="space-y-1">
                                                    <Label htmlFor={param.name}>{param.label}</Label>
                                                    <Select
                                                        value={String(params[param.name] ?? '')}
                                                        onValueChange={(v) =>
                                                            setParams((p) => ({ ...p, [param.name]: v === '_none' ? '' : v }))
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Alle" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="_none">Alle</SelectItem>
                                                            {Object.entries(param.options).map(([slug, name]) => (
                                                                <SelectItem key={slug} value={slug}>
                                                                    {name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button onClick={handleRun} disabled={!selectedCommand || submitting}>
                            <Play className="mr-1 h-4 w-4" />
                            {submitting ? 'Wird gestartet...' : 'Ausführen'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Runs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Letzte Runs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Command</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Gestartet</TableHead>
                                    <TableHead>Fertig</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            Noch keine Commands ausgeführt.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {runs.map((run) => (
                                    <TableRow key={run.id}>
                                        <TableCell className="font-mono text-sm">{run.command}</TableCell>
                                        <TableCell>
                                            <CommandStatusBadge status={run.status} />
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {run.started_at
                                                ? new Date(run.started_at).toLocaleString('de-DE')
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {run.completed_at
                                                ? new Date(run.completed_at).toLocaleString('de-DE')
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/commands/runs/${run.id}`}
                                                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                Details
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
