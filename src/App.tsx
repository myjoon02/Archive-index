import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  aiMarketAnalysis,
  archive,
  brands,
  categories,
  communitySubmissions,
  getBrand,
  getBrandBySlug,
  getCategory,
  getCategoryBySlug,
  getProduct,
  getProductBySlug,
  getTag,
  marketplaceComparison,
  marketplaces,
  productTransactions,
  products,
  rareItemRequests,
  summarizeMarket,
  tags,
  type CategoryId,
  type CommunitySubmission,
  type Marketplace,
  type MarketTransaction,
  type Product,
  type SubmissionStatus,
} from "./archiveData";
import { runDailyArchiveCollection } from "./marketCollector";

type View =
  | { page: "home" }
  | { page: "search" }
  | { page: "archive" }
  | { page: "category"; slug: string }
  | { page: "brand"; slug: string }
  | { page: "tag"; slug: string }
  | { page: "product"; slug: string }
  | { page: "submit" }
  | { page: "admin" }
  | { page: "rare" }
  | { page: "generator" }
  | { page: "copyright" }
  | { page: "about" };

type SortOption = "Year" | "Price" | "Popularity" | "Rarity";

const parseHash = (): View => {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { page: "home" };
  if (parts[0] === "category" && parts[1]) return { page: "category", slug: parts[1] };
  if (parts[0] === "brand" && parts[1]) return { page: "brand", slug: parts[1] };
  if (parts[0] === "tag" && parts[1]) return { page: "tag", slug: parts[1] };
  if (parts[0] === "product" && parts[1]) return { page: "product", slug: parts[1] };
  if (["search", "archive", "submit", "admin", "rare", "generator", "copyright", "about"].includes(parts[0])) return { page: parts[0] as View["page"] } as View;
  return { page: "home" };
};

const minArchiveYear = 1900;
const maxArchiveYear = 2024;
const invalidTitleKeywords = ["test", "demo", "sample", "placeholder", "unknown"];

const isValidArchiveProduct = (product: Product) => {
  const normalizedTitle = product.name.toLowerCase();
  return product.releaseYear >= minArchiveYear && product.releaseYear <= maxArchiveYear && !invalidTitleKeywords.some((keyword) => normalizedTitle.includes(keyword));
};

const baseArchiveProducts = products.filter(isValidArchiveProduct);

const searchValidArchive = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return validProducts.slice().sort((a, b) => b.archiveScore - a.archiveScore).slice(0, 24);
  return validProducts
    .filter((product) => {
      const brand = getBrand(product.brandId);
      const tag = getTag(product.tagId);
      return [product.name, product.referenceNumber, product.releaseYear, product.country, product.categoryId, brand?.name, tag?.label, tag?.country, ...generateProductTags(product).map((item) => `${item.label} ${item.group}`)]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    })
    .sort((a, b) => b.archiveScore - a.archiveScore || b.releaseYear - a.releaseYear)
    .slice(0, 60);
};

const topValidMovers = (categoryId?: CategoryId) =>
  validProducts
    .filter((product) => !categoryId || product.categoryId === categoryId)
    .slice()
    .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
    .slice(0, 6);

const newestValidAdditions = (categoryId?: CategoryId) =>
  validProducts
    .filter((product) => !categoryId || product.categoryId === categoryId)
    .slice(-18)
    .reverse()
    .slice(0, 6);

type ProductImageType = "Front View" | "Back View" | "Tag Photo" | "Print Detail" | "Stitch Detail" | "Fade Detail" | "Label Detail" | "Packaging";
type ProductImageSource = "Google Images" | "Grailed" | "eBay Sold Listings" | "Yahoo Auctions Japan" | "Mercari" | "Archive.org / Vintage Archive";

interface ProductImageRecord {
  id: string;
  productId: string;
  type: ProductImageType;
  label: string;
  source: ProductImageSource;
  sourceUrl: string;
  url: string;
  isPrimary: boolean;
  verified: boolean;
  width: number;
  height: number;
  metadata: {
    year: number;
    country: string;
    tagType: string;
    stitchType: string;
    condition: string;
  };
}

type TagGroup = "Category" | "Era" | "Construction" | "Country" | "Tag Manufacturer" | "Culture" | "Product Type" | "Brand";

interface ArchiveTag {
  id: string;
  label: string;
  group: TagGroup;
  description: string;
}

const normalizeTagId = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const createArchiveTag = (group: TagGroup, label: string, description?: string): ArchiveTag => ({
  id: normalizeTagId(label),
  label,
  group,
  description: description ?? `${label} 기준으로 연결된 아카이브 제품입니다.`,
});

const eraLabel = (year: number) => `${Math.floor(year / 10) * 10}s`;
const countryTagLabel = (country: string) => {
  if (country === "United States") return "USA";
  if (country === "United Kingdom") return "UK";
  return country;
};

const productTypeLabel = (product: Product) => {
  const name = product.name.toLowerCase();
  if (name.includes("tee")) return "Graphic Tee";
  if (name.includes("jacket") || name.includes("coat") || name.includes("parka")) return "Jacket";
  if (name.includes("denim") || name.includes("pant") || name.includes("trouser")) return "Pants";
  if (name.includes("shirt")) return "Shirt";
  return "Archive Garment";
};

const generateProductTags = (product: Product): ArchiveTag[] => {
  const brand = getBrand(product.brandId);
  const tag = getTag(product.tagId);
  const category = getCategory(product.categoryId);
  const name = product.name.toLowerCase();
  const generated: ArchiveTag[] = [
    createArchiveTag("Category", category?.name ?? product.categoryId, "아카이브의 1차 카테고리 분류입니다."),
    createArchiveTag("Era", eraLabel(product.releaseYear), `${eraLabel(product.releaseYear)} 생산/문화권 제품입니다.`),
    createArchiveTag("Country", countryTagLabel(product.country), `${product.country} 생산 또는 유통 맥락의 제품입니다.`),
    createArchiveTag("Brand", brand?.name ?? "Unknown Brand", "브랜드별 제품과 태그를 연결합니다."),
    createArchiveTag("Product Type", productTypeLabel(product), "제품 형태와 착용/수집 맥락을 기준으로 한 분류입니다."),
  ];

  if (tag?.stitchType) generated.push(createArchiveTag("Construction", tag.stitchType.replace(" stitch", " Stitch"), "봉제 방식과 생산 시기를 추적하는 구조 태그입니다."));
  if (name.includes("brockum")) generated.push(createArchiveTag("Tag Manufacturer", "Brockum", "1990년대 밴드 티셔츠에서 자주 확인되는 태그 제조/유통명입니다."));
  if (name.includes("big e") || brand?.name === "Levi's") generated.push(createArchiveTag("Tag Manufacturer", "Big E", "Levi's 빈티지 데님 판별에서 중요한 탭/라벨 기준입니다."));
  if (name.includes("selvedge") || name.includes("501")) generated.push(createArchiveTag("Construction", "Selvedge", "셀비지 데님 구조와 생산 연대를 추적하는 태그입니다."));
  if (product.categoryId === "streetwear" || ["Stussy", "Supreme", "A Bathing Ape"].includes(brand?.name ?? "")) generated.push(createArchiveTag("Culture", "Skateboarding", "스케이트보딩과 스트리트웨어 문화권 제품입니다."));
  if (product.categoryId === "band-tee") generated.push(createArchiveTag("Culture", "Band Tee", "음악, 투어, 머천다이즈 문화를 기록하는 제품군입니다."));
  if (product.categoryId === "military") generated.push(createArchiveTag("Culture", "Military", "군납, 서플러스, 유틸리티 디자인 맥락의 제품군입니다."));
  if (brand?.name === "Stussy") generated.push(createArchiveTag("Culture", "International Stussy Tribe", "Stussy의 글로벌 커뮤니티와 초기 스트리트웨어 네트워크를 가리킵니다."));

  return Array.from(new Map(generated.map((item) => [item.id, item])).values());
};

const productTagIds = (product: Product) => generateProductTags(product).map((tag) => tag.id);

const imageTypeMap: Record<string, ProductImageType> = {
  "Front View": "Front View",
  "Back View": "Back View",
  "Tag Photo": "Tag Photo",
  "Print Detail": "Print Detail",
  "Stitching Detail": "Stitch Detail",
  "Stitch Detail": "Stitch Detail",
  "Fade Detail": "Fade Detail",
  "Label Detail": "Label Detail",
  Packaging: "Packaging",
};

const imageTypeLabel: Record<ProductImageType, string> = {
  "Front View": "Front View",
  "Back View": "Back View",
  "Tag Photo": "Tag Photo",
  "Print Detail": "Print Detail",
  "Stitch Detail": "Stitch Detail",
  "Fade Detail": "Fade Detail",
  "Label Detail": "Label Detail",
  Packaging: "Packaging",
};

interface ImageCandidate {
  id: string;
  type: ProductImageType;
  source: ProductImageSource;
  title: string;
  sourceUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  productVisible: boolean;
  productShapeIdentifiable: boolean;
  textOnly: boolean;
  mostlyText: boolean;
  logoDominant: boolean;
  isAiGenerated: boolean;
  isPlaceholder: boolean;
  isAdBanner: boolean;
  isWebsiteScreenshot: boolean;
  watermarkOnly: boolean;
}

interface ProductImageCollection {
  id: string;
  brand: string;
  year: number;
  mainImage?: ProductImageRecord;
  imageStatus: "FOUND" | "PENDING" | "NOT_FOUND";
  retryCount: number;
  nextRetryAt?: string;
  images: {
    front?: ProductImageRecord;
    back?: ProductImageRecord;
    tag?: ProductImageRecord;
    detail?: ProductImageRecord;
  };
  all: ProductImageRecord[];
}

const imageSearchPriority: ProductImageSource[] = [
  "Grailed",
  "eBay Sold Listings",
  "Yahoo Auctions Japan",
  "Mercari",
  "Google Images",
  "Archive.org / Vintage Archive",
];

const imageSourceScores: Record<ProductImageSource, number> = {
  Grailed: 50,
  "eBay Sold Listings": 40,
  "Yahoo Auctions Japan": 35,
  Mercari: 30,
  "Google Images": 20,
  "Archive.org / Vintage Archive": 15,
};


const bannedImageTerms = [
  "logo",
  "brand logo",
  "banner",
  "advertisement",
  "placeholder",
  "no image",
  "no-image",
  "image not available",
  "coming soon",
  "screenshot",
  "screen shot",
  "ai generated",
  "generated image",
  "watermark only",
];

const inferredImageTypes = (product: Product): ProductImageType[] => {
  const types: ProductImageType[] = ["Front View", "Back View"];
  const name = product.name.toLowerCase();
  if (product.archiveScore >= 90) types.push("Tag Photo");
  if (name.includes("tee") || name.includes("shirt")) types.push("Print Detail");
  if (product.archiveScore >= 95) types.push("Stitch Detail");
  return Array.from(new Set(types));
};

const cleanProductNameForImageSearch = (product: Product) => {
  const brand = getBrand(product.brandId)?.name ?? "";
  return product.name.replace(brand, "").replace(String(product.releaseYear), "").replace(/\b(contract|tour|archive|union|runway|drop)\b/gi, "").trim();
};

const buildImageSearchQueries = (product: Product) => {
  const brand = getBrand(product.brandId)?.name ?? "";
  const productName = cleanProductNameForImageSearch(product);
  const genericType = productName.toLowerCase().includes("tee") ? "Tee" : productName.split(" ").slice(-1)[0] || "Clothing";
  return [
    `"${product.releaseYear} ${brand} ${productName}"`,
    `"${brand} ${productName} vintage"`,
    `"${brand} ${productName} grailed"`,
    `"${brand} ${productName} ebay"`,
    `"${brand} ${productName} archive"`,
    `"${brand} Vintage ${genericType}"`,
    `"${brand} Shirt"`,
    `"${brand} Clothing"`,
  ];
};

const similarProductsForImageFallback = (product: Product) =>
  baseArchiveProducts
    .filter((candidate) => candidate.id !== product.id)
    .filter((candidate) => candidate.brandId === product.brandId || candidate.categoryId === product.categoryId)
    .sort((a, b) => {
      const sameBrandA = a.brandId === product.brandId ? 1 : 0;
      const sameBrandB = b.brandId === product.brandId ? 1 : 0;
      const yearA = Math.abs(a.releaseYear - product.releaseYear);
      const yearB = Math.abs(b.releaseYear - product.releaseYear);
      return sameBrandB - sameBrandA || yearA - yearB || b.archiveScore - a.archiveScore;
    })
    .slice(0, 4);

const imageKindForType = (type: ProductImageType) => {
  if (type === "Front View") return "front";
  if (type === "Back View") return "back";
  if (type === "Tag Photo") return "tag";
  return "detail";
};

const logImageSearch = (status: "SUCCESS" | "FAILED", detail: { product: string; source: ProductImageSource; page?: string; image?: string; reason?: string }) => {
  const label = status === "SUCCESS" ? "[IMAGE SEARCH]" : "[IMAGE SEARCH FAILED]";
  console.info(`${label}\nProduct:\n${detail.product}\n\nSource:\n${detail.source}\n\nPage:\n${detail.page ?? "N/A"}\n\nImage Found:\n${detail.image ?? "N/A"}\n\nStatus:\n${status}${detail.reason ? `\n\nReason:\n${detail.reason}` : ""}`);
};

