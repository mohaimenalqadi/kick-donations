const CURRENCY_LABEL: Record<string, string> = { LYD: 'د.ل', USD: '$', EUR: '€' };

export function currencyLabel(code = 'LYD') {
    return CURRENCY_LABEL[code] || code;
}

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
export function formatAmount(value: number | string, currency = 'LYD') {
    return `${numberFmt.format(Number(value) || 0)} ${currencyLabel(currency)}`;
}

const dateTimeFmt = new Intl.DateTimeFormat('ar-LY', {
    timeZone: 'Africa/Tripoli',
    dateStyle: 'medium',
    timeStyle: 'short',
});
export function formatDateTime(iso: string | null | undefined) {
    return iso ? dateTimeFmt.format(new Date(iso)) : '—';
}

const relFmt = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
export function formatRelative(iso: string) {
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return relFmt.format(Math.round(diff), 'second');
    if (abs < 3600) return relFmt.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return relFmt.format(Math.round(diff / 3600), 'hour');
    return formatDateTime(iso);
}

/** Splits "KickPay" into ["Kick", "Pay"] so the last word can be accented. */
export function splitBrand(title: string): [string, string] {
    const parts = title.split(/(?=[A-Z])/);
    if (parts.length < 2) return ['', title];
    return [parts.slice(0, -1).join(''), parts[parts.length - 1]];
}
