export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function timeAgo(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 60) {
    return `${Math.floor(secondsPast)} seconds ago`;
  }
  if (secondsPast < 3600) {
    const minutes = Math.floor(secondsPast / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (secondsPast < 86400) {
    const hours = Math.floor(secondsPast / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(secondsPast / 86400);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
