export function formatHijriDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getHijriDateString(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
