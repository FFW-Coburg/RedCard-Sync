interface ChangeDiffProps {
    changes: Record<string, unknown> | null;
}

export function ChangeDiff({ changes }: ChangeDiffProps) {
    if (!changes) return null;

    const oldValues = (changes.old ?? {}) as Record<string, unknown>;
    const newValues = (changes.new ?? {}) as Record<string, unknown>;

    const allKeys = [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])];

    if (allKeys.length === 0) return null;

    return (
        <div className="space-y-1 text-sm">
            {allKeys.map((key) => {
                const oldVal = oldValues[key];
                const newVal = newValues[key];
                if (oldVal === newVal) return null;

                return (
                    <div key={key} className="flex gap-2">
                        <span className="font-medium text-muted-foreground min-w-[140px]">
                            {key.replace(/_/g, ' ')}:
                        </span>
                        <div className="flex flex-col gap-0.5">
                            {oldVal != null && (
                                <span className="text-red-600 dark:text-red-400 line-through">
                                    {truncate(String(oldVal))}
                                </span>
                            )}
                            {newVal != null && (
                                <span className="text-green-600 dark:text-green-400">
                                    {truncate(String(newVal))}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function truncate(str: string, max = 120) {
    return str.length > max ? str.slice(0, max) + '…' : str;
}
