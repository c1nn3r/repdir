export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const masked = name.length > 2
    ? name[0] + '***' + name[name.length - 1]
    : name[0] + '***';
  return `${masked}@${domain}`;
}

export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) stars += '★';
    else if (i === full && half) stars += '½';
    else stars += '☆';
  }
  return stars;
}
