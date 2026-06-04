export type CategoryId = "military" | "workwear" | "band-tee" | "streetwear" | "designer-archive";

export type Marketplace =
  | "eBay"
  | "Grailed"
  | "Mercari"
  | "Yahoo Auctions"
  | "Depop"
  | "Vestiaire Collective"
  | "Buyee"
  | "Rakuten Rakuma";

export type SubmissionStatus = "Pending Review" | "Approved" | "Rejected" | "Flagged";

export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  description: string;
  historicalSignificance: string;
  culturalInfluence: string;
  heroStat: string;
  timelineFocus: string;
  marketNarrative: string;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  categoryId: CategoryId;
  foundingYear: number;
  country: string;
  history: string;
  keyMoments: string[];
  tagEvolution: string[];
  manufacturingCountries: string[];
  authenticationGuide: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  categoryId: CategoryId;
  releaseYear: number;
  country: string;
  description: string;
  historicalSignificance: string;
  culturalImpact: string;
  productionDetails: string;
  marketPrice: number;
  priceChangePercent: number;
  rarityScore: number;
  popularity: number;
  size: string;
  condition: string;
  tagId: string;
  referenceNumber: string;
  knownVariants: string[];
  marketplaceLinks: Record<Marketplace, string>;
}

export interface TagRecord {
  id: string;
  brandId: string;
  productId: string;
  categoryId: CategoryId;
  label: string;
  yearStart: number;
  yearEnd: number;
  country: string;
  factoryInformation: string;
  stitchType: "Single stitch" | "Double stitch" | "Chain stitch" | "Overlock";
  knownVariants: string[];
  authenticationNotes: string;
  commonFakes: string;
  productionDifferences: string;
}

export interface MarketTransaction {
  id: string;
  productId: string;
  marketplace: Marketplace;
  date: string;
  price: number;
  condition: string;
  sourceUrl: string;
}

export interface TimelineEvent {
  id: string;
  categoryId: CategoryId;
  brandId?: string;
  productId?: string;
  year: number;
  title: string;
  description: string;
  marketImpact: string;
  type: string;
}

export interface CommunitySubmission {
  id: string;
  productId: string;
  contributor: string;
  badge: string;
  profileUrl: string;
  contributionDate: string;
  status: SubmissionStatus;
  photos: string[];
  year: number;
  country: string;
  tagType: string;
  authenticationNotes: string;
  rightsAgreementAt: string;
}

export interface RareItemRequest {
  id: string;
  title: string;
  categoryId: CategoryId;
  brand: string;
  rewardPoints: number;
  requestedBy: string;
  notes: string;
}

export interface MarketSummary {
  median: number;
  average: number;
  highest: number;
  lowest: number;
  salesVolume: number;
  transactionCount: number;
  volatility: number;
  liquidity: string;
  spread: number;
}

export interface ChartPoint {
  date: string;
  price: number;
  volume: number;
}

