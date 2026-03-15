export const SYSTEM_TIME_ZONE = 'Asia/Manila';

function createFormatter(
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(undefined, {
        ...options,
        timeZone: SYSTEM_TIME_ZONE,
    });
}

export function formatSystemDateRange(
    dateFrom: string,
    dateTo: string,
): string {
    const formatter = createFormatter({
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return `${formatter.format(new Date(dateFrom))} - ${formatter.format(new Date(dateTo))}`;
}

export function formatSystemDateOnly(value: string): string {
    return createFormatter({
        dateStyle: 'medium',
    }).format(new Date(value));
}

export function formatSystemDateTime(value: string): string {
    return createFormatter({
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
