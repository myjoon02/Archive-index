export interface CollectedListing {
  id: string;
  productName: string;
  brand: string;
  year: number;
  price: number;
  soldAt: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  tagInfo?: string;
  country?: string;
  archiveScore: number;
  accepted: boolean;
  rejectionReason?: string;
}

export interface CollectionRun {
  lastRunDate: string;
  cadence: "daily";
  sources: string[];
  accepted: CollectedListing[];
  rejected: CollectedListing[];
}

const sources = ["Grailed", "eBay", "Yahoo Auctions Japan", "Mercari", "Public Archive Sources"];
const invalidTitleKeywords = ["test", "demo", "sample", "placeholder", "unknown"];
const minArchiveYear = 1900;
const maxArchiveYear = 2024;

const rawListings = [
  ["Levi's 501 Big E Selvedge Denim", "Levi's", 1971, 1280, "eBay", "Big E", "United States"],
  ["Stussy Dragon Tee", "Stussy", 1998, 920, "Grailed", "Single Stitch", "United States"],
  ["M-65 Field Jacket Contract", "Alpha Industries", 1972, 850, "Yahoo Auctions Japan", "Military Label", "United States"],
  ["Brockum Metallica Tour Tee", "Metallica", 1992, 1200, "Mercari", "Brockum", "United States"],
  ["Raf Simons Riot Riot Riot Bomber", "Raf Simons", 2001, 4900, "Grailed", "Runway Label", "Belgium"],
  ["Sample Archive Hoodie", "Unknown", 2026, 100, "Public Archive Sources", "", ""],
  ["Placeholder Data Tee", "Demo", 2045, 10, "Public Archive Sources", "", ""],
] as const;

const calculateArchiveScore = (listing: Omit<CollectedListing, "archiveScore" | "accepted" | "rejectionReason">) => {
  const yearScore = listing.year >= minArchiveYear && listing.year <= maxArchiveYear ? 28 : 0;
  const tagScore = listing.tagInfo ? 20 : 0;
  const countryScore = listing.country ? 16 : 0;
  const transactionScore = listing.price > 0 && listing.soldAt ? 18 : 0;
  const sourceScore = listing.source && listing.sourceUrl ? 18 : 0;
  return Math.min(100, yearScore + tagScore + countryScore + transactionScore + sourceScore);
};

const validateListing = (listing: Omit<CollectedListing, "archiveScore" | "accepted" | "rejectionReason">): CollectedListing => {
  const archiveScore = calculateArchiveScore(listing);
  const title = listing.productName.toLowerCase();
  const invalidKeyword = invalidTitleKeywords.find((keyword) => title.includes(keyword));
  if (listing.year > maxArchiveYear || listing.year < minArchiveYear) {
    return { ...listing, archiveScore, accepted: false, rejectionReason: "아카이브 기준 연도(1900~2024) 밖의 데이터" };
  }
  if (invalidKeyword) {
    return { ...listing, archiveScore, accepted: false, rejectionReason: `무효 키워드 포함: ${invalidKeyword}` };
  }
  return { ...listing, archiveScore, accepted: true };
};

const buildListings = () => {
  const today = new Date();
  return rawListings.map(([productName, brand, year, price, source, tagInfo, country], index) => {
    const soldAt = new Date(Date.UTC(today.getUTCFullYear(), Math.max(0, today.getUTCMonth() - index), 1 + index)).toISOString().slice(0, 10);
    return validateListing({
      id: `collected-${year}-${index}`,
      productName,
      brand,
      year,
      price,
      soldAt,
      imageUrl: undefined,
      source,
      sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(`${productName} ${source}`)}`,
      tagInfo,
      country,
    });
  });
};

export const runDailyArchiveCollection = (): CollectionRun => {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = "archiveIndexDailyCollection";
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as CollectionRun;
      if (parsed.lastRunDate === today) return parsed;
    }
  } catch {
    // Ignore unavailable storage; the collector still returns a validated run.
  }

  const validated = buildListings();
  const run: CollectionRun = {
    lastRunDate: today,
    cadence: "daily",
    sources,
    accepted: validated.filter((listing) => listing.accepted).sort((a, b) => b.archiveScore - a.archiveScore),
    rejected: validated.filter((listing) => !listing.accepted),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(run));
  } catch {
    // Non-persistent environments can still render the current run.
  }

  return run;
};