export const categories: Category[] = [
  {
    id: "military",
    name: "Military",
    slug: "military",
    description: "Government-issue garments, flight jackets, field coats, liners, fatigues, and surplus design references.",
    historicalSignificance: "Military garments preserve contract history, fabric innovation, wartime manufacturing, and civilian adoption patterns.",
    culturalInfluence: "From MA-1 jackets to M-65 field coats, military design became the grammar of utility dressing, punk uniforms, and Japanese repro culture.",
    heroStat: "300+ reference garments",
    timelineFocus: "Wars, contracts, government suppliers, specification changes, and civilian adoption.",
    marketNarrative: "Demand clusters around verified contract labels, rare sizes, early nylon, intact liners, and pieces tied to specific conflicts.",
  },
  {
    id: "workwear",
    name: "Workwear",
    slug: "workwear",
    description: "Denim, canvas, chore coats, duck jackets, painter pants, overalls, railroad gear, and industrial uniforms.",
    historicalSignificance: "Workwear charts labor history through fabric weights, union production, factory labels, rivets, pocket forms, and repair culture.",
    culturalInfluence: "Blue collar uniforms crossed into skateboarding, hip-hop, Japanese Americana, and contemporary luxury collections.",
    heroStat: "300+ catalogued staples",
    timelineFocus: "Factory history, production changes, ownership changes, union tags, and fit evolutions.",
    marketNarrative: "Condition, patina, blanket lining, discontinued colors, and USA manufacturing drive price premiums.",
  },
  {
    id: "band-tee",
    name: "Band Tee",
    slug: "band-tee",
    description: "Tour merchandise, album promotion tees, bootlegs, parking-lot prints, fan club releases, and music culture artifacts.",
    historicalSignificance: "Band tees connect music history to graphic production, tour economics, subcultural identity, and copyright-era merchandising.",
    culturalInfluence: "A worn tour shirt can document a scene, a venue, a graphics language, and the afterlife of an album cycle.",
    heroStat: "300+ tour artifacts",
    timelineFocus: "Band formation, album releases, tours, cultural milestones, merchandise periods, and price impact events.",
    marketNarrative: "Prices respond to artist anniversaries, documentaries, celebrity wear, original tag verification, and print condition.",
  },
  {
    id: "streetwear",
    name: "Streetwear",
    slug: "streetwear",
    description: "Skate, hip-hop, Harajuku, graffiti, early web drops, boutique exclusives, and collaboration-era garments.",
    historicalSignificance: "Streetwear archives reveal how communities built scarcity, logo language, and resale culture before mainstream luxury adoption.",
    culturalInfluence: "Small-run tees and jackets became social signals across skate shops, record stores, forums, and early resale boards.",
    heroStat: "300+ drop-era references",
    timelineFocus: "Shop openings, collaborations, cultural moments, brand pivots, and distribution changes.",
    marketNarrative: "Market strength is highest for first-generation tags, Japan-only releases, artist graphics, and intact provenance.",
  },
  {
    id: "designer-archive",
    name: "Designer Archive",
    slug: "designer-archive",
    description: "Runway-era pieces, conceptual garments, early line tags, collection references, and influential silhouettes.",
    historicalSignificance: "Designer archive garments document construction philosophy, runway narratives, creative directors, and material experimentation.",
    culturalInfluence: "The category connects museums, stylists, collectors, and contemporary designers through primary garment evidence.",
    heroStat: "300+ runway references",
    timelineFocus: "Runway seasons, creative directors, collaborations, atelier shifts, and critical reception.",
    marketNarrative: "Liquidity concentrates in documented runway pieces, rare sizes, early labels, and garments with editorial provenance.",
  },
];

