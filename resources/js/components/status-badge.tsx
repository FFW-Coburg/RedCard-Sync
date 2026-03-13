import { Badge } from '@/components/ui/badge';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

const partnerStatusMap: Record<string, { label: string; variant: Variant }> = {
    active: { label: 'Aktiv', variant: 'default' },
    inactive: { label: 'Inaktiv', variant: 'destructive' },
};

const commandStatusMap: Record<string, { label: string; variant: Variant; className?: string }> = {
    pending: { label: 'Wartend', variant: 'outline', className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400' },
    running: { label: 'Läuft', variant: 'outline', className: 'border-blue-500 text-blue-700 dark:text-blue-400' },
    completed: { label: 'Fertig', variant: 'default' },
    failed: { label: 'Fehler', variant: 'destructive' },
};

const eventTypeMap: Record<string, { label: string; variant: Variant }> = {
    created: { label: 'Erstellt', variant: 'default' },
    updated: { label: 'Aktualisiert', variant: 'secondary' },
    detail_updated: { label: 'Details', variant: 'secondary' },
    deactivated: { label: 'Deaktiviert', variant: 'destructive' },
    reactivated: { label: 'Reaktiviert', variant: 'outline' },
};

export function PartnerStatusBadge({ isActive }: { isActive: boolean }) {
    const config = partnerStatusMap[isActive ? 'active' : 'inactive'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function DetailsBadge({ fetched }: { fetched: boolean }) {
    return (
        <Badge variant={fetched ? 'secondary' : 'outline'}>
            {fetched ? 'Vorhanden' : 'Fehlt'}
        </Badge>
    );
}

export function CommandStatusBadge({ status }: { status: string }) {
    const config = commandStatusMap[status] ?? { label: status, variant: 'outline' as Variant };
    return (
        <Badge variant={config.variant} className={config.className}>
            {status === 'running' && (
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            )}
            {config.label}
        </Badge>
    );
}

export function EventTypeBadge({ event }: { event: string }) {
    const config = eventTypeMap[event] ?? { label: event, variant: 'outline' as Variant };
    return <Badge variant={config.variant}>{config.label}</Badge>;
}
