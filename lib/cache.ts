export function sharedCacheHeaders(revalidateSeconds: number) {
  return {
    "Cache-Control": `public, max-age=${revalidateSeconds}, s-maxage=${revalidateSeconds}, stale-while-revalidate=${revalidateSeconds}`,
  };
}