const categoryBrands: Record<CategoryId, Array<[string, number, string]>> = {
  military: [["Alpha Industries", 1959, "United States"], ["Avirex", 1975, "United States"], ["Buzz Rickson's", 1993, "Japan"], ["Rothco", 1953, "United States"], ["Spiewak", 1904, "United States"], ["Schott NYC", 1913, "United States"], ["The Real McCoy's", 1987, "Japan"], ["MASH Co.", 1983, "Japan"], ["Eastman Leather", 1984, "United Kingdom"], ["Golden Fleece", 1933, "United States"], ["Southern Athletic", 1946, "United States"]],
  workwear: [["Levi's", 1853, "United States"], ["Carhartt", 1889, "United States"], ["Lee", 1889, "United States"], ["Wrangler", 1947, "United States"], ["Dickies", 1922, "United States"], ["Red Kap", 1923, "United States"], ["Big Mac", 1922, "United States"], ["OshKosh B'gosh", 1895, "United States"], ["Ben Davis", 1935, "United States"], ["Pointer Brand", 1913, "United States"], ["Sears Roebuck", 1892, "United States"], ["Pay Day", 1922, "United States"]],
  "band-tee": [["Nirvana", 1987, "United States"], ["Metallica", 1981, "United States"], ["The Rolling Stones", 1962, "United Kingdom"], ["Sonic Youth", 1981, "United States"], ["Grateful Dead", 1965, "United States"], ["Pink Floyd", 1965, "United Kingdom"], ["Beastie Boys", 1981, "United States"], ["Pearl Jam", 1990, "United States"], ["Radiohead", 1985, "United Kingdom"], ["Tupac Shakur", 1991, "United States"], ["Smashing Pumpkins", 1988, "United States"]],
  streetwear: [["Stussy", 1980, "United States"], ["Supreme", 1994, "United States"], ["A Bathing Ape", 1993, "Japan"], ["Futura Laboratories", 1997, "United States"], ["X-Large", 1991, "United States"], ["Goodenough", 1990, "Japan"], ["Neighborhood", 1994, "Japan"], ["Undercover", 1990, "Japan"], ["Hysteric Glamour", 1984, "Japan"], ["Number (N)ine", 1997, "Japan"], ["Fragment Design", 2003, "Japan"]],
  "designer-archive": [["Maison Margiela", 1988, "France"], ["Raf Simons", 1995, "Belgium"], ["Helmut Lang", 1986, "Austria"], ["Comme des Garcons", 1969, "Japan"], ["Issey Miyake", 1970, "Japan"], ["Yohji Yamamoto", 1972, "Japan"], ["Jean Paul Gaultier", 1982, "France"], ["Vivienne Westwood", 1971, "United Kingdom"], ["Prada", 1913, "Italy"], ["Dries Van Noten", 1986, "Belgium"], ["Rick Owens", 1994, "United States"], ["Ann Demeulemeester", 1985, "Belgium"]],
};

const productNouns: Record<CategoryId, string[]> = {
  military: ["MA-1 Flight Jacket", "M-65 Field Coat", "N-3B Parka", "A-2 Deck Jacket", "Jungle Fatigue", "CPO Shirt"],
  workwear: ["Detroit Jacket", "501 Denim", "Chore Coat", "Painter Pant", "Railroad Overall", "Blanket Lined Coat"],
  "band-tee": ["Tour Tee", "Album Promo Tee", "Parking Lot Tee", "Fan Club Tee", "Long Sleeve Tee", "Festival Crew Tee"],
  streetwear: ["Graphic Tee", "Coach Jacket", "Varsity Jacket", "Shop Hoodie", "Logo Cap", "Artist Series Tee"],
  "designer-archive": ["Runway Jacket", "Artisanal Vest", "Bondage Trouser", "Deconstructed Knit", "Archive Coat", "Statement Shirt"],
};

