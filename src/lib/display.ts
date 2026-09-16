export function stripBracketTags(title: string): string {
  return title
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pastelColorForUploader(uploader: string): string {
  let hash = 0;
  for (let i = 0; i < uploader.length; i++) {
    hash = uploader.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 85%)`;
}
