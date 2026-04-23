export function formatDate(date: string | Date) {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}