export const marketplaces: Marketplace[] = ["eBay", "Grailed", "Mercari", "Yahoo Auctions", "Depop", "Vestiaire Collective", "Buyee", "Rakuten Rakuma"];
const conditions = ["Deadstock", "Excellent", "Very Good", "Good", "Fair", "Distressed"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const countries = ["United States", "Japan", "United Kingdom", "France", "Italy", "Belgium", "Canada", "Mexico", "Portugal"];
const PRODUCTS_PER_BRAND = 30;

export const slugify = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const monthAgo = (months: number, seed: number) => new Date(Date.UTC(2026, 5 - months, 1 + (seed % 26))).toISOString().slice(0, 10);

export const brands: Brand[] = Object.entries(categoryBrands).flatMap(([categoryId, rows]) =>
  rows.map(([name, foundingYear, country], index) => {
    const category = categoryId as CategoryId;
    return {
      id: `${category}-${index + 1}`,
      slug: slugify(name),
      name,
      categoryId: category,
      foundingYear,
      country,
      history: `${name} is indexed as a primary ${categories.find((item) => item.id === category)?.name.toLowerCase()} reference because its garments reveal changes in materials, labels, distribution, and collector demand from ${foundingYear} onward.`,
      keyMoments: [`${foundingYear}: Foundation period establishes the original production language.`, `${foundingYear + 18}: Label and distribution changes create a distinct authentication window.`, `${foundingYear + 37}: Collector demand increases as early examples become harder to verify.`],
      tagEvolution: [`${foundingYear}s woven or printed identifiers with simple origin marks.`, `${foundingYear + 20}s size blocks, care information, and regional manufacturing language become standardized.`, `${foundingYear + 40}s collector-recognized variants appear across parallel production runs.`],
      manufacturingCountries: [country, countries[(index + 2) % countries.length], countries[(index + 5) % countries.length]],
      authenticationGuide: ["Confirm label typography, spacing, and care-symbol language against the production year.", "Compare stitch construction, fabric weight, and fade patterns before relying on a single tag.", "Use marketplace provenance only as supporting evidence; garment-level details remain primary."],
    };
  }),
);

export const products: Product[] = brands.flatMap((brand, brandIndex) =>
  Array.from({ length: PRODUCTS_PER_BRAND }, (_, productIndex) => {
    const noun = productNouns[brand.categoryId][(brandIndex + productIndex) % productNouns[brand.categoryId].length];
    const releaseYear = Math.max(1942, brand.foundingYear + 4 + productIndex * 2 + (brandIndex % 8));
    const seasonalCode = ["Contract", "Tour", "Archive", "Union", "Runway", "Drop"][productIndex % 6];
    const name = `${brand.name} ${releaseYear} ${seasonalCode} ${noun}`;
    const categoryPremium: Record<CategoryId, number> = { military: 130, workwear: 95, "band-tee": 180, streetwear: 210, "designer-archive": 390 };
    const marketPrice = Math.round(120 + (brandIndex % 10) * 48 + productIndex * 24 + categoryPremium[brand.categoryId] + (releaseYear % 31) * 11);
    const rarityScore = Math.min(100, 42 + ((brandIndex * 9 + productIndex * 13) % 58));
    return {
      id: `${brand.id}-p${productIndex + 1}`,
      slug: slugify(name),
      name,
      brandId: brand.id,
      categoryId: brand.categoryId,
      releaseYear,
      country: brand.manufacturingCountries[productIndex % brand.manufacturingCountries.length],
      description: `${name} is catalogued as an archive reference for studying label construction, material aging, production context, and resale behavior.`,
      historicalSignificance: "This piece functions as a material record: the tag, construction, print or fabric treatment, and manufacturing origin all help place it inside a specific vintage window.",
      culturalImpact: "Collector interest is strongest when the garment connects a recognizable visual language to a documented scene, contract, tour, runway season, or workwear use case.",
      productionDetails: "Documented details include fabric weight, stitch behavior, label typography, hardware aging, care-label language, and variance across production countries.",
      marketPrice,
      priceChangePercent: Number((((brandIndex * 7 + productIndex * 5) % 35) - 12).toFixed(1)),
      rarityScore,
      popularity: 50 + ((brandIndex * 11 + productIndex * 17) % 50),
      size: sizes[(brandIndex + productIndex) % sizes.length],
      condition: conditions[(brandIndex + productIndex * 2) % conditions.length],
      tagId: `${brand.id}-t${(productIndex % 2) + 1}`,
      referenceNumber: `AI-${brand.categoryId.toUpperCase().slice(0, 3)}-${releaseYear}-${String(brandIndex + 1).padStart(2, "0")}${productIndex + 1}`,
      knownVariants: ["Domestic distribution", "Export label", productIndex % 2 === 0 ? "Alternate care-label sequence" : "Regional fabric lot variation"],
      marketplaceLinks: Object.fromEntries(marketplaces.map((marketplace) => [marketplace, `https://www.google.com/search?q=${encodeURIComponent(`${name} ${marketplace}`)}`])) as Record<Marketplace, string>,
    };
  }),
);

export const tags: TagRecord[] = brands.flatMap((brand, brandIndex) =>
  Array.from({ length: 2 }, (_, tagIndex) => {
    const start = Math.max(1940, brand.foundingYear + tagIndex * 18 + (brandIndex % 6));
    return {
      id: `${brand.id}-t${tagIndex + 1}`,
      brandId: brand.id,
      productId: `${brand.id}-p${tagIndex + 1}`,
      categoryId: brand.categoryId,
      label: `${brand.name} ${start}-${start + 12} ${tagIndex === 0 ? "Primary" : "Transitional"} Tag`,
      yearStart: start,
      yearEnd: start + 12,
      country: brand.manufacturingCountries[tagIndex % brand.manufacturingCountries.length],
      factoryInformation: `${brand.manufacturingCountries[tagIndex % brand.manufacturingCountries.length]} production run with period-specific typography and care language.`,
      stitchType: (["Single stitch", "Double stitch", "Chain stitch", "Overlock"] as const)[(brandIndex + tagIndex) % 4],
      knownVariants: ["Domestic size block", "Export care language", "Late-run font weight change"],
      authenticationNotes: "Check label fiber, print bleed, edge fray, size typography, stitch tension, and alignment against known production windows.",
      commonFakes: "Common reproductions use modern blank labels, overly bright ink, inconsistent origin wording, and incorrect stitch density.",
      productionDifferences: "Differences usually appear in care symbols, RN or contract numbers, thread shade, label backing, and country-specific wash text.",
    };
  }),
);

export const timelineEvents: TimelineEvent[] = [
  ...categories.flatMap((category, categoryIndex) =>
    Array.from({ length: 11 }, (_, eventIndex) => {
      const year = 1945 + categoryIndex * 9 + eventIndex * 7;
      return {
        id: `${category.id}-event-${eventIndex + 1}`,
        categoryId: category.id,
        year,
        title: `${category.name} archive milestone ${eventIndex + 1}`,
        description: `${category.timelineFocus} This milestone connects objects, production changes, and market behavior.`,
        marketImpact: eventIndex % 3 === 0 ? "Verified examples around this period trade at a premium when provenance and tags are intact." : "Comparable sales create a useful baseline for condition-adjusted valuation.",
        type: ["Cultural milestone", "Production change", "Market impact", "Tag evolution"][eventIndex % 4],
      };
    }),
  ),
  ...brands.slice(0, 20).map((brand) => ({
    id: `${brand.id}-brand-event`,
    categoryId: brand.categoryId,
    brandId: brand.id,
    year: brand.foundingYear + 25,
    title: `${brand.name} collector recognition window`,
    description: `${brand.name} examples from this period become easier to separate by label language, construction, and distribution channel.`,
    marketImpact: "Collector confidence increases when timeline evidence and garment details align.",
    type: "Brand history",
  })),
];

export const transactions: MarketTransaction[] = products.flatMap((product, productIndex) =>
  Array.from({ length: 6 }, (_, transactionIndex) => {
    const seasonalSwing = 1 + (((transactionIndex - 2) * product.priceChangePercent) / 100) * 0.18;
    const conditionDiscount = 1 - (transactionIndex % 4) * 0.045;
    const price = Math.max(28, Math.round(product.marketPrice * seasonalSwing * conditionDiscount + ((productIndex + transactionIndex) % 23) * 4));
    const marketplace = marketplaces[(productIndex + transactionIndex) % marketplaces.length];
    return {
      id: `${product.id}-sale-${transactionIndex + 1}`,
      productId: product.id,
      marketplace,
      date: monthAgo(36 - transactionIndex * 5 - (productIndex % 3), productIndex + transactionIndex),
      price,
      condition: conditions[(productIndex + transactionIndex) % conditions.length],
      sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(`${product.name} sold ${marketplace}`)}`,
    };
  }),
);

export const communitySubmissions: CommunitySubmission[] = products.slice(0, 36).flatMap((product, index) =>
  Array.from({ length: index % 3 === 0 ? 3 : 2 }, (_, exampleIndex) => ({
    id: `${product.id}-submission-${exampleIndex + 1}`,
    productId: product.id,
    contributor: ["RivetRoom", "TagLibrary", "FadedArchive", "TokyoPicker", "MuseumRack"][(index + exampleIndex) % 5],
    badge: ["Contributor", "Collector", "Archivist", "Expert Archivist", "Museum Contributor"][(index + exampleIndex) % 5],
    profileUrl: `#/contributors/${index + exampleIndex}`,
    contributionDate: monthAgo(exampleIndex + 1, index),
    status: exampleIndex === 0 || index % 4 !== 0 ? "Approved" : "Pending Review",
    photos: ["Front View", "Back View", "Tag Photo", "Stitching Detail"].slice(0, 2 + (exampleIndex % 3)),
    year: product.releaseYear + exampleIndex,
    country: product.country,
    tagType: exampleIndex % 2 === 0 ? "Single Stitch / Period Label" : "Double Stitch / Transitional Label",
    authenticationNotes: "Contributor noted tag fiber, print cracking, seam wear, and measurements consistent with the documented production window.",
    rightsAgreementAt: `${monthAgo(exampleIndex + 1, index)}T12:00:00.000Z`,
  })),
);

