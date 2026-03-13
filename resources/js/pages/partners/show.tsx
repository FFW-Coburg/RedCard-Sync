import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { ChangeDiff } from '@/components/change-diff';
import { DetailsBadge, EventTypeBadge, PartnerStatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, ChangeLogEntry, Partner } from '@/types';

interface Props {
    partner: Partner;
    changeLogs: ChangeLogEntry[];
}

export default function PartnerShow({ partner, changeLogs }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Partners', href: '/partners' },
        { title: partner.name, href: `/partners/${partner.id}` },
    ];

    const handleRefetch = () => {
        router.post(`/partners/${partner.id}/refetch`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={partner.name} />
            <div className="flex flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link
                            href="/partners"
                            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-3 w-3" /> Zurück
                        </Link>
                        <h1 className="text-2xl font-bold">{partner.name}</h1>
                        <div className="mt-1 flex items-center gap-2">
                            <PartnerStatusBadge isActive={partner.is_active} />
                            <DetailsBadge fetched={partner.details_fetched} />
                            <span className="text-sm text-muted-foreground">ID: {partner.external_id}</span>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleRefetch}>
                        <RefreshCw className="mr-1 h-4 w-4" /> Details neu laden
                    </Button>
                </div>

                {/* Content */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Contact Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kontaktdaten</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <InfoRow label="Ort" value={`${partner.postal_code} ${partner.city}`} />
                            <InfoRow label="Straße" value={partner.street_address} />
                            <InfoRow label="Ansprechpartner" value={partner.contact_person} />
                            <InfoRow label="Telefon" value={partner.phone} />
                            <InfoRow label="Fax" value={partner.fax} />
                            <InfoRow label="Mobil" value={partner.mobile} />
                            <InfoRow label="E-Mail" value={partner.email} isEmail />
                            {partner.website && (
                                <div className="flex gap-2">
                                    <span className="font-medium text-muted-foreground min-w-[120px]">Website:</span>
                                    <a
                                        href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        {partner.website} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Categories + Discount */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Kategorien</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {partner.categories?.map((cat) => (
                                        <Badge key={cat.id} variant="secondary">
                                            {cat.name}
                                        </Badge>
                                    ))}
                                    {(!partner.categories || partner.categories.length === 0) && (
                                        <span className="text-sm text-muted-foreground">Keine Kategorien</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {partner.discount_description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rabatt</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{partner.discount_description}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Body Text */}
                {partner.body_text && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Beschreibung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                                {partner.body_text}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Change History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Änderungsverlauf</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {changeLogs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Keine Änderungen protokolliert.</p>
                        ) : (
                            <div className="space-y-4">
                                {changeLogs.map((log) => (
                                    <div key={log.id} className="border-l-2 border-muted pl-4 pb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <EventTypeBadge event={log.event} />
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(log.detected_at).toLocaleString('de-DE')}
                                            </span>
                                        </div>
                                        <ChangeDiff changes={log.changes} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function InfoRow({ label, value, isEmail }: { label: string; value: string | null; isEmail?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex gap-2">
            <span className="font-medium text-muted-foreground min-w-[120px]">{label}:</span>
            {isEmail ? (
                <a href={`mailto:${value}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    {value}
                </a>
            ) : (
                <span>{value}</span>
            )}
        </div>
    );
}
