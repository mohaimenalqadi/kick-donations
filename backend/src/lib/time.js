'use strict';

/**
 * Timezone helpers. The server runs in UTC (Render) but "today" must mean
 * today for the streamer (Africa/Tripoli by default).
 */

/** Offset of `timeZone` from UTC at `date`, in minutes. */
function tzOffsetMinutes(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date);
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return Math.round((asUtc - date.getTime()) / 60000);
}

/** The instant at which the current local day started in `timeZone`. */
function startOfDay(timeZone, now = new Date()) {
    const offset = tzOffsetMinutes(now, timeZone);
    const local = new Date(now.getTime() + offset * 60000);
    local.setUTCHours(0, 0, 0, 0);
    return new Date(local.getTime() - offset * 60000);
}

module.exports = { tzOffsetMinutes, startOfDay };