export const rareItemRequests: RareItemRequest[] = [
  { id: "rare-1", title: "1994 Nirvana Heart Shaped Box Tee", categoryId: "band-tee", brand: "Nirvana", rewardPoints: 850, requestedBy: "SubPopIndex", notes: "Seeking verified front, back, tag, and print-detail photos with measurements." },
  { id: "rare-2", title: "1998 Stussy Dragon Tee", categoryId: "streetwear", brand: "Stussy", rewardPoints: 700, requestedBy: "LagunaArchive", notes: "Priority for original owner examples or shop provenance." },
  { id: "rare-3", title: "2001 Raf Simons Riot Riot Riot Bomber", categoryId: "designer-archive", brand: "Raf Simons", rewardPoints: 1200, requestedBy: "RunwayLedger", notes: "Looking for label, lining, hardware, and runway reference details." },
  { id: "rare-4", title: "Carhartt J97 MOS Blanket Lined Detroit Jacket", categoryId: "workwear", brand: "Carhartt", rewardPoints: 650, requestedBy: "DuckCanvasLab", notes: "Need faded examples to compare patina, tab placement, and lining wear." },
];

export const archive = { categories, brands, products, tags, timelineEvents, transactions, communitySubmissions, rareItemRequests };
export const getCategoryBySlug = (slug: string) => categories.find((category) => category.slug === slug);
export const getBrandBySlug = (slug: string) => brands.find((brand) => brand.slug === slug);
export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const getBrand = (id: string) => brands.find((brand) => brand.id === id);
export const getCategory = (id: CategoryId) => categories.find((category) => category.id === id);
export const getProduct = (id: string) => products.find((product) => product.id === id);
export const getTag = (id: string) => tags.find((tag) => tag.id === id);
export const productTransactions = (productId: string) => transactions.filter((transaction) => transaction.productId === productId);

