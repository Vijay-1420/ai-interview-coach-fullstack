const parseDate = (value: string): Date | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value: string): string => {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : value;
};

export const formatChartDate = (value: string): string => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : value;
};

export const formatDateTime = (value: string): string => {
  const date = parseDate(value);
  return date
    ? date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : value;
};
