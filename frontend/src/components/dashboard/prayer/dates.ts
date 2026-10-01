export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** Noon UTC keeps an ISO date on the same calendar day in Europe/London. */
export const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