export const summarizeMarket = (records: MarketTransaction[]): MarketSummary => {
  if (!records.length) return { median: 0, average: 0, highest: 0, lowest: 0, salesVolume: 0, transactionCount: 0, volatility: 0, liquidity: "No public trades", spread: 0 };
  const prices = records.map((record) => record.price).sort((a, b) => a - b);
  const total = prices.reduce((sum, price) => sum + price, 0);
  const average = Math.round(total / prices.length);
  const median = prices.length % 2 ? prices[Math.floor(prices.length / 2)] : Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2);
  const highest = prices[prices.length - 1];
  const lowest = prices[0];
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
  const volatility = Number((Math.sqrt(variance) / average).toFixed(2));
  const spread = Number((((highest - lowest) / median) * 100).toFixed(1));
  return { median, average, highest, lowest, salesVolume: total, transactionCount: records.length, volatility, liquidity: records.length > 24 ? "Deep" : records.length > 8 ? "Moderate" : "Thin", spread };
};

export const marketplaceComparison = (records: MarketTransaction[]) =>
  marketplaces.map((marketplace) => {
    const summary = summarizeMarket(records.filter((record) => record.marketplace === marketplace));
    return { marketplace, average: summary.average, count: summary.transactionCount, highest: summary.highest, lowest: summary.lowest };
  });