const sourceSearchUrl = (source: ProductImageSource, query: string) => {
  const encoded = encodeURIComponent(query.replace(/"/g, ""));
  if (source === "Grailed") return `https://www.google.com/search?q=${encoded}+grailed`;
  if (source === "eBay Sold Listings") return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_Sold=1&LH_Complete=1`;
  if (source === "Yahoo Auctions Japan") return `https://auctions.yahoo.co.jp/search/search?p=${encoded}`;
  if (source === "Mercari") return `https://jp.mercari.com/search?keyword=${encoded}`;
  if (source === "Google Images") return `https://www.google.com/search?tbm=isch&q=${encoded}`;
  return `https://archive.org/search?query=${encoded}`;
};

const extractProductPageLinks = (html: string, source: ProductImageSource) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const hostMatchers: Record<ProductImageSource, string[]> = {
    Grailed: ["grailed.com/listings", "grailed.com"],
    "eBay Sold Listings": ["ebay.com/itm", "ebay.com"],
    "Yahoo Auctions Japan": ["auctions.yahoo.co.jp", "page.auctions.yahoo.co.jp"],
    Mercari: ["mercari.com", "jp.mercari.com/item"],
    "Google Images": [],
    "Archive.org / Vintage Archive": ["archive.org"],
  };
  return Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((anchor) => anchor.href)
    .filter((href) => hostMatchers[source].some((matcher) => href.includes(matcher)))
    .slice(0, 5);
};

const absoluteUrl = (value: string | null | undefined, baseUrl: string) => {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return undefined;
  }
};

const extractImageCandidatesFromProductPage = (html: string, pageUrl: string, source: ProductImageSource, product: Product, type: ProductImageType): ImageCandidate[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const metaUrls = [
    doc.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content,
    doc.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')?.content,
  ];
  const imgUrls = Array.from(doc.querySelectorAll<HTMLImageElement>("picture img, img"))
    .map((img) => img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-original"));
  const urls = [...metaUrls, ...imgUrls]
    .map((url) => absoluteUrl(url, pageUrl))
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls)).map((imageUrl, index) => ({
    id: `${product.id}-${type}-${source}-${index}`,
    type,
    source,
    title: `${product.name} ${type}`,
    sourceUrl: pageUrl,
    imageUrl,
    width: imageUrl.includes("1000") || imageUrl.includes("1200") ? 1200 : 800,
    height: imageUrl.includes("1000") || imageUrl.includes("1200") ? 1200 : 1000,
    productVisible: true,
    productShapeIdentifiable: true,
    textOnly: false,
    mostlyText: false,
    logoDominant: false,
    isAiGenerated: false,
    isPlaceholder: false,
    isAdBanner: false,
    isWebsiteScreenshot: false,
    watermarkOnly: false,
  }));
};

const fetchText = async (url: string) => {
  const response = await fetch(url, { headers: { Accept: "text/html" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
};

const collectSourceCandidates = async (product: Product, type: ProductImageType, source: ProductImageSource, queries: string[]) => {
  const candidates: ImageCandidate[] = [];
  for (const query of queries) {
    const searchUrl = sourceSearchUrl(source, query);
    try {
      const searchHtml = await fetchText(searchUrl);
      const productPages = source === "Google Images" ? [searchUrl] : extractProductPageLinks(searchHtml, source);
      if (!productPages.length) {
        logImageSearch("FAILED", { product: product.name, source, page: searchUrl, reason: "No Product Page Found" });
        continue;
      }
      for (const pageUrl of productPages) {
        const pageHtml = source === "Google Images" ? searchHtml : await fetchText(pageUrl);
        const extracted = extractImageCandidatesFromProductPage(pageHtml, pageUrl, source, product, type).filter(validateImageCandidate);
        if (extracted.length) {
          const best = extracted.sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a))[0];
          logImageSearch("SUCCESS", { product: product.name, source, page: pageUrl, image: best.imageUrl });
          candidates.push(...extracted);
        } else {
          logImageSearch("FAILED", { product: product.name, source, page: pageUrl, reason: "No Valid Image Found" });
        }
      }
    } catch (error) {
      logImageSearch("FAILED", { product: product.name, source, page: searchUrl, reason: error instanceof Error ? error.message : "Fetch Failed" });
    }
  }
  return candidates;
};

const buildImageCandidates = (_product: Product, _type: ProductImageType): ImageCandidate[] => [];

const curatedImageCandidates: Record<string, ImageCandidate[]> = {};

const searchGrailed = async (_queries: string[]) => [] as ImageCandidate[];
const searchEbaySold = async (_queries: string[]) => [] as ImageCandidate[];
const searchYahooJapan = async (_queries: string[]) => [] as ImageCandidate[];
const searchMercari = async (_queries: string[]) => [] as ImageCandidate[];
const searchGoogleImages = async (_queries: string[]) => [] as ImageCandidate[];
const searchVintageArchives = async (_queries: string[]) => [] as ImageCandidate[];

const validateImageCandidate = (candidate: ImageCandidate) => {
  const haystack = `${candidate.title} ${candidate.imageUrl} ${candidate.sourceUrl}`.toLowerCase();
  if (bannedImageTerms.some((term) => haystack.includes(term))) return false;
  if (candidate.width < 300 || candidate.height < 300) return false;
  if (!candidate.productVisible || !candidate.productShapeIdentifiable) return false;
  if (candidate.textOnly || candidate.mostlyText || candidate.logoDominant) return false;
  if (candidate.isAiGenerated || candidate.isPlaceholder || candidate.isAdBanner || candidate.isWebsiteScreenshot || candidate.watermarkOnly) return false;
  return true;
};

const scoreImageCandidate = (candidate: ImageCandidate) =>
  imageSourceScores[candidate.source] +
  (candidate.width >= 1000 || candidate.height >= 1000 ? 20 : 0) +
  (candidate.productVisible ? 30 : 0) +
  (!candidate.mostlyText && !candidate.textOnly ? 20 : 0);

const findProductImages = async (product: Product) => {
  const queries = buildImageSearchQueries(product);
  const candidates: ImageCandidate[] = [];
  for (const type of inferredImageTypes(product)) {
    for (const source of imageSearchPriority) {
      candidates.push(...(await collectSourceCandidates(product, type, source, queries)));
    }
  }
  return candidates.filter(validateImageCandidate).sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
};

const imageMetadataForProduct = (product: Product) => {
  const tag = getTag(product.tagId);
  return {
    year: product.releaseYear,
    country: product.country,
    tagType: tag?.label ?? "Unverified tag",
    stitchType: tag?.stitchType ?? "Unknown stitch",
    condition: product.condition,
  };
};

const imageSlotForType = (type: ProductImageType): keyof ProductImageCollection["images"] => {
  if (type === "Front View") return "front";
  if (type === "Back View") return "back";
  if (type === "Tag Photo") return "tag";
  return "detail";
};

const candidateToRecord = (product: Product, candidate: ImageCandidate, index: number): ProductImageRecord => ({
  id: candidate.id,
  productId: product.id,
  type: candidate.type,
  label: imageTypeLabel[candidate.type],
  source: candidate.source,
  sourceUrl: candidate.sourceUrl,
  url: candidate.imageUrl,
  isPrimary: index === 0,
  verified: true,
  width: candidate.width,
  height: candidate.height,
  metadata: imageMetadataForProduct(product),
});

const getProductImageCollection = (product: Product, submissions: CommunitySubmission[] = communitySubmissions): ProductImageCollection => {
  const brand = getBrand(product.brandId)?.name ?? "";
  const approvedTypes = submissions
    .filter((submission) => submission.productId === product.id && submission.status === "Approved")
    .flatMap((submission) => submission.photos.map((photo) => imageTypeMap[photo]).filter((type): type is ProductImageType => Boolean(type)));
  const requestedTypes = approvedTypes.length ? Array.from(new Set(approvedTypes)) : inferredImageTypes(product);
  const curated = curatedImageCandidates[product.id] ?? [];
  const collected = requestedTypes.flatMap((type) => {
    const curatedForType = curated.filter((candidate) => candidate.type === type);
    const generatedForType = buildImageCandidates(product, type);
    return [...curatedForType, ...generatedForType]
      .filter(validateImageCandidate)
      .sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a))
      .slice(0, 1);
  });
  const all = collected
    .sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a))
    .map((candidate, index) => candidateToRecord(product, candidate, index));
  const slots: ProductImageCollection["images"] = {};
  all.forEach((image) => {
    const slot = imageSlotForType(image.type);
    if (!slots[slot]) slots[slot] = image;
  });
  const imageStatus = all[0] ? "FOUND" : "PENDING";
  return {
    id: product.id,
    brand,
    year: product.releaseYear,
    mainImage: all[0],
    imageStatus,
    retryCount: imageStatus === "FOUND" ? 0 : Math.min(30, Number(localStorage.getItem(`image-retry-${product.id}`) ?? 0)),
    nextRetryAt: imageStatus === "FOUND" ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    images: slots,
    all,
  };
};

const cultureBrandGroups = {
  bandTee: ["Nirvana", "Metallica", "Sonic Youth", "Misfits", "Pink Floyd", "Grateful Dead"],
  skate: ["Alien Workshop", "Blind", "Santa Cruz", "Powell Peralta", "World Industries"],
  streetwear: ["Stussy", "Supreme", "A Bathing Ape", "Neighborhood", "WTAPS"],
  designer: ["Raf Simons", "Helmut Lang", "Maison Margiela", "Undercover", "Number (N)ine"],
};

const hasRequiredRegistrationData = (product: Product) => {
  const brand = getBrand(product.brandId);
  return Boolean(brand?.name && product.releaseYear && product.name.trim());
};

const productQualityScore = (product: Product) => {
  const hasPhoto = Boolean(getProductImageCollection(product).mainImage);
  const hasTransactions = archive.transactions.some((transaction) => transaction.productId === product.id);
  const hasHistory = Boolean(product.historicalSignificance?.trim());
  const hasTag = Boolean(getTag(product.tagId));
  const hasCulture = Boolean(product.culturalImpact?.trim());
  return [hasPhoto, hasTransactions, hasHistory, hasTag, hasCulture].filter(Boolean).length;
};

const isCultureArchiveProduct = (product: Product) => {
  const brand = getBrand(product.brandId)?.name ?? "";
  return (
    product.categoryId === "band-tee" ||
    product.categoryId === "designer-archive" ||
    cultureBrandGroups.skate.includes(brand) ||
    cultureBrandGroups.streetwear.includes(brand) ||
    cultureBrandGroups.designer.includes(brand)
  );
};

const validProducts = baseArchiveProducts
  .filter(hasRequiredRegistrationData)
  .filter((product) => productQualityScore(product) >= 2)
  .filter(isCultureArchiveProduct);
const validProductIds = new Set(validProducts.map((product) => product.id));
const validTransactions = archive.transactions.filter((transaction) => validProductIds.has(transaction.productId));
const validTags = tags.filter((tag) => validProductIds.has(tag.productId));
const visibleBrands = brands.filter((brand) => validProducts.some((product) => product.brandId === brand.id));
const allArchiveTags = Array.from(new Map(validProducts.flatMap(generateProductTags).map((tag) => [tag.id, tag])).values()).sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
const productsForTag = (tagId: string) => validProducts.filter((product) => productTagIds(product).includes(tagId)).sort((a, b) => b.archiveScore - a.archiveScore);
const tagBySlug = (slug: string) => allArchiveTags.find((tag) => tag.id === slug);
const topArchiveTags = allArchiveTags
  .map((tag) => ({ tag, count: productsForTag(tag.id).length }))
  .filter((item) => item.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 12);

const cultureCollections = [
  {
    slug: "band-tee",
    name: "Band Tee Archive",
    shortName: "Band Tee",
    description: "음악, 투어, 앨범 그래픽, 밴드 머천다이즈를 기록하는 문화 아카이브입니다.",
    categoryId: "band-tee" as CategoryId,
    brandNames: cultureBrandGroups.bandTee,
  },
  {
    slug: "skate",
    name: "Skate Archive",
    shortName: "Skate",
    description: "스케이트보드 그래픽, 보드 브랜드, 1990년대 숍 문화와 서브컬처를 기록합니다.",
    categoryId: "streetwear" as CategoryId,
    brandNames: cultureBrandGroups.skate,
  },
  {
    slug: "streetwear",
    name: "Streetwear Archive",
    shortName: "Streetwear",
    description: "스트리트웨어, 드롭 문화, 로고 그래픽, 도시 서브컬처의 레퍼런스를 축적합니다.",
    categoryId: "streetwear" as CategoryId,
    brandNames: cultureBrandGroups.streetwear,
  },
  {
    slug: "designer",
    name: "Designer Archive",
    shortName: "Designer",
    description: "런웨이 시즌, 디자이너 철학, 컬트 컬렉션과 아카이브 피스를 기록합니다.",
    categoryId: "designer-archive" as CategoryId,
    brandNames: cultureBrandGroups.designer,
  },
];

const cultureCollectionBySlug = (slug: string) => cultureCollections.find((collection) => collection.slug === slug || (slug === "designer-archive" && collection.slug === "designer"));
const productsForCultureCollection = (slug: string) => {
  const collection = cultureCollectionBySlug(slug);
  if (!collection) return [];
  return validProducts.filter((product) => {
    const brand = getBrand(product.brandId)?.name ?? "";
    if (collection.slug === "band-tee") return product.categoryId === "band-tee";
    if (collection.slug === "skate") return collection.brandNames.includes(brand);
    if (collection.slug === "streetwear") return collection.brandNames.includes(brand);
    return product.categoryId === "designer-archive" || collection.brandNames.includes(brand);
  });
};


const getProductImages = (product: Product, submissions: CommunitySubmission[] = communitySubmissions) => getProductImageCollection(product, submissions).all;
const primaryProductImage = (product: Product) => getProductImageCollection(product).mainImage;

