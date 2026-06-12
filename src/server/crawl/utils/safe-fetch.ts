const USER_AGENT = "NARA-Dictionary-Crawler/1.0";

// Retourne null sur toute erreur (réseau, HTTP non-2xx, JSON invalide) :
// un mot raté ne doit jamais stopper le job de crawl.
export async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}