export const priceHistory = (product: Product, months = 36): ChartPoint[] =>
  Array.from({ length: months }, (_, index) => {
    const progress = index / Math.max(1, months - 1);
    const trend = 1 + (product.priceChangePercent / 100) * progress;
    const cycle = Math.sin((index + product.rarityScore) / 3) * 0.06;
    return { date: monthAgo(months - index, index), price: Math.round(product.marketPrice * (0.88 + trend * 0.12 + cycle)), volume: Math.max(1, Math.round(2 + product.popularity / 20 + Math.cos(index / 2) * 2)) };
  });

export const aiMarketAnalysis = (product: Product) => {
  const brand = getBrand(product.brandId);
  const category = getCategory(product.categoryId);
  const tag = getTag(product.tagId);
  const direction = product.priceChangePercent >= 0 ? "rose" : "softened";
  const construction = tag?.stitchType.toLowerCase() ?? "period construction";
  return {
    whyPriceChanged: `Price ${direction} because verified ${brand?.name} examples with ${construction} details are trading with clearer production-year confidence.`,
    historicalContext: `${category?.name} collectors are using tag windows, country of manufacture, and period events to separate original artifacts from later homages.`,
    collectorDemand: product.rarityScore > 82 ? "Demand is concentrated among advanced collectors who prioritize original labels, provenance, and uncommon variants." : "Demand is broad but condition-sensitive, with buyers comparing several marketplace comps before paying premiums.",
    marketSentiment: product.priceChangePercent > 8 ? "Constructive" : product.priceChangePercent < -5 ? "Selective" : "Stable",
    rarityScore: product.rarityScore,
    authenticityConfidence: Math.min(98, Math.round(66 + product.rarityScore / 3)),
    investmentScore: Math.min(100, Math.round(product.rarityScore * 0.55 + product.popularity * 0.35 + Math.max(0, product.priceChangePercent))),
    marketConfidenceScore: Math.min(100, Math.round(62 + product.popularity / 3)),
    futureDemandOutlook: "Future demand depends on documented examples, community submissions, and whether comparable tags remain discoverable in public sales archives.",
  };
};

export const topMovers = (categoryId?: CategoryId) => products.filter((product) => !categoryId || product.categoryId === categoryId).slice().sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent)).slice(0, 6);
export const newestAdditions = (categoryId?: CategoryId) => products.filter((product) => !categoryId || product.categoryId === categoryId).slice(-18).reverse().slice(0, 6);

export const searchArchive = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products.slice(0, 24);
  return products.filter((product) => {
    const brand = getBrand(product.brandId);
    const tag = getTag(product.tagId);
    return [product.name, product.referenceNumber, product.releaseYear, product.country, product.categoryId, brand?.name, tag?.label, tag?.country].join(" ").toLowerCase().includes(normalized);
  }).slice(0, 60);
};

export const collectorStats = {
  currentValue: products.slice(0, 8).reduce((sum, product) => sum + product.marketPrice, 0),
  purchasePrice: products.slice(0, 8).reduce((sum, product) => sum + Math.round(product.marketPrice * 0.68), 0),
  insuranceValue: products.slice(0, 8).reduce((sum, product) => sum + Math.round(product.marketPrice * 1.18), 0),
  watchedItems: 18,
  savedSearches: 7,
  marketAlerts: 5,
};