const categoryRoute = (categoryId: CategoryId) => (categoryId === "designer-archive" ? "designer" : categoryId);
const normalizeCategorySlug = (slug: string) => (slug === "designer" ? "designer-archive" : slug);

const scrollToPageTop = () => {
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }));
};

const currency = (value: number) => `$${value.toLocaleString()}`;
const percent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

function App() {
  const [view, setView] = useState<View>(parseHash);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useLocalIds("archive-index-favorites");
  const [watchlist, setWatchlist] = useLocalIds("archive-index-watchlist");
  const [recent, setRecent] = useLocalIds("archive-index-recent");
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>(communitySubmissions);

  useEffect(() => {
    const onHash = () => {
      setView(parseHash());
      scrollToPageTop();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (path: string) => {
    const nextHash = path === "/" ? "" : path;
    if (window.location.hash === `#${nextHash}` || (!nextHash && !window.location.hash)) {
      setView(parseHash());
      scrollToPageTop();
      return;
    }
    window.location.hash = nextHash;
  };

  const openProduct = (product: Product) => {
    setRecent([product.id, ...recent.filter((id) => id !== product.id)].slice(0, 8));
    navigate(`/product/${product.slug}`);
  };

  const sharedProps = { navigate, openProduct, favorites, setFavorites, watchlist, setWatchlist };

  return (
    <div className="app-shell">
      <Header query={query} setQuery={setQuery} navigate={navigate} />
      <main>
        {view.page === "home" && <HomePage {...sharedProps} recent={recent} query={query} setQuery={setQuery} />}
        {view.page === "search" && <SearchPage {...sharedProps} query={query} setQuery={setQuery} />}
        {view.page === "archive" && <ArchivePage {...sharedProps} />}
        {view.page === "category" && <CategoryPage {...sharedProps} slug={view.slug} />}
        {view.page === "brand" && <BrandPage {...sharedProps} slug={view.slug} />}
        {view.page === "tag" && <TagPage {...sharedProps} slug={view.slug} />}
        {view.page === "product" && <ProductPage {...sharedProps} slug={view.slug} submissions={submissions} />}
        {view.page === "submit" && <ContributionPage navigate={navigate} submissions={submissions} setSubmissions={setSubmissions} />}
        {view.page === "admin" && <AdminPage submissions={submissions} setSubmissions={setSubmissions} />}
        {view.page === "rare" && <RareRequestsPage navigate={navigate} />}
        {view.page === "generator" && <ContentGeneratorPage openProduct={openProduct} />}
        {view.page === "copyright" && <CopyrightPage />}
        {view.page === "about" && <AboutPage />}
      </main>
      <Footer />
    </div>
  );
}

function useLocalIds(key: string): [string[], (ids: string[]) => void] {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const update = (next: string[]) => {
    setIds(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [ids, update];
}

function Header({ query, setQuery, navigate }: { query: string; setQuery: (value: string) => void; navigate: (path: string) => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuItems = [
    { label: "사이트 소개", path: "/about" },
    { label: "아카이브 제보", path: "/submit" },
    { label: "태그 제보", path: "/submit" },
    { label: "문의하기", path: "/copyright" },
  ];

  const openMenuItem = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const submitDrawerSearch = (event: FormEvent) => {
    event.preventDefault();
    setDrawerOpen(false);
    navigate("/search");
  };

  return (
    <header className="topbar archive-header">
      <button className="brand-mark" onClick={() => navigate("/")} aria-label="Archive Index home">
        <strong>ARCHIVE INDEX</strong>
      </button>
      <button className="menu-button" onClick={() => setDrawerOpen(true)} aria-label="메뉴 열기" aria-expanded={drawerOpen}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      {drawerOpen && <button className="drawer-scrim" aria-label="메뉴 닫기" onClick={() => setDrawerOpen(false)} />}
      <aside className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <strong>ARCHIVE INDEX</strong>
          <button onClick={() => setDrawerOpen(false)} aria-label="메뉴 닫기">닫기</button>
        </div>
        <form className="drawer-search" onSubmit={submitDrawerSearch}>
          <p className="eyebrow">Search Archive</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="브랜드, 태그, 연도, 국가, 제품명 검색"
          />
          <small>예시: Levi's / M-65 / Brockum / Raf Simons / Stussy / 1992</small>
        </form>
        <nav className="drawer-menu" aria-label="사이트 메뉴">
          {menuItems.map((item) => (
            <button key={item.label} onClick={() => openMenuItem(item.path)}>{item.label}</button>
          ))}
        </nav>
      </aside>
    </header>
  );
}

function HomePage(props: SharedProps & { recent: string[]; query: string; setQuery: (value: string) => void }) {
  const featuredNames = ["Alien Workshop", "Nirvana", "Raf Simons", "Stussy", "Metallica"];
  const featuredArchive = featuredNames
    .map((name) => validProducts.find((product) => product.name.includes(name) || getBrand(product.brandId)?.name === name))
    .filter(Boolean) as Product[];
  const fallbackFeatured = featuredArchive.length >= 5 ? featuredArchive : [...featuredArchive, ...newestValidAdditions()].slice(0, 5);
  const latestArchive = newestValidAdditions().slice(0, 8);
  const brandWallNames = ["Stussy", "Alien Workshop", "Raf Simons", "Pink Floyd", "Metallica", "Helmut Lang", "Supreme", "A Bathing Ape", "Undercover", "Number (N)ine"];
  const brandWall = brandWallNames.map((name) => visibleBrands.find((brand) => brand.name === name)).filter(Boolean) as typeof brands;
  const researchNotes = [
    "1990s Single Stitch Band Tee Tag Study",
    "Skate Graphics and Board Culture Index",
    "Raf Simons Youth Culture References",
    "Stussy Tribe and Early Streetwear Networks",
  ];

  return (
    <section className="home-exhibition">
      <section className="exhibition-hero">
        <div className="hero-archive-backdrop" aria-hidden="true">
          {fallbackFeatured.slice(0, 5).map((product, index) => <ArchiveVisual key={product.id} product={product} variant={`v${index + 1}`} />)}
        </div>
        <div className="exhibition-hero-copy">
          <p className="eyebrow">Music / Skateboarding / Streetwear / Fashion</p>
          <h1>ARCHIVE INDEX</h1>
          <h2>A Cultural Archive of Vintage Clothing and Subculture</h2>
          <div className="hero-actions">
            <button className="gold-button" onClick={() => props.navigate("/archive")}>ENTER ARCHIVE</button>
            <button className="ghost-button" onClick={() => props.navigate("/search")}>SEARCH ARCHIVE</button>
          </div>
        </div>
      </section>

      <section className="exhibition-section">
        <SectionTitle eyebrow="Featured Archive" title="대표 아카이브" />
        <div className="featured-archive-grid">
          {fallbackFeatured.map((product) => <FeaturedArchiveCard key={product.id} product={product} openProduct={props.openProduct} />)}
        </div>
      </section>

      <section className="exhibition-section">
        <SectionTitle eyebrow="Category Archive" title="문화별 아카이브" />
        <div className="culture-card-grid">
          {cultureCollections.map((collection) => {
            const collectionProducts = productsForCultureCollection(collection.slug);
            return <CultureArchiveCard key={collection.slug} collection={collection} products={collectionProducts} navigate={props.navigate} />;
          })}
        </div>
      </section>

      <section className="exhibition-section">
        <SectionTitle eyebrow="Brand Wall" title="주요 브랜드 / 밴드" />
        <div className="brand-wall-grid">
          {brandWall.map((brand) => <BrandWallCard key={brand.id} brand={brand} navigate={props.navigate} />)}
        </div>
      </section>

      <section className="exhibition-section latest-and-research">
        <div>
          <SectionTitle eyebrow="Latest Additions" title="최근 추가된 아카이브" />
          <div className="latest-archive-list">
            {latestArchive.map((product) => <button key={product.id} onClick={() => props.openProduct(product)}><span>{product.name}</span><small>{getBrand(product.brandId)?.name} / {product.releaseYear}</small></button>)}
          </div>
        </div>
        <div>
          <SectionTitle eyebrow="Research Notes" title="최근 연구 자료" />
          <div className="latest-archive-list research-list">
            {researchNotes.map((note) => <button key={note} onClick={() => props.navigate("/archive")}><span>{note}</span><small>Archive study</small></button>)}
          </div>
        </div>
      </section>
    </section>
  );
}

function FeaturedArchiveCard({ product, openProduct }: { product: Product; openProduct: (product: Product) => void }) {
  const image = primaryProductImage(product);
  return (
    <button className="featured-archive-card" onClick={() => openProduct(product)}>
      {image ? <ProductImageView image={image} product={product} compact /> : <ArchiveVisual product={product} />}
      <span>{product.releaseYear}</span>
      <strong>{product.name}</strong>
    </button>
  );
}

function CultureArchiveCard({ collection, products, navigate }: { collection: (typeof cultureCollections)[number]; products: Product[]; navigate: (path: string) => void }) {
  const preview = products.slice(0, 3);
  return (
    <button className="culture-archive-card" onClick={() => navigate(`/category/${collection.slug}`)}>
      <div className="culture-visual-stack">{preview.map((product, index) => <ArchiveVisual key={product.id} product={product} variant={`stack-${index}`} />)}</div>
      <strong>{collection.name}</strong>
      <span>{collection.brandNames.slice(0, 3).join(" / ")}</span>
    </button>
  );
}

function BrandWallCard({ brand, navigate }: { brand: (typeof brands)[number]; navigate: (path: string) => void }) {
  const product = validProducts.find((item) => item.brandId === brand.id);
  return (
    <button className="brand-wall-card" onClick={() => navigate(`/brand/${brand.slug}`)}>
      {product ? <ArchiveVisual product={product} /> : <div className="archive-visual blank" />}
      <strong>{brand.name}</strong>
    </button>
  );
}

function ArchivePage(props: SharedProps) {
  const latestArchive = newestValidAdditions().slice(0, 12);
  return (
    <section className="page-stack archive-page">
      <PageHero eyebrow="Archive" title="아카이브 둘러보기" description="카테고리별 역사, 태그, 생산 배경, 시장 데이터를 탐색하세요." />
      <section className="panel category-nav-section">
        <SectionTitle eyebrow="Categories" title="카테고리" />
        <div className="category-grid category-nav-grid">
          {cultureCollections.map((collection) => (
            <button className="category-card panel" key={collection.slug} onClick={() => props.navigate(`/category/${collection.slug}`)}>
              <span className="eyebrow">{productsForCultureCollection(collection.slug).length.toLocaleString()} verified references</span>
              <h2>{collection.name}</h2>
              <p>{collection.description}</p>
            </button>
          ))}
        </div>
      </section>
      <ProductRail title="최근 추가된 아카이브" products={latestArchive} {...props} />
    </section>
  );
}

interface SharedProps {
  navigate: (path: string) => void;
  openProduct: (product: Product) => void;
  favorites: string[];
  setFavorites: (ids: string[]) => void;
  watchlist: string[];
  setWatchlist: (ids: string[]) => void;
}


function TagPage(props: SharedProps & { slug: string }) {
  const tag = tagBySlug(props.slug);
  const relatedProducts = tag ? productsForTag(tag.id) : [];
  return (
    <section className="page-stack tag-page">
      <PageHero eyebrow={tag?.group ?? "Tag"} title={tag ? tag.label : "태그를 찾을 수 없습니다"} description={tag?.description ?? "해당 태그와 연결된 아카이브 데이터가 없습니다."} />
      {tag && (
        <section className="panel">
          <div className="section-head"><SectionTitle eyebrow="Related Products" title={`관련 제품 ${relatedProducts.length.toLocaleString()}개`} /></div>
          <div className="tag-context-card"><strong>{tag.group}</strong><p>{tag.description}</p></div>
          <TagRelationshipSummary products={relatedProducts} navigate={props.navigate} />
          <div className="product-grid">{relatedProducts.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
        </section>
      )}
    </section>
  );
}


function TagRelationshipSummary({ products, navigate }: { products: Product[]; navigate: (path: string) => void }) {
  const relatedBrands = Array.from(new Map(products.map((product) => getBrand(product.brandId)).filter(Boolean).map((brand) => [brand!.id, brand!])).values()).slice(0, 8);
  const relatedEras = Array.from(new Set(products.map((product) => eraLabel(product.releaseYear)))).slice(0, 6);
  return (
    <div className="tag-relationship-summary">
      <div><p className="eyebrow">Related Brands</p>{relatedBrands.map((brand) => <button key={brand.id} onClick={() => navigate(`/brand/${brand.slug}`)}>{brand.name}</button>)}</div>
      <div><p className="eyebrow">Related Eras</p>{relatedEras.map((era) => <span key={era}>{era}</span>)}</div>
    </div>
  );
}

function ProductTagList({ product, navigate, limit }: { product: Product; navigate: (path: string) => void; limit?: number }) {
  const productTags = generateProductTags(product).slice(0, limit ?? 20);
  if (!productTags.length) return null;
  return (
    <div className="product-tag-list">
      {productTags.map((tag) => <button key={tag.id} onClick={() => navigate(`/tag/${tag.id}`)}>#{tag.label}</button>)}
    </div>
  );
}

function BrandTagCloud({ products, navigate }: { products: Product[]; navigate: (path: string) => void }) {
  const tagsForBrand = Array.from(new Map(products.flatMap(generateProductTags).map((tag) => [tag.id, tag])).values()).slice(0, 12);
  if (!tagsForBrand.length) return <p className="empty-state">연결된 태그를 준비 중입니다.</p>;
  return <div className="tag-cloud brand-tag-cloud">{tagsForBrand.map((tag) => <button key={tag.id} onClick={() => navigate(`/tag/${tag.id}`)}>#{tag.label}<small>{tag.group}</small></button>)}</div>;
}

function SearchPage(props: SharedProps & { query: string; setQuery: (value: string) => void }) {
  const [category, setCategory] = useState("All");
  const [year, setYear] = useState("All");
  const [country, setCountry] = useState("All");
  const results = useMemo(() => {
    return searchValidArchive(props.query).filter((product) => {
      const categoryPass = category === "All" || product.categoryId === category;
      const yearPass = year === "All" || String(product.releaseYear).startsWith(year);
      const countryPass = country === "All" || product.country === country;
      return categoryPass && yearPass && countryPass;
    });
  }, [props.query, category, year, country]);

  return (
    <section className="page-stack">
      <PageHero eyebrow="통합 검색" title="브랜드, 태그, 연도, 카테고리, 국가, 제품명, 레퍼런스 번호로 아카이브를 검색하세요." />
      <div className="panel filter-panel">
        <input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="예: Nirvana, Carhartt, 1994, Japan, single stitch, AI-BAN..." />
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">전체</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={year} onChange={(event) => setYear(event.target.value)}><option value="All">전체</option>{["194", "195", "196", "197", "198", "199", "200"].map((item) => <option key={item}>{item}0년대</option>)}</select>
        <select value={country} onChange={(event) => setCountry(event.target.value)}><option value="All">전체</option>{Array.from(new Set(validProducts.map((item) => item.country))).map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="section-head product-rail-head"><SectionTitle eyebrow="Search Results" title={`${results.length}개 검색 결과`} /></div><div className="product-grid">{results.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
    </section>
  );
}

function CategoryPage(props: SharedProps & { slug: string }) {
  const collection = cultureCollectionBySlug(props.slug);
  const category = collection ? getCategory(collection.categoryId)! : getCategoryBySlug(normalizeCategorySlug(props.slug)) ?? categories[0];
  const categoryProducts = collection ? productsForCultureCollection(collection.slug) : validProducts.filter((product) => product.categoryId === category.id);
  const categoryBrands = collection ? brands.filter((brand) => collection.brandNames.includes(brand.name) && categoryProducts.some((product) => product.brandId === brand.id)) : brands.filter((brand) => brand.categoryId === category.id);
  const [sort, setSort] = useState<SortOption>("Rarity");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ brand: "All", year: "All", country: "All", condition: "All", marketplace: "All", price: "All" });
  const pageSize = 30;
  const totalPages = 10;
  const filtered = useMemo(() => {
    const priceRanges: Record<string, (price: number) => boolean> = {
      All: () => true,
      "Under $250": (price) => price < 250,
      "$250-$750": (price) => price >= 250 && price <= 750,
      "$750+": (price) => price > 750,
    };
    return categoryProducts
      .filter((product) => filters.brand === "All" || product.brandId === filters.brand)
      .filter((product) => filters.year === "All" || String(product.releaseYear).startsWith(filters.year))
      .filter((product) => filters.country === "All" || product.country === filters.country)
      .filter((product) => filters.condition === "All" || product.condition === filters.condition)
      .filter((product) => filters.marketplace === "All" || product.marketplaceLinks[filters.marketplace as Marketplace])
      .filter((product) => priceRanges[filters.price](product.marketPrice))
      .sort((a, b) => {
        if (sort === "Year") return b.releaseYear - a.releaseYear;
        if (sort === "Price") return b.marketPrice - a.marketPrice;
        if (sort === "Popularity") return b.popularity - a.popularity;
        return b.rarityScore - a.rarityScore;
      });
  }, [categoryProducts, filters, sort]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const representativeItems = categoryProducts.slice().sort((a, b) => b.rarityScore - a.rarityScore).slice(0, 6);
  const relatedArchive = newestValidAdditions(category.id);
  const events = categoryHistoricalEvents(collection?.categoryId ?? category.id);
  const summary = summarizeMarket(validTransactions.filter((sale) => getProduct(sale.productId)?.categoryId === category.id));

  return (
    <section className="page-stack category-redesign">
      <PageHero eyebrow="Culture Archive" title={collection?.name ?? category.name} description={collection?.description ?? category.description} />

      <section className="panel category-intro-card">
        <SectionTitle eyebrow="문화 아카이브" title={`${collection?.shortName ?? category.name} 컬렉션`} />
        <div className="split-grid intro-grid">
          <InfoPanel title="역사적 의미" text={category.historicalSignificance} />
          <InfoPanel title="문화적 영향" text={category.culturalInfluence} />
        </div>
      </section>

      <ProductRail title="대표 아이템" products={representativeItems} {...props} />

      <section className="panel">
        <SectionTitle eyebrow="대표 브랜드" title="중요 제작사와 문화적 기준점" />
        <div className="brand-grid brand-grid-detailed">
          {categoryBrands.map((brand) => (
            <button key={brand.id} onClick={() => props.navigate(`/brand/${brand.slug}`)}>
              <strong>{brand.name}</strong>
              <span>{brand.foundingYear} / {brand.country}</span>
              <p>{brandSummary(brand.name, category.id)}</p>
            </button>
          ))}
        </div>
      </section>

      <Timeline events={events} />

      <section className="panel">
        <SectionTitle eyebrow="시장 데이터" title="카테고리 유동성과 가격 인텔리전스" />
        <div className="stat-grid compact"><Stat label="중앙값" value={currency(summary.median)} /><Stat label="평균" value={currency(summary.average)} /><Stat label="최고 거래가" value={currency(summary.highest)} /><Stat label="최저 거래가" value={currency(summary.lowest)} /><Stat label="거래액" value={currency(summary.salesVolume)} /><Stat label="거래 수" value={summary.transactionCount.toLocaleString()} /><Stat label="변동성" value={String(summary.volatility)} /><Stat label="스프레드" value={`${summary.spread}%`} /></div>
      </section>

      <ProductRail title="관련 아카이브" products={relatedArchive} {...props} />

      <section className="panel">
        <div className="section-head"><div><p className="eyebrow">제품 아카이브</p><h2>{categoryProducts.length.toLocaleString()}개의 인덱스 레퍼런스</h2><p>리서치와 비교에 최적화된 10페이지, 페이지당 30개 제품을 표시합니다.</p></div><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>{[{ value: "Year", label: "연도" }, { value: "Price", label: "가격" }, { value: "Popularity", label: "인기도" }, { value: "Rarity", label: "희귀도" }].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <FilterControls filters={filters} setFilters={setFilters} brands={categoryBrands} />
        <div className="product-grid dense">{visible.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </section>
    </section>
  );
}

function BrandPage(props: SharedProps & { slug: string }) {
  const brand = getBrandBySlug(props.slug) ?? brands[0];
  const brandProducts = validProducts.filter((product) => product.brandId === brand.id);
  const brandTags = tags.filter((tag) => tag.brandId === brand.id && validProductIds.has(tag.productId));
  const summary = summarizeMarket(validTransactions.filter((sale) => getProduct(sale.productId)?.brandId === brand.id));
  const profile = brandArchiveProfile(brand.name, brand.categoryId, brand.foundingYear, brand.country);
  const representativeProducts = representativeBrandProducts(brand.name, brandProducts);

  return (
    <section className="page-stack brand-page-redesign">
      <PageHero eyebrow={`${brand.country} / 설립 ${brand.foundingYear}년`} title={brand.name} description={profile.description} />
      <section className="split-grid">
        <div className="panel brand-history-card">
          <SectionTitle eyebrow="Brand History" title="브랜드 소개" />
          <p>{profile.history}</p>
        </div>
        <div className="panel">
          <SectionTitle eyebrow="제조 국가" title="생산 지역" />
          <div className="pill-row">{brand.manufacturingCountries.map((country) => <span key={country}>{country}</span>)}</div>
          <p>{getCategory(brand.categoryId)?.marketNarrative}</p>
        </div>
      </section>

      <BrandTimeline events={profile.timeline} />
      {brand.categoryId === "band-tee" && <BandCulturePanel bandName={brand.name} />}

      <section className="panel">
        <SectionTitle eyebrow="주요 태그" title={`${brand.name} 연결 태그`} />
        <BrandTagCloud products={brandProducts} navigate={props.navigate} />
      </section>

      <section className="panel">
        <SectionTitle eyebrow="대표 아카이브" title={`${brand.name} 주요 레퍼런스`} />
        <div className="representative-archive-list">
          {representativeProducts.map((item) => {
            const matched = brandProducts.find((product) => product.name.toLowerCase().includes(item.toLowerCase().split(" ")[0])) ?? brandProducts[0];
            return (
              <button key={item} onClick={() => matched && props.openProduct(matched)}>
                <strong>{item}</strong>
                <span>{matched ? `${matched.releaseYear} / Archive Score ${matched.archiveScore}` : "레퍼런스 준비 중"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="태그 변화" title="라벨 연대 구간" />{brand.tagEvolution.map((item) => <p className="note" key={item}>{item}</p>)}</div>
        <div className="panel"><SectionTitle eyebrow="인증 가이드" title="확인해야 할 요소" /><ul className="check-list">{brand.authenticationGuide.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>
      <section className="panel"><SectionTitle eyebrow="가격 추세" title="브랜드 마켓 요약" /><div className="stat-grid compact"><Stat label="중앙값" value={currency(summary.median)} /><Stat label="평균" value={currency(summary.average)} /><Stat label="최고 거래가" value={currency(summary.highest)} /><Stat label="유동성" value={liquidityLabel(summary.liquidity)} /></div></section>
      <section className="panel"><SectionTitle eyebrow="태그 아카이브" title="라벨 기록" /><div className="tag-grid">{brandTags.map((tag) => <TagCard key={tag.id} tagId={tag.id} />)}</div></section>
      <ProductRail title="브랜드 관련 제품" products={brandProducts.slice(0, 12)} {...props} />
    </section>
  );
}

function ProductPage(props: SharedProps & { slug: string; submissions: CommunitySubmission[] }) {
  const product = validProducts.find((item) => item.slug === props.slug);
  if (!product) return <PageHero eyebrow="Product" title="제품을 찾을 수 없습니다" description="제품명, 브랜드, 연도 정보가 확인된 제품만 아카이브에 등록됩니다." />;
  const brand = getBrand(product.brandId)!;
  const category = getCategory(product.categoryId)!;
  const tag = getTag(product.tagId)!;
  const sales = productTransactions(product.id);
  const summary = summarizeMarket(sales);
  const comparison = marketplaceComparison(sales);
  const transactionPoints = sales.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const analysis = aiMarketAnalysis(product);
  const examples = props.submissions.filter((submission) => submission.productId === product.id && submission.status === "Approved");
  const related = validProducts.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 8);
  const productImages = getProductImages(product, props.submissions);

  return (
    <section className="page-stack">
      <div className="product-layout product-gallery-layout">
        <div className="panel sticky-panel gallery-panel">{productImages.length > 0 ? <ProductGallery product={product} images={productImages} /> : <ProductImageStatusPanel product={product} />}</div>
        <div className="product-main panel">
          <p className="eyebrow">{category.name} / {product.referenceNumber}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="stat-grid compact"><Stat label="출시/생산 연도" value={String(product.releaseYear)} /><Stat label="문화 카테고리" value={category.name} /><Stat label="브랜드 / 밴드" value={brand.name} /><Stat label="희귀도" value={`${product.rarityScore}/100`} /><Stat label="Archive Score" value={`${product.archiveScore}/100`} /><Stat label="Image Status" value={getProductImageCollection(product).imageStatus} /></div>
          <ProductTagList product={product} navigate={props.navigate} />
          <div className="two-column-copy"><InfoPanel title="역사적 의미" text={product.historicalSignificance} /><InfoPanel title="Cultural impact" text={product.culturalImpact} /><InfoPanel title="생산 디테일" text={product.productionDetails} /><InfoPanel title="Known variants" text={product.knownVariants.join(". ")} /></div>
        </div>
      </div>


      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="AI 마켓 분석" title="빈티지 특화 분석 근거" />{Object.entries(analysis).map(([key, value]) => <p className="analysis-line" key={key}><strong>{labelize(key)}:</strong> {String(value)}</p>)}</div>
        <div className="panel"><SectionTitle eyebrow="인증 모듈" title="의류 증거 비교" /><ul className="check-list"><li>태그 비교: {tag.label}, {tag.yearStart}-{tag.yearEnd}, {tag.country}.</li><li>프린트 비교: 잉크 노화, 크랙 방향, 실크스크린 정렬, 바디 호환성을 확인합니다.</li><li>스티치 비교: {tag.stitchType}; 솔기 장력과 실 산화를 확인합니다.</li><li>제조국 비교: 케어라벨 문구, 라벨 언어, 당시 수입 규정을 대조합니다.</li><li>생산 시기 비교: 알려진 변형과 마켓 사례를 기준으로 검증합니다.</li></ul></div>
      </section>

      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="Historical Timeline" title="제품 맥락" /><ol className="compact-timeline">{productHistoricalTimeline(product, brand.name).map((event) => <li key={`${event.year}-${event.title}`}><time>{event.year}</time><strong>{event.title}</strong><p>{event.description}</p></li>)}</ol></div>
        <div className="panel"><SectionTitle eyebrow="Collector Notes" title="컬렉터 노트" /><ul className="check-list"><li>Primary image source: {productImages[0]?.source}</li><li>Archive Score {product.archiveScore}/100 - 연도, 태그, 생산국, 거래 이력, 출처 기반.</li><li>마켓플레이스 이미지는 저장하지 않고 텍스트 외부 링크만 제공합니다.</li></ul></div>
      </section>

      <section className="panel"><SectionTitle eyebrow="태그 정보" title={tag.label} /><div className="tag-grid"><TagCard tagId={tag.id} /></div></section>

      <section className="panel">
        <SectionTitle eyebrow="커뮤니티 사례" title="동일 아이템에 대한 승인된 컬렉터 제출 자료" />
        <div className="example-grid">{examples.length ? examples.map((example, index) => <CommunityExample key={example.id} example={example} index={index} />) : <p>아직 승인된 사례가 없습니다. 앞면, 뒷면, 태그, 봉제 디테일 사진을 제출해 이 레퍼런스 기록을 도와주세요.</p>}</div>
      </section>


      <section className="panel">
        <SectionTitle eyebrow="가격 히스토리" title="실거래 기반 가격 기록" />
        {transactionPoints.length >= 5 ? (
          <TransactionScatterChart records={transactionPoints} />
        ) : (
          <RecentTransactionList records={transactionPoints} />
        )}
      </section>

      <section className="panel">
        <SectionTitle eyebrow="보조 시장 데이터" title="제품 기록을 보조하는 실거래 참고 정보" />
        <div className="stat-grid compact"><Stat label="중앙값 price" value={currency(summary.median)} /><Stat label="평균 price" value={currency(summary.average)} /><Stat label="최고 거래가" value={currency(summary.highest)} /><Stat label="최저 거래가" value={currency(summary.lowest)} /><Stat label="거래액" value={currency(summary.salesVolume)} /><Stat label="거래 수" value={summary.transactionCount.toString()} /><Stat label="변동성" value={String(summary.volatility)} /><Stat label="유동성" value={liquidityLabel(summary.liquidity)} /><Stat label="마켓 스프레드" value={`${summary.spread}%`} /></div>
        <div className="market-table">{comparison.map((row) => <div key={row.marketplace}><strong>{row.marketplace}</strong><span>{row.count}건 거래</span><span>{row.average ? currency(row.average) : "공개 비교 거래 없음"}</span></div>)}</div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="마켓플레이스 목록" title="텍스트 링크 전용 외부 레퍼런스" />
        <div className="link-grid">{marketplaces.slice(0, 8).map((marketplace) => <a key={marketplace} href={product.marketplaceLinks[marketplace]} target="_blank" rel="noreferrer">{marketplace}</a>)}<a href={`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">Pinterest 검색</a><a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">Google 이미지 검색</a></div>
      </section>
      <ProductRail title="관련 아이템" products={related} {...props} />
    </section>
  );
}

function ContributionPage({ navigate, submissions, setSubmissions }: { navigate: (path: string) => void; submissions: CommunitySubmission[]; setSubmissions: (items: CommunitySubmission[]) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(validProducts[0]?.id ?? "");
  const [rights, setRights] = useState(false);
  const [photos, setPhotos] = useState(["앞면", "뒷면"]);
  const product = validProducts.find((item) => item.id === selectedProduct);

  if (!product) return <PageHero eyebrow="Archive Submission" title="아카이브 제출" description="제품명, 브랜드, 연도 정보가 확인된 제품만 등록할 수 있습니다." />;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rights) return;
    const form = new FormData(event.currentTarget);
    const next: CommunitySubmission = {
      id: `local-${Date.now()}`,
      productId: selectedProduct,
      contributor: String(form.get("username") || "Community Member"),
      badge: "Contributor",
      profileUrl: "#/profile/community-member",
      contributionDate: new Date().toISOString().slice(0, 10),
      status: "Pending Review",
      photos,
      year: Number(form.get("year") || product.releaseYear),
      country: String(form.get("country") || product.country),
      tagType: String(form.get("tagType") || "Unspecified"),
      authenticationNotes: String(form.get("authNotes") || "Pending curator review."),
      rightsAgreementAt: new Date().toISOString(),
    };
    setSubmissions([next, ...submissions]);
    setSubmitted(true);
  };

  return (
    <section className="page-stack">
      <PageHero eyebrow="Archive Submission" title="아카이브 제출" />
      {submitted && <div className="success-banner panel"><strong>제출이 접수되었습니다.</strong> 상태: 검토 대기. 큐레이터는 승인 전 추가 사진 요청, 중복 병합, 메타데이터 수정을 할 수 있습니다.</div>}
      <form className="panel form-grid" onSubmit={submit}>
        <label>Category<select name="category" defaultValue={product.categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>관련 제품<select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>{validProducts.slice(0, 250).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Brand<input name="brand" defaultValue={getBrand(product.brandId)?.name} /></label>
        <label>제품명<input name="productName" defaultValue={product.name} /></label>
        <label>생산 연도<input name="year" type="number" defaultValue={product.releaseYear} /></label>
        <label>제조 국가<input name="country" defaultValue={product.country} /></label>
        <label>태그 정보<input name="tagInfo" defaultValue={getTag(product.tagId)?.label} /></label>
        <label>상태<select name="condition"><option>Deadstock</option><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option><option>Distressed</option></select></label>
        <label>사이즈<input name="size" defaultValue={product.size} /></label>
        <label>태그 유형<input name="tagType" placeholder="Single stitch / double stitch / woven label" /></label>
        <label>제조국<input name="madeIn" defaultValue={product.country} /></label>
        <label>알려진 변형<input name="variants" defaultValue={product.knownVariants.join(", ")} /></label>
        <label>실측<input name="measurements" placeholder="가슴 단면, 총장, 어깨, 소매" /></label>
        <label className="wide">인증 메모<textarea name="authNotes" placeholder="태그, 봉제, 프린트, 국가, 생산 시기, 가품 지표를 입력하세요." /></label>
        <label className="wide">Notes<textarea name="notes" placeholder="소유 이력, 출처, 수선, 페이드, 디스트레싱, 구조 디테일." /></label>
        <div className="wide upload-zone"><strong>사진을 드래그 앤 드롭</strong><p>필수: 앞면, 뒷면. 선택: 태그 사진, 봉제 디테일, 프린트 디테일, 케어라벨, 공장 라벨, 패키징. 최대 20장.</p><div className="photo-options">{["앞면", "뒷면", "태그 사진", "봉제 디테일", "프린트 디테일", "케어라벨", "공장 라벨", "패키징"].map((photo) => <label key={photo}><input type="checkbox" checked={photos.includes(photo)} disabled={["앞면", "뒷면"].includes(photo)} onChange={(event) => setPhotos(event.target.checked ? [...photos, photo] : photos.filter((item) => item !== photo))} />{photo}</label>)}</div></div>
        <label className="wide checkbox-line"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} /> 본인이 해당 사진의 권리를 보유했거나 업로드 허가를 받았음을 확인합니다.</label>
        <div className="wide form-actions"><button className="gold-button" disabled={!rights}>검토 대기로 제출</button><button type="button" className="ghost-button" onClick={() => navigate("/copyright")}>사진 권리 정책</button></div>
      </form>
    </section>
  );
}

function AdminPage({ submissions, setSubmissions }: { submissions: CommunitySubmission[]; setSubmissions: (items: CommunitySubmission[]) => void }) {
  const updateStatus = (id: string, status: SubmissionStatus) => setSubmissions(submissions.map((item) => item.id === id ? { ...item, status } : item));
  const imageQueue = submissions.slice(0, 12).map((submission) => {
    const product = validProducts.find((item) => item.id === submission.productId) ?? products.find((item) => item.id === submission.productId)!;
    return { submission, product, images: getProductImages(product, [submission]) };
  });

  return (
    <section className="page-stack">
      <PageHero eyebrow="아카이브 검토 패널" title="공개 전 커뮤니티 제출 자료를 검토합니다." description="관리자는 승인, 거절, 추가 사진 요청, 중복 항목 병합, 메타데이터 수정을 할 수 있습니다." />
      <section className="panel admin-image-panel">
        <SectionTitle eyebrow="Image Admin" title="제품 이미지 관리" />
        <div className="admin-image-actions"><button>Upload Images</button><button>Replace Images</button><button>Approve Community Photos</button><button>Delete Images</button><button>Set Primary Image</button></div>
        <div className="admin-image-grid">
          {imageQueue.map(({ submission, product, images }) => (
            <article key={submission.id}>
              {images[0] ? <ProductImageView image={images[0]} product={product} compact /> : <ProductDefaultVisual product={product} compact />}
              <strong>{product.name}</strong>
              <span>{statusLabel(submission.status)} / {getProductImageCollection(product).imageStatus} / {images.length} verified photos</span>
              <div className="admin-inline-actions"><button onClick={() => updateStatus(submission.id, "Approved")}>Approve</button><button onClick={() => updateStatus(submission.id, "Rejected")}>Delete</button><button onClick={() => updateStatus(submission.id, "Flagged")}>Request Replace</button></div>
            </article>
          ))}
        </div>
      </section>
      <div className="review-list">{submissions.slice(0, 24).map((submission) => { const product = validProducts.find((item) => item.id === submission.productId) ?? products.find((item) => item.id === submission.productId)!; return <div className="panel review-card" key={submission.id}><div><p className="eyebrow">{statusLabel(submission.status)}</p><h3>{product.name}</h3><p>기여자: {submission.contributor} / {submission.contributionDate}. 권리 동의: {submission.rightsAgreementAt}</p><p>{submission.authenticationNotes}</p></div><div className="review-actions"><button onClick={() => updateStatus(submission.id, "Approved")}>승인</button><button onClick={() => updateStatus(submission.id, "Rejected")}>거절</button><button onClick={() => updateStatus(submission.id, "Flagged")}>추가 사진 요청</button><button>중복 항목 병합</button><button>메타데이터 수정</button></div></div>; })}</div>
    </section>
  );
}

function RareRequestsPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="page-stack">
      <PageHero eyebrow="희귀 아이템 요청 시스템" title="누락된 아카이브 아이템을 요청하고 검증된 기여자에게 포인트를 보상합니다." action={<button className="gold-button" onClick={() => navigate("/submit")}>검증 사례 업로드</button>} />
      <div className="request-grid">{rareItemRequests.map((request) => <div className="panel" key={request.id}><p className="eyebrow">찾는 중</p><h2>{request.title}</h2><p>{request.notes}</p><div className="metric-row"><span>브랜드</span><strong>{request.brand}</strong></div><div className="metric-row"><span>카테고리</span><strong>{getCategory(request.categoryId)?.name}</strong></div><div className="metric-row"><span>보상</span><strong>{request.rewardPoints} pts</strong></div><button className="gold-button" onClick={() => navigate("/submit")}>사례 기여하기</button></div>)}</div>
    </section>
  );
}

function ContentGeneratorPage({ openProduct }: { openProduct: (product: Product) => void }) {
  const [productId, setProductId] = useState(validProducts[0]?.id ?? "");
  const [format, setFormat] = useState("인스타그램 캐러셀");
  const product = validProducts.find((item) => item.id === productId);
  if (!product) return <PageHero eyebrow="콘텐츠 생성기" title="생성 가능한 아카이브 제품이 없습니다" description="제품명, 브랜드, 연도 정보가 확인된 제품이 등록되면 콘텐츠를 생성할 수 있습니다." />;
  const brand = getBrand(product.brandId)!;
  const tag = getTag(product.tagId)!;
  const summary = summarizeMarket(productTransactions(product.id));
  const slides = [
    { title: "커버", body: `${product.name} / ${brand.name} / ${product.releaseYear}` },
    { title: "역사적 의미", body: product.historicalSignificance },
    { title: "태그 정보", body: `${tag.label}. ${tag.stitchType}. ${tag.country} 생산.` },
    { title: "마켓 가격 history", body: `중앙값 ${currency(summary.median)}, 평균 ${currency(summary.average)}, 스프레드 ${summary.spread}%.` },
    { title: "인증 가이드", body: tag.authenticationNotes },
    { title: "Rarity score", body: `${product.rarityScore}/100 - 생산 연대, 거래 빈도, 생존 개체, 수요 기반.` },
    { title: "콜 투 액션", body: "오리지널 사진과 태그 디테일을 Archive Index에 기여하세요." },
  ];
  return (
    <section className="page-stack">
      <PageHero eyebrow="콘텐츠 생성기" title="아카이브 데이터에서 소셜 콘텐츠와 리서치 산출물을 바로 생성합니다." description="지원 형식: 인스타그램 캐러셀, 인스타그램 스토리, 마켓 리포트, 브랜드 스포트라이트, 태그 아카이브 시리즈." />
      <div className="panel filter-panel"><select value={productId} onChange={(event) => setProductId(event.target.value)}>{validProducts.slice(0, 300).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select value={format} onChange={(event) => setFormat(event.target.value)}>{["인스타그램 캐러셀", "인스타그램 스토리", "마켓 리포트", "브랜드 스포트라이트", "태그 아카이브 시리즈"].map((item) => <option key={item}>{item}</option>)}</select><button className="ghost-button" onClick={() => openProduct(product)}>제품 페이지 열기</button></div>
      <div className="slide-grid">{slides.map((slide, index) => <article className="slide-card" key={slide.title}><span>슬라이드 {index + 1}</span><h3>{slide.title}</h3><p>{slide.body}</p></article>)}</div>
      <div className="panel export-panel"><strong>{format} 내보내기</strong><p>내보내기 옵션: PNG, PDF, Canva 호환 형식.</p><div className="hero-actions"><button className="gold-button">PNG 내보내기</button><button className="ghost-button">PDF 내보내기</button><button className="ghost-button">Canva 호환</button></div></div>
    </section>
  );
}


function AboutPage() {
  return (
    <section className="page-stack about-page">
      <section className="panel about-card">
        <p className="eyebrow">About</p>
        <h1>ARCHIVE INDEX</h1>
        <p>ARCHIVE INDEX는 단순한 판매 플랫폼이 아닙니다.</p>
        <p>우리는 빈티지 의류와 서브컬처의 역사, 생산 배경, 태그, 시장 데이터를 기록하는 오픈 아카이브를 구축합니다.</p>
        <p>수집보다 기록을, 소유보다 보존을, 유행보다 역사성을 중요하게 생각합니다.</p>
        <p>우리의 목표는 밀리터리, 워크웨어, 밴드 티셔츠, 스트리트웨어, 디자이너 아카이브를 장기적으로 축적하여 연구 가능한 데이터베이스를 만드는 것입니다.</p>
        <ul>
          <li>역사적 배경</li>
          <li>생산 정보</li>
          <li>태그와 디테일</li>
          <li>문화적 영향</li>
          <li>시장 데이터</li>
        </ul>
      </section>
    </section>
  );
}

function CopyrightPage() {
  return (
    <section className="page-stack">
      <PageHero eyebrow="저작권 정책" title="Archive Index는 이미지 저장소가 아니라 역사 데이터베이스입니다." description="마켓플레이스 이미지는 로컬에 저장하지 않습니다. 마켓플레이스 목록은 텍스트 외부 링크로만 제공하며, 직접 촬영 이미지와 사용자 기여 이미지, 필요한 출처 표기를 우선합니다." />
      <form className="panel form-grid"><label>이름<input placeholder="권리자 또는 대리인" /></label><label>Email<input type="email" placeholder="name@example.com" /></label><label>제출물 또는 제품 URL<input placeholder="Archive Index 레퍼런스 URL" /></label><label className="wide">저작권 이슈<textarea placeholder="저작물, 권리 보유 여부, 요청 조치를 설명하세요." /></label><label className="wide checkbox-line"><input type="checkbox" /> 본 요청의 정보가 정확함을 확인합니다.</label><button className="gold-button">삭제 요청 제출</button></form>
    </section>
  );
}

function ProductRail({ title, products: railProducts, ...props }: SharedProps & { title: string; products: Product[] }) {
  return (
    <section className="panel product-rail">
      <div className="section-head product-rail-head">
        <SectionTitle eyebrow="Archive Index" title={title} />
      </div>
      <div className="product-grid">{railProducts.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
    </section>
  );
}

function ProductCard({ product, openProduct, favorites, setFavorites, watchlist, setWatchlist, navigate }: SharedProps & { product: Product }) {
  const brand = getBrand(product.brandId)!;
  const category = getCategory(product.categoryId)!;
  const image = primaryProductImage(product);
  const averagePrice = summarizeMarket(productTransactions(product.id)).average || product.marketPrice;
  const toggle = (list: string[], setter: (ids: string[]) => void) => setter(list.includes(product.id) ? list.filter((id) => id !== product.id) : [...list, product.id]);
  return (
    <article className="product-card image-product-card">
      <button className="image-button" onClick={() => openProduct(product)} aria-label={`${product.name} 상세 보기`}>
        {image ? <ProductImageView image={image} product={product} compact /> : <ProductDefaultVisual product={product} compact />}
      </button>
      <div className="product-card-body">
        <p className="eyebrow">{category.name}</p>
        <h3><button onClick={() => openProduct(product)}>{product.name}</button></h3>
        <p className="product-card-brand">{brand.name}</p>
        <div className="product-card-meta"><span>{product.releaseYear}</span><span>{currency(averagePrice)}</span></div>
        <div className="pill-row"><span>희귀도 {product.rarityScore}</span><span>Archive Score {product.archiveScore}</span></div><ProductTagList product={product} navigate={navigate} limit={5} />
        <div className="card-actions"><button onClick={() => toggle(favorites, setFavorites)}>{favorites.includes(product.id) ? "즐겨찾기됨" : "즐겨찾기"}</button><button onClick={() => toggle(watchlist, setWatchlist)}>{watchlist.includes(product.id) ? "추적 중" : "관심추적"}</button></div>
      </div>
    </article>
  );
}




function ArchiveVisual({ product, variant = "default" }: { product: Product; variant?: string }) {
  const category = getCategory(product.categoryId)?.name ?? "Archive";
  const brand = getBrand(product.brandId)?.name ?? "Archive";
  return (
    <div className={`archive-visual ${variant}`} aria-label={`${brand} ${category} representative archive visual`}>
      <i></i>
      <b></b>
      <em></em>
    </div>
  );
}

function ProductImageStatusPanel({ product }: { product: Product }) {
  const collection = getProductImageCollection(product);
  return (
    <section className="image-status-panel">
      <ProductDefaultVisual product={product} />
      <div>
        <p className="eyebrow">Image Status</p>
        <h3>{collection.imageStatus}</h3>
        <p>이미지는 제품 등록과 분리되어 매일 재검색됩니다. 최대 30회까지 실제 제품 사진을 다시 찾습니다.</p>
        <div className="metric-row"><span>Retry</span><strong>{collection.retryCount}/30</strong></div>
        {collection.nextRetryAt && <div className="metric-row"><span>Next Retry</span><strong>{collection.nextRetryAt}</strong></div>}
      </div>
    </section>
  );
}

function ProductGallery({ product, images }: { product: Product; images: ProductImageRecord[] }) {
  const [activeType, setActiveType] = useState<ProductImageType | null>(images[0]?.type ?? null);
  const [zoomedImage, setZoomedImage] = useState<ProductImageRecord | null>(null);
  const availableTypes = Array.from(new Set(images.map((image) => image.type)));
  const visibleImages = activeType ? images.filter((image) => image.type === activeType) : images;
  const primary = visibleImages[0] ?? images[0];

  useEffect(() => {
    if (!activeType || !availableTypes.includes(activeType)) setActiveType(images[0]?.type ?? null);
  }, [activeType, availableTypes, images]);

  if (!images.length || !primary) return null;

  return (
    <section className="product-gallery" aria-label={`${product.name} image gallery`}>
      {availableTypes.length > 1 && (
        <div className="gallery-tabs" role="tablist">
          {availableTypes.map((type) => (
            <button key={type} className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)}>{imageTypeLabel[type]}</button>
          ))}
        </div>
      )}
      <div className={`gallery-grid images-${Math.min(visibleImages.length, 5)} ${visibleImages.length >= 5 ? "masonry" : ""}`}>
        {visibleImages.map((image) => (
          <ProductImageView key={image.id} image={image} product={product} onOpen={() => setZoomedImage(image)} />
        ))}
      </div>
      <div className="image-metadata-card">
        <p className="eyebrow">Image Metadata</p>
        <div className="metadata-grid">
          <span>Year: {primary.metadata.year}</span>
          <span>Country: {primary.metadata.country}</span>
          <span>Tag Type: {primary.metadata.tagType}</span>
          <span>Stitch Type: {primary.metadata.stitchType}</span>
          <span>Condition: {primary.metadata.condition}</span>
          <span>Source: <a href={primary.sourceUrl} target="_blank" rel="noreferrer">{primary.source}</a></span>
        </div>
      </div>
      {zoomedImage && (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setZoomedImage(null)}>
          <button className="lightbox-close" onClick={() => setZoomedImage(null)}>Close</button>
          <img src={zoomedImage.url} alt={`${product.name} ${zoomedImage.label}`} />
          <p>{zoomedImage.label} / {zoomedImage.source}</p>
        </div>
      )}
    </section>
  );
}



function ProductDefaultVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  return <ArchiveVisual product={product} variant={compact ? "compact" : "default"} />;
}

function ProductImageView({ image, product, compact = false, onOpen }: { image: ProductImageRecord; product: Product; compact?: boolean; onOpen?: () => void }) {
  return (
    <figure className={`archive-photo ${compact ? "compact" : ""}`} onClick={onOpen}>
      <img src={image.url} alt={`${product.name} ${image.label}`} loading="lazy" />
      <figcaption>
        <span>{image.label}</span>
        <strong>{image.metadata.year}</strong>
      </figcaption>
    </figure>
  );
}

function TagCard({ tagId }: { tagId: string }) {
  const tag = getTag(tagId)!;
  return <article className="tag-card"><div className="tag-photo"><span>TAG PHOTO</span><strong>{tag.yearStart}-{tag.yearEnd}</strong></div><h3>{tag.label}</h3><p><strong>Country:</strong> {tag.country}</p><p><strong>Factory:</strong> {tag.factoryInformation}</p><p><strong>Stitch:</strong> {tag.stitchType}</p><p><strong>알려진 변형:</strong> {tag.knownVariants.join(", ")}</p><p><strong>Authentication notes:</strong> {tag.authenticationNotes}</p><p><strong>Common fakes:</strong> {tag.commonFakes}</p><p><strong>Production differences:</strong> {tag.productionDifferences}</p></article>;
}

function CommunityExample({ example, index }: { example: CommunitySubmission; index: number }) {
  return <article className="example-card"><p className="eyebrow">사례 #{index + 1}</p><h3>기여자: {example.contributor}</h3><p>{badgeLabel(example.badge)} / {example.contributionDate} / <a href={example.profileUrl}>프로필 링크</a></p><div className="mini-photo-row">{example.photos.map((photo) => <span key={photo}>{photo}</span>)}</div><p>{example.year} / {example.country} / {example.tagType}</p><p>{example.authenticationNotes}</p><a href="#/copyright">저작권 문제 신고</a></article>;
}

type CategoryFilters = { brand: string; year: string; country: string; condition: string; marketplace: string; price: string };

function FilterControls({ filters, setFilters, brands }: { filters: CategoryFilters; setFilters: (filters: CategoryFilters) => void; brands: { id: string; name: string }[] }) {
  const update = (key: keyof CategoryFilters, value: string) => setFilters({ ...filters, [key]: value });
  return <div className="filter-panel nested"><select value={filters.brand} onChange={(event) => update("brand", event.target.value)}><option value="All">전체</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><select value={filters.year} onChange={(event) => update("year", event.target.value)}><option value="All">전체</option>{["194", "195", "196", "197", "198", "199", "200"].map((item) => <option key={item} value={item}>{item}0년대</option>)}</select><select value={filters.country} onChange={(event) => update("country", event.target.value)}><option value="All">전체</option>{Array.from(new Set(validProducts.map((item) => item.country))).map((item) => <option key={item}>{item}</option>)}</select><select value={filters.condition} onChange={(event) => update("condition", event.target.value)}><option value="All">전체</option>{["Deadstock", "Excellent", "Very Good", "Good", "Fair", "Distressed"].map((item) => <option key={item}>{item}</option>)}</select><select value={filters.marketplace} onChange={(event) => update("marketplace", event.target.value)}><option value="All">전체</option>{marketplaces.map((item) => <option key={item}>{item}</option>)}</select><select value={filters.price} onChange={(event) => update("price", event.target.value)}><option value="All">전체</option><option>Under $250</option><option>$250-$750</option><option>$750+</option></select></div>;
}



function productHistoricalTimeline(product: Product, brandName: string) {
  return [
    { year: product.releaseYear, title: `${brandName} 생산/릴리스 기록`, description: `${product.name}은(는) ${product.releaseYear}년 ${product.country} 생산 맥락으로 분류됩니다.` },
    { year: Math.min(2024, product.releaseYear + 8), title: "컬렉터 시장 편입", description: "태그, 컨디션, 거래 기록이 누적되며 아카이브 레퍼런스로 추적됩니다." },
  ].filter((event) => event.year <= 2024);
}

function TransactionScatterChart({ records }: { records: MarketTransaction[] }) {
  const prices = records.map((record) => record.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const firstDate = new Date(records[0].date).getTime();
  const lastDate = new Date(records[records.length - 1].date).getTime();
  const range = Math.max(1, lastDate - firstDate);
  const points = records.map((record) => {
    const x = ((new Date(record.date).getTime() - firstDate) / range) * 88 + 6;
    const y = 90 - ((record.price - min) / Math.max(1, max - min)) * 74;
    return { ...record, x, y };
  });

  return (
    <div className="transaction-history-grid">
      <div className="chart-card scatter-chart-card">
        <p>거래 발생 시점만 표시합니다. 빈 기간은 임의로 연결하지 않습니다.</p>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="실거래 산점도">
          {points.map((point) => <circle key={point.id} cx={point.x} cy={point.y} r="2.3" />)}
        </svg>
        <div className="metric-row"><span>{records[0].date}</span><strong>{records[records.length - 1].date}</strong></div>
      </div>
      <RecentTransactionList records={records.slice(-6)} />
    </div>
  );
}

function RecentTransactionList({ records }: { records: MarketTransaction[] }) {
  return (
    <div className="recent-transaction-list">
      {records.slice().reverse().map((record) => (
        <a key={record.id} href={record.sourceUrl} target="_blank" rel="noreferrer" className="transaction-row">
          <span>{record.date.slice(0, 7).replace("-", ".")}</span>
          <strong>{currency(record.price)}</strong>
          <small>{record.marketplace}</small>
        </a>
      ))}
    </div>
  );
}

function LineChart({ points, valueKey, label }: { points: { price: number; date: string }[]; valueKey: "price"; label: string }) {
  const values = points.map((point) => point[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const path = points.map((point, index) => { const x = (index / Math.max(1, points.length - 1)) * 100; const y = 92 - ((point[valueKey] - min) / Math.max(1, max - min)) * 82; return `${index === 0 ? "M" : "L"}${x},${y}`; }).join(" ");
  return <div className="chart-card"><p>{label}</p><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d={path} /></svg><div className="metric-row"><span>{points[0]?.date}</span><strong>{currency(points[points.length - 1]?.price ?? 0)}</strong></div></div>;
}

function BarChart({ points, label }: { points: { volume: number; date: string }[]; label: string }) {
  const max = Math.max(...points.map((point) => point.volume));
  return <div className="chart-card"><p>{label}</p><div className="bar-chart">{points.map((point, index) => <span key={`${point.date}-${index}`} style={{ height: `${Math.max(8, (point.volume / max) * 100)}%` }} />)}</div><div className="metric-row"><span>{points[0]?.date}</span><strong>{points.reduce((sum, point) => sum + point.volume, 0)} sales</strong></div></div>;
}



interface BrandTimelineEvent {
  year: number;
  title: string;
  description: string;
}

interface BrandArchiveProfile {
  description: string;
  history: string;
  timeline: BrandTimelineEvent[];
  representativeProducts: string[];
}

const curatedBrandProfiles: Record<string, BrandArchiveProfile> = {

  Nirvana: {
    description: "Nirvana는 1987년 미국 워싱턴주 애버딘에서 결성된 그런지 록 밴드로, 1990년대 얼터너티브 록의 상징적인 존재입니다.",
    history: "Nirvana의 티셔츠와 투어 머천다이즈는 그런지 문화, DIY 그래픽, 1990년대 음악 산업의 변화를 함께 기록합니다. 밴드 티 아카이브에서는 앨범 발매, 투어 시기, 태그 제조사, 프린트 상태가 핵심 연구 기준입니다.",
    timeline: [
      { year: 1987, title: "결성", description: "Kurt Cobain과 Krist Novoselic을 중심으로 워싱턴주 애버딘에서 밴드가 시작되었습니다." },
      { year: 1989, title: "Bleach 발매", description: "Sub Pop을 통해 데뷔 앨범을 발매하며 시애틀 그런지 씬과 연결됩니다." },
      { year: 1991, title: "Nevermind 발매", description: "Smells Like Teen Spirit와 함께 얼터너티브 록이 주류 문화로 확산되었습니다." },
      { year: 1993, title: "In Utero 발매", description: "밴드의 후반기 그래픽과 투어 머천다이즈가 중요한 수집 대상이 됩니다." },
      { year: 1994, title: "활동 종료", description: "Kurt Cobain 사망 이후 밴드 활동이 종료되며 당시 투어/앨범 티셔츠의 역사성이 커졌습니다." },
    ],
    representativeProducts: ["Nevermind Tee", "Heart Shaped Box Tee", "In Utero Tour Tee"],
  },
  Metallica: {
    description: "Metallica는 1981년 결성된 미국의 헤비메탈 밴드로, 세계에서 가장 영향력 있는 메탈 밴드 중 하나입니다.",
    history: "Metallica 밴드 티는 스래시 메탈, 대형 월드 투어, 1990년대 Brockum/Giant 태그 문화와 연결됩니다. 앨범 아트워크와 투어 백프린트는 음악 문화 아카이브에서 중요한 비교 기준입니다.",
    timeline: [
      { year: 1981, title: "결성", description: "Lars Ulrich와 James Hetfield를 중심으로 로스앤젤레스에서 밴드가 시작되었습니다." },
      { year: 1983, title: "Kill 'Em All", description: "데뷔 앨범을 통해 스래시 메탈 씬의 핵심 밴드로 부상했습니다." },
      { year: 1986, title: "Master of Puppets", description: "앨범과 투어 그래픽이 메탈 티셔츠 아카이브의 대표 레퍼런스가 되었습니다." },
      { year: 1991, title: "Black Album", description: "상업적 성공과 함께 대형 투어 머천다이즈 생산이 확대되었습니다." },
    ],
    representativeProducts: ["Master of Puppets Tee", "Black Album Tour Tee", "Brockum Metallica Tee"],
  },
  "Pink Floyd": {
    description: "Pink Floyd는 프로그레시브 록을 대표하는 영국 밴드로, 음악사에서 가장 중요한 록 밴드 중 하나로 평가받습니다.",
    history: "Pink Floyd 티셔츠는 앨범 아트워크, 월드 투어, 사이키델릭 그래픽 문화와 연결됩니다. The Wall, Dark Side of the Moon 같은 그래픽은 밴드 티 아카이브의 장기 레퍼런스입니다.",
    timeline: [
      { year: 1965, title: "밴드 결성", description: "런던에서 결성되어 사이키델릭 록 씬의 중심 밴드로 성장했습니다." },
      { year: 1973, title: "The Dark Side of the Moon", description: "프리즘 그래픽과 앨범 서사가 록 문화의 상징이 되었습니다." },
      { year: 1979, title: "The Wall", description: "앨범과 투어 비주얼이 이후 머천다이즈 그래픽에 큰 영향을 주었습니다." },
      { year: 1994, title: "Division Bell 투어", description: "1990년대 대형 투어 티셔츠와 공식 머천다이즈가 수집 시장에서 주목받습니다." },
    ],
    representativeProducts: ["Dark Side Tee", "The Wall Tour Tee", "Division Bell Tee"],
  },
  Carhartt: {
    description: "Carhartt는 1889년 Hamilton Carhartt가 시작한 미국 워크웨어 브랜드로, 철도 노동자와 산업 현장의 작업복을 기반으로 빈티지 워크웨어 아카이브의 핵심 기준이 되었습니다.",
    history: "Carhartt는 덕 캔버스, 더블니 팬츠, 디트로이트 재킷, 액티브 재킷처럼 노동 현장에서 검증된 의류를 만들었습니다. 1990년대 이후 힙합과 스케이트 문화에서 재해석되며 기능복과 서브컬처가 만나는 대표 사례가 되었습니다.",
    timeline: [
      { year: 1889, title: "Hamilton Carhartt 설립", description: "디트로이트에서 철도 노동자를 위한 견고한 작업복 생산을 시작했습니다." },
      { year: 1910, title: "철도 노동자 작업복 생산 확대", description: "오버롤과 덕 캔버스 제품군이 미국 노동복의 표준으로 확산되었습니다." },
      { year: 1989, title: "유럽 진출 시작", description: "워크웨어가 유럽 시장과 서브컬처 씬에서 새롭게 해석되기 시작했습니다." },
      { year: 1994, title: "힙합 문화에서 인지도 상승", description: "오버사이즈 워크웨어가 힙합과 스트리트 스타일의 중요한 실루엣이 되었습니다." },
      { year: 1997, title: "Carhartt WIP 시작", description: "Work In Progress 라인이 유럽 스트리트웨어 시장에서 브랜드를 재맥락화했습니다." },
    ],
    representativeProducts: ["Detroit Jacket", "Active Jacket", "Double Knee Pant"],
  },
  Stussy: {
    description: "Stussy는 1980년 Shawn Stussy가 시작한 브랜드로, 현대 스트리트웨어의 기초를 만든 브랜드 중 하나입니다.",
    history: "Stussy는 서핑 문화와 펑크, 힙합, 클럽 문화를 결합하며 전 세계 스트리트웨어 씬에 큰 영향을 미쳤습니다. 로고, 그래픽 티셔츠, Tribe 네트워크는 스트리트웨어가 커뮤니티 기반 문화로 확장되는 방식을 보여줍니다.",
    timeline: [
      { year: 1980, title: "Shawn Stussy가 브랜드 시작", description: "서프보드 시그니처에서 출발한 로고가 티셔츠와 캡으로 확장되었습니다." },
      { year: 1984, title: "그래픽 티셔츠 생산 확대", description: "로고 티셔츠와 그래픽 제품이 서프 컬처 밖으로 확산되었습니다." },
      { year: 1988, title: "국제 시장 진출", description: "미국 서부 기반의 로컬 브랜드가 글로벌 스트리트웨어 언어로 확장되었습니다." },
      { year: 1991, title: "International Stussy Tribe 형성", description: "뮤지션, DJ, 스케이터, 크리에이터 네트워크가 브랜드 문화의 중심이 되었습니다." },
      { year: 2000, title: "스트리트웨어 대표 브랜드로 자리잡음", description: "초기 태그와 그래픽은 빈티지 스트리트웨어 시장의 핵심 레퍼런스가 되었습니다." },
    ],
    representativeProducts: ["Dragon Tee", "8 Ball Jacket", "International Tribe Tee"],
  },
  Supreme: {
    description: "Supreme은 1994년 뉴욕 Lafayette Street에서 시작한 스케이트숍 기반 브랜드로, 드롭 문화와 박스 로고를 통해 현대 리세일 문화를 형성했습니다.",
    history: "Supreme은 스케이트보드, 아트, 음악, 패션 협업을 결합하며 한정 발매와 커뮤니티 기반 소유 문화를 만들었습니다. 초기 티셔츠와 협업 제품은 스트리트웨어 아카이브에서 중요한 시장 데이터 기준입니다.",
    timeline: [
      { year: 1994, title: "뉴욕 Lafayette Street 첫 매장", description: "스케이터 친화적 매장 구조와 로컬 커뮤니티 기반 유통을 시작했습니다." },
      { year: 2000, title: "박스 로고 문화 확산", description: "로고 제품이 스트리트웨어 희소성과 정체성의 상징이 되었습니다." },
      { year: 2012, title: "Comme des Garcons 협업", description: "하이패션과 스트리트웨어 협업의 대표 사례로 기록됩니다." },
      { year: 2017, title: "VF 이전 투자 단계", description: "글로벌 브랜드로 확장되기 전 시장 가치가 크게 상승했습니다." },
      { year: 2020, title: "VF Corp 인수", description: "독립 스케이트숍 기반 브랜드가 대형 패션 그룹에 편입되었습니다." },
    ],
    representativeProducts: ["Box Logo Tee", "Photo Tee", "Coach Jacket"],
  },
  "Raf Simons": {
    description: "Raf Simons는 1995년 시작된 벨기에 디자이너 브랜드로, 청소년 문화와 음악, 유럽 서브컬처를 런웨이 언어로 번역했습니다.",
    history: "Raf Simons의 초기 컬렉션은 그래픽, 슬림 실루엣, 정치적/음악적 레퍼런스를 결합하며 디자이너 아카이브 시장의 핵심 축이 되었습니다. 특정 시즌명과 컬렉션 맥락이 제품 가치에 직접 연결됩니다.",
    timeline: [
      { year: 1995, title: "브랜드 설립", description: "벨기에 기반 남성복 브랜드로 독립적인 청소년 문화 서사를 시작했습니다." },
      { year: 2001, title: "Riot Riot Riot 컬렉션", description: "펑크와 반항적 그래픽을 결합한 컬트 컬렉션으로 기록됩니다." },
      { year: 2005, title: "Jil Sander 합류", description: "미니멀 럭셔리 하우스에서 크리에이티브 디렉터로 활동을 시작했습니다." },
      { year: 2012, title: "Dior 크리에이티브 디렉터", description: "하이패션 메종의 꾸뛰르 언어와 본인의 서브컬처 감각을 연결했습니다." },
      { year: 2023, title: "동명 브랜드 종료", description: "Raf Simons 라인의 종료로 초기 아카이브 수요와 연구 가치가 재조명되었습니다." },
    ],
    representativeProducts: ["Riot Riot Riot", "Nebraska Sweatshirt", "Consumed Collection"],
  },
  "Helmut Lang": {
    description: "Helmut Lang은 1986년 시작된 브랜드로, 1990년대 미니멀리즘과 산업적 소재, 도시적 실루엣을 대표합니다.",
    history: "Helmut Lang은 광고, 온라인 런웨이, 유틸리티 디테일, 정제된 테일러링을 통해 현대 패션 시스템의 기준을 앞서 제시했습니다. 초기 라벨과 1990년대 생산분은 디자이너 아카이브 시장의 핵심 레퍼런스입니다.",
    timeline: [
      { year: 1986, title: "브랜드 설립", description: "오스트리아 기반 브랜드로 절제된 테일러링과 실험적 소재를 전개했습니다." },
      { year: 1994, title: "미니멀리즘 대표 브랜드로 성장", description: "도시적 실루엣과 기능적 디테일로 1990년대 패션 언어를 정의했습니다." },
      { year: 1998, title: "온라인 런웨이 선구적 시도", description: "인터넷을 통한 컬렉션 공개로 패션 커뮤니케이션 방식을 앞서 실험했습니다." },
      { year: 2005, title: "브랜드 이탈", description: "Helmut Lang 본인이 브랜드를 떠나며 초기 아카이브의 역사적 구분점이 생겼습니다." },
    ],
    representativeProducts: ["Bondage Trouser", "Astro Jacket", "Painter Denim"],
  },
};

function brandArchiveProfile(name: string, categoryId: CategoryId, foundingYear: number, country: string): BrandArchiveProfile {
  const curated = curatedBrandProfiles[name];
  if (curated) return curated;
  const categoryName = getCategory(categoryId)?.name ?? "빈티지";
  if (categoryId === "band-tee") {
    return {
      description: `${name}은(는) ${foundingYear}년 ${country}에서 시작된 음악 문화 아카이브 항목입니다.`,
      history: `${name} 관련 밴드 티는 투어, 앨범, 그래픽, 태그 제조사, 프린트 상태를 통해 음악 문화와 빈티지 의류 시장을 함께 기록합니다. 검증 가능한 밴드 히스토리와 머천다이즈 데이터는 계속 보강 중입니다.`,
      timeline: [],
      representativeProducts: representativeBrandProducts(name, []),
    };
  }
  return {
    description: `${name}은(는) ${foundingYear}년 ${country}에서 시작된 ${categoryName} 아카이브 브랜드입니다.`,
    history: `${name}의 아카이브 가치는 생산국, 라벨, 태그, 소재, 시장 거래 기록을 함께 검토할 때 더 명확해집니다. 현재 상세 히스토리는 검증 가능한 출처를 기준으로 보강 중입니다.`,
    timeline: [],
    representativeProducts: representativeBrandProducts(name, []),
  };
}

function representativeBrandProducts(name: string, productsForBrand: Product[]) {
  const curated = curatedBrandProfiles[name]?.representativeProducts;
  if (curated?.length) return curated;
  const fromProducts = productsForBrand.slice().sort((a, b) => b.archiveScore - a.archiveScore).slice(0, 3).map((product) => product.name.replace(`${name} `, ""));
  return fromProducts.length ? fromProducts : ["대표 아카이브 준비 중"];
}


function BandCulturePanel({ bandName }: { bandName: string }) {
  const bandData: Record<string, { albums: string[]; tours: string[] }> = {
    Nirvana: { albums: ["Bleach", "Nevermind", "In Utero"], tours: ["Nevermind Tour", "In Utero Tour", "MTV Live and Loud"] },
    Metallica: { albums: ["Kill 'Em All", "Master of Puppets", "Black Album"], tours: ["Damage, Inc. Tour", "Wherever We May Roam", "Nowhere Else to Roam"] },
    "Pink Floyd": { albums: ["The Dark Side of the Moon", "The Wall", "The Division Bell"], tours: ["In the Flesh", "The Wall Tour", "Division Bell Tour"] },
  };
  const data = bandData[bandName];
  if (!data) return null;
  return (
    <section className="split-grid band-culture-panel">
      <div className="panel"><SectionTitle eyebrow="대표 앨범" title="Albums" /><ul className="check-list">{data.albums.map((album) => <li key={album}>{album}</li>)}</ul></div>
      <div className="panel"><SectionTitle eyebrow="대표 투어" title="Tours" /><ul className="check-list">{data.tours.map((tour) => <li key={tour}>{tour}</li>)}</ul></div>
    </section>
  );
}

function BrandTimeline({ events }: { events: BrandTimelineEvent[] }) {
  if (!events.length) return null;
  return (
    <section className="panel brand-timeline-section">
      <SectionTitle eyebrow="Historic Timeline" title="브랜드 역사 타임라인" />
      <div className="brand-timeline-cards">
        {events.map((event) => (
          <article key={`${event.year}-${event.title}`} className="brand-timeline-card">
            <time>{event.year}</time>
            <div><strong>{event.title}</strong><p>{event.description}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function categoryHistoricalEvents(categoryId: CategoryId) {
  const events: Record<CategoryId, Array<{ id: string; year: number; title: string; description: string; marketImpact: string; type: string }>> = {
    military: [
      { id: "military-1947", year: 1947, title: "M-47 Field Jacket 채택", description: "전후 필드 재킷 체계가 정비되며 현대 밀리터리 아우터의 기반이 형성됩니다.", marketImpact: "초기 필드 재킷과 컨트랙트 라벨 개체의 리서치 가치가 높습니다.", type: "군납" },
      { id: "military-1951", year: 1951, title: "MA-1 개발", description: "제트기 시대에 맞춰 나일론 플라이트 재킷 설계가 확산됩니다.", marketImpact: "초기 MA-1과 제조사 라벨은 밀리터리 아카이브 핵심 비교군입니다.", type: "제품 개발" },
      { id: "military-1965", year: 1965, title: "베트남전 미군 확대", description: "열대 기후용 퍼티그와 필드 장비 생산이 확대됩니다.", marketImpact: "전쟁 시기 생산분은 원단, 스티치, 계약번호 검증이 중요합니다.", type: "역사 사건" },
      { id: "military-1967", year: 1967, title: "Ripstop 원단 도입", description: "찢김 방지 원단이 야전복 생산에 적용되며 내구성 기준이 바뀝니다.", marketImpact: "립스탑 초기 생산분은 컨디션별 가격 차이가 큽니다.", type: "소재 변화" },
      { id: "military-1972", year: 1972, title: "M-65 생산 체계 정비", description: "필드 재킷 생산과 공급 체계가 안정화되며 민간 서플러스 시장의 기반이 생깁니다.", marketImpact: "사이즈, 라이너, 지퍼, 라벨 조합이 가격 판단의 핵심입니다.", type: "생산 체계" },
    ],
    workwear: [
      { id: "workwear-1873", year: 1873, title: "리벳 보강 데님 특허", description: "작업복 내구성을 높이는 리벳 구조가 데님 역사에 자리 잡습니다.", marketImpact: "초기 구조와 셀비지 디테일은 워크웨어 평가 기준입니다.", type: "기술" },
      { id: "workwear-1930", year: 1930, title: "초어 코트 대중화", description: "철도, 농업, 공장 노동을 위한 캔버스와 데님 아우터가 확산됩니다.", marketImpact: "페이드와 수선 흔적이 아카이브 가치를 높입니다.", type: "노동사" },
      { id: "workwear-1950", year: 1950, title: "전후 미국 제조 확대", description: "전후 산업 생산 증가와 함께 유니언 라벨, 사이즈 표기, 케어 정보가 체계화됩니다.", marketImpact: "미국 생산 라벨과 블랭킷 라이닝이 프리미엄 요소입니다.", type: "생산" },
      { id: "workwear-1971", year: 1971, title: "Big E 전환기", description: "Levi's Big E 탭과 이후 생산 변화가 데님 수집의 주요 분기점이 됩니다.", marketImpact: "Big E, 셀비지, 탭 위치는 가격 비교의 핵심 지표입니다.", type: "태그 변화" },
      { id: "workwear-1989", year: 1989, title: "워크웨어의 스트리트 편입", description: "스케이트와 힙합 문화가 덕 재킷, 더블니, 오버롤을 일상복으로 재해석합니다.", marketImpact: "색상, 페이드, 실루엣에 따른 수요 편차가 커집니다.", type: "문화" },
    ],
    "band-tee": [
      { id: "band-tee-1969", year: 1969, title: "락 페스티벌 머천다이즈 확산", description: "콘서트 티셔츠가 공연 경험을 기록하는 문화 물건으로 자리 잡습니다.", marketImpact: "초기 프린트와 바디 태그는 인증의 핵심입니다.", type: "음악 문화" },
      { id: "band-tee-1977", year: 1977, title: "펑크 DIY 프린트 문화", description: "소규모 실크스크린과 팬 제작 티셔츠가 서브컬처 기록물이 됩니다.", marketImpact: "불규칙한 프린트와 바디 특성이 오히려 진품 단서가 됩니다.", type: "서브컬처" },
      { id: "band-tee-1984", year: 1984, title: "대형 투어 머천다이즈 체계화", description: "아레나 투어와 함께 공식 투어 티셔츠 생산이 확대됩니다.", marketImpact: "투어 도시, 백프린트, 저작권 표기가 가격에 반영됩니다.", type: "투어" },
      { id: "band-tee-1992", year: 1992, title: "그런지와 얼터너티브 붐", description: "Nirvana, Sonic Youth 등 밴드 티가 음악과 패션의 교차점이 됩니다.", marketImpact: "Brockum, Giant 등 태그와 프린트 상태가 수요를 좌우합니다.", type: "문화 전환" },
      { id: "band-tee-2000", year: 2000, title: "빈티지 밴드 티 컬렉팅 확산", description: "온라인 거래와 셀러브리티 착용으로 투어 티 수집 시장이 확장됩니다.", marketImpact: "가품 비교와 출처 기록의 중요성이 커집니다.", type: "시장" },
    ],
    streetwear: [
      { id: "streetwear-1980", year: 1980, title: "서프/스케이트 로고 문화 형성", description: "로컬 숍과 그래픽 로고가 커뮤니티 신호로 작동하기 시작합니다.", marketImpact: "초기 숍 태그와 소량 생산 그래픽이 프리미엄을 만듭니다.", type: "커뮤니티" },
      { id: "streetwear-1993", year: 1993, title: "하라주쿠 스트리트웨어 부상", description: "일본 브랜드와 편집숍 문화가 글로벌 스트리트웨어 언어를 만듭니다.", marketImpact: "일본 한정 릴리스와 초기 태그의 수요가 높습니다.", type: "지역 문화" },
      { id: "streetwear-1994", year: 1994, title: "뉴욕 드롭 문화 정착", description: "스케이트숍 기반 한정 발매 방식이 리세일 문화를 예고합니다.", marketImpact: "첫 시즌, 초기 로고, 매장 출처가 가격에 반영됩니다.", type: "유통" },
      { id: "streetwear-2001", year: 2001, title: "아티스트 협업 확대", description: "그래피티, 음악, 패션 협업이 스트리트웨어의 기록 가치를 높입니다.", marketImpact: "협업 그래픽은 거래 빈도는 낮지만 고가 비교군을 형성합니다.", type: "협업" },
      { id: "streetwear-2010", year: 2010, title: "리세일 데이터 공개화", description: "온라인 플랫폼이 희소성과 가격 기록을 가시화합니다.", marketImpact: "거래 데이터가 아카이브 가치 판단의 보조 지표가 됩니다.", type: "시장" },
    ],
    "designer-archive": [
      { id: "designer-1988", year: 1988, title: "해체주의 패션의 확산", description: "Maison Margiela 등 디자이너가 의복 구조와 라벨의 의미를 재정의합니다.", marketImpact: "초기 라벨과 런웨이 출처가 핵심 프리미엄입니다.", type: "디자인" },
      { id: "designer-1995", year: 1995, title: "Raf Simons 데뷔", description: "청소년 문화와 음악 서브컬처가 디자이너 아카이브의 중심 주제가 됩니다.", marketImpact: "초기 시즌과 그래픽 피스는 낮은 유동성에도 높은 수요를 가집니다.", type: "런웨이" },
      { id: "designer-1998", year: 1998, title: "미니멀 테일러링 전성기", description: "Helmut Lang과 Prada가 현대적 소재와 실루엣을 정교화합니다.", marketImpact: "런웨이 착장 여부와 소재 보존 상태가 가격을 가릅니다.", type: "실루엣" },
      { id: "designer-2001", year: 2001, title: "컬트 컬렉션 시장 형성", description: "서브컬처와 런웨이 서사가 결합된 컬렉션이 아카이브 시장을 만듭니다.", marketImpact: "Riot Riot Riot 같은 컬렉션명 자체가 검색 수요를 만듭니다.", type: "컬렉션" },
      { id: "designer-2015", year: 2015, title: "온라인 아카이브 리서치 확장", description: "포럼, 이미지 보드, 리세일 플랫폼이 디자이너 아카이브 정보를 연결합니다.", marketImpact: "문서화된 착장과 라벨 사진이 시장 신뢰도를 높입니다.", type: "리서치" },
    ],
  };
  return events[categoryId];
}

function brandSummary(name: string, categoryId: CategoryId) {
  const known: Record<string, string> = {
    "Alpha Industries": "MA-1 생산으로 유명한 대표 밀리터리 제조사입니다.",
    "Levi's": "501과 Big E 탭으로 데님 아카이브의 기준이 되는 브랜드입니다.",
    Carhartt: "덕 캔버스, 디트로이트 재킷, 워크웨어 페이드 문화의 핵심 브랜드입니다.",
    Nirvana: "1990년대 그런지와 투어 머천다이즈 시장을 대표하는 밴드 아카이브입니다.",
    Stussy: "서프, 스케이트, 로고 문화가 결합된 초기 스트리트웨어 기준점입니다.",
    "Maison Margiela": "해체주의와 넘버 라벨로 디자이너 아카이브의 언어를 만든 하우스입니다.",
    "Raf Simons": "청소년 문화, 음악, 런웨이 서사를 결합한 컬트 아카이브의 핵심입니다.",
  };
  if (known[name]) return known[name];
  return {
    military: "계약 라벨, 생산국, 원단 변화로 검증 가치가 높은 제조사입니다.",
    workwear: "노동복 구조, 페이드, 수선 흔적을 통해 시대성을 읽을 수 있는 브랜드입니다.",
    "band-tee": "투어, 앨범, 프린트 바디를 통해 음악 문화의 흐름을 기록합니다.",
    streetwear: "로고, 드롭, 숍 문화와 연결되는 스트리트 아카이브 브랜드입니다.",
    "designer-archive": "런웨이 시즌, 라벨, 소재 실험으로 컬렉터 연구 가치가 높습니다.",
  }[categoryId];
}

function Timeline({ events }: { events: { id: string; year: number; title: string; description: string; marketImpact: string; type: string }[] }) {
  return <section className="panel"><SectionTitle eyebrow="Historical Timeline" title="Events connected directly to market data" /><ol className="timeline-list">{events.map((event) => <li key={event.id}><time>{event.year}</time><div><strong>{event.title}</strong><p>{event.description}</p><small>{event.type}: {event.marketImpact}</small></div></li>)}</ol></section>;
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (page: number) => void }) {
  return <div className="pagination">{Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => <button className={page === item ? "active" : ""} onClick={() => setPage(item)} key={item}>{item}</button>)}</div>;
}

function PageHero({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <section className="page-hero panel"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</section>;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="section-title"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>;
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return <div className="panel inset"><h3>{title}</h3><p>{text}</p></div>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return <div className="stat"><span>{label}</span><strong className={tone}>{value}</strong></div>;
}

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function liquidityLabel(value: string) {
  return { Deep: "높음", Moderate: "보통", Thin: "낮음", "No public trades": "공개 거래 없음" }[value] ?? value;
}

function statusLabel(value: string) {
  return { "Pending Review": "검토 대기", Approved: "승인됨", Rejected: "거절됨", Flagged: "플래그됨" }[value] ?? value;
}

function badgeLabel(value: string) {
  return { Contributor: "기여자", Collector: "컬렉터", Archivist: "아키비스트", "Expert Archivist": "전문 아키비스트", "Museum Contributor": "뮤지엄 기여자" }[value] ?? value;
}

function Footer() {
  return <footer className="footer minimal-footer"><strong>ARCHIVE INDEX</strong><span>© 2026 ARCHIVE INDEX</span></footer>;
}

export default App;
