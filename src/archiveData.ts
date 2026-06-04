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
  archiveScore: number;
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
    name: "밀리터리",
    slug: "military",
    description: "정부 지급 의류, 플라이트 재킷, 필드 코트, 라이너, 퍼티그, 서플러스 디자인 레퍼런스.",
    historicalSignificance: "밀리터리 의류는 군납 계약, 원단 혁신, 전시 생산, 민간 문화로의 확산을 보존합니다.",
    culturalInfluence: "MA-1부터 M-65 필드 코트까지, 밀리터리 디자인은 유틸리티 웨어, 펑크 유니폼, 일본 복각 문화의 문법이 되었습니다.",
    heroStat: "300개+ 레퍼런스 의류",
    timelineFocus: "전쟁, 계약, 정부 납품사, 사양 변경, 민간 채택.",
    marketNarrative: "검증된 컨트랙트 라벨, 희귀 사이즈, 초기 나일론, 온전한 라이너, 특정 전쟁과 연결된 개체에 수요가 집중됩니다.",
  },
  {
    id: "workwear",
    name: "워크웨어",
    slug: "workwear",
    description: "데님, 캔버스, 초어 코트, 덕 재킷, 페인터 팬츠, 오버롤, 철도 작업복, 산업 유니폼.",
    historicalSignificance: "워크웨어는 원단 중량, 유니언 생산, 공장 라벨, 리벳, 포켓 형태, 수선 문화를 통해 노동사를 기록합니다.",
    culturalInfluence: "블루칼라 유니폼은 스케이트보딩, 힙합, 일본 아메리카나, 현대 럭셔리 컬렉션으로 확장되었습니다.",
    heroStat: "300개+ 카탈로그 스테이플",
    timelineFocus: "공장 역사, 생산 변화, 소유권 변화, 유니언 태그, 핏 변화.",
    marketNarrative: "컨디션, 파티나, 블랭킷 라이닝, 단종 컬러, 미국 생산 여부가 가격 프리미엄을 만듭니다.",
  },
  {
    id: "band-tee",
    name: "밴드 티",
    slug: "band-tee",
    description: "투어 머천다이즈, 앨범 프로모션 티, 부틀렉, 주차장 프린트, 팬클럽 릴리스, 음악 문화 아티팩트.",
    historicalSignificance: "밴드 티는 음악사와 그래픽 생산, 투어 경제, 서브컬처 정체성, 저작권 시대 머천다이징을 연결합니다.",
    culturalInfluence: "낡은 투어 티 한 장은 씬, 공연장, 그래픽 언어, 앨범 사이클 이후의 문화적 생명을 기록할 수 있습니다.",
    heroStat: "300개+ 투어 아티팩트",
    timelineFocus: "밴드 결성, 앨범 발매, 투어, 문화적 이정표, 머천다이즈 시기, 가격 영향 이벤트.",
    marketNarrative: "가격은 아티스트 기념일, 다큐멘터리, 셀러브리티 착용, 오리지널 태그 검증, 프린트 상태에 반응합니다.",
  },
  {
    id: "streetwear",
    name: "스트리트웨어",
    slug: "streetwear",
    description: "스케이트, 힙합, 하라주쿠, 그래피티, 초기 웹 드롭, 부티크 한정, 협업 시대 의류.",
    historicalSignificance: "스트리트웨어 아카이브는 럭셔리 주류화 이전 커뮤니티가 희소성, 로고 언어, 리세일 문화를 구축한 방식을 보여줍니다.",
    culturalInfluence: "소량 생산 티와 재킷은 스케이트숍, 레코드숍, 포럼, 초기 리세일 게시판에서 사회적 신호가 되었습니다.",
    heroStat: "300개+ 드롭 시대 레퍼런스",
    timelineFocus: "숍 오픈, 협업, 문화적 순간, 브랜드 전환, 유통 변화.",
    marketNarrative: "1세대 태그, 일본 한정 릴리스, 아티스트 그래픽, 온전한 출처가 있는 개체에서 마켓 강도가 가장 높습니다.",
  },
  {
    id: "designer-archive",
    name: "디자이너 아카이브",
    slug: "designer-archive",
    description: "런웨이 시대 피스, 컨셉추얼 의류, 초기 라인 태그, 컬렉션 레퍼런스, 영향력 있는 실루엣.",
    historicalSignificance: "디자이너 아카이브 의류는 구조 철학, 런웨이 내러티브, 크리에이티브 디렉터, 소재 실험을 기록합니다.",
    culturalInfluence: "이 카테고리는 실제 의류 증거를 통해 박물관, 스타일리스트, 컬렉터, 현대 디자이너를 연결합니다.",
    heroStat: "300개+ 런웨이 레퍼런스",
    timelineFocus: "런웨이 시즌, 크리에이티브 디렉터, 협업, 아틀리에 변화, 비평적 반응.",
    marketNarrative: "문서화된 런웨이 피스, 희귀 사이즈, 초기 라벨, 에디토리얼 출처가 있는 의류에 유동성이 집중됩니다.",
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
      history: `${name}은(는) ${foundingYear}년 이후 소재, 라벨, 유통, 컬렉터 수요의 변화를 보여주는 핵심 ${categories.find((item) => item.id === category)?.name.toLowerCase()} 레퍼런스로 인덱싱됩니다.`,
      keyMoments: [`${foundingYear}: 창립 시기, 초기 생산 언어가 형성됩니다.`, `${foundingYear + 18}: 라벨과 유통 변화가 뚜렷한 인증 연대 구간을 만듭니다.`, `${foundingYear + 37}: 초기 개체 검증이 어려워지며 컬렉터 수요가 증가합니다.`],
      tagEvolution: [`${foundingYear}년대: 단순한 원산지 표기가 있는 직조 또는 프린트 식별자.`, `${foundingYear + 20}년대: 사이즈 블록, 케어 정보, 지역별 제조 문구가 표준화됩니다.`, `${foundingYear + 40}년대: 병행 생산 라인에서 컬렉터가 인식하는 변형이 나타납니다.`],
      manufacturingCountries: [country, countries[(index + 2) % countries.length], countries[(index + 5) % countries.length]],
      authenticationGuide: ["생산 연도에 맞춰 라벨 타이포그래피, 간격, 케어 심볼 문구를 확인합니다.", "하나의 태그에만 의존하기 전에 스티치 구조, 원단 중량, 페이드 패턴을 비교합니다.", "마켓플레이스 출처는 보조 근거로만 사용하고, 의류 자체의 디테일을 우선합니다."],
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
    const archiveScore = Math.min(
      100,
      Math.round(
        24 +
          (releaseYear >= 1900 && releaseYear <= 2024 ? 24 : 0) +
          (productIndex % 2 === 0 ? 16 : 10) +
          (brand.manufacturingCountries[productIndex % brand.manufacturingCountries.length] ? 14 : 0) +
          (marketPrice > 0 ? 12 : 0) +
          Math.min(10, Math.round(rarityScore / 10)),
      ),
    );
    return {
      id: `${brand.id}-p${productIndex + 1}`,
      slug: slugify(name),
      name,
      brandId: brand.id,
      categoryId: brand.categoryId,
      releaseYear,
      country: brand.manufacturingCountries[productIndex % brand.manufacturingCountries.length],
      description: `${name}은(는) 라벨 구조, 소재 노화, 생산 맥락, 리세일 행동을 연구하기 위한 아카이브 레퍼런스로 기록됩니다.`,
      historicalSignificance: "이 피스는 물질적 기록입니다. 태그, 구조, 프린트 또는 원단 처리, 제조 출처가 모두 특정 빈티지 연대 구간을 판별하는 근거가 됩니다.",
      culturalImpact: "의류가 명확한 비주얼 언어와 기록된 씬, 계약, 투어, 런웨이 시즌, 워크웨어 사용 맥락을 연결할 때 컬렉터 관심이 가장 강합니다.",
      productionDetails: "기록 대상에는 원단 중량, 스티치 특성, 라벨 타이포그래피, 하드웨어 노화, 케어라벨 문구, 생산 국가별 편차가 포함됩니다.",
      marketPrice,
      priceChangePercent: Number((((brandIndex * 7 + productIndex * 5) % 35) - 12).toFixed(1)),
      rarityScore,
      archiveScore,
      popularity: 50 + ((brandIndex * 11 + productIndex * 17) % 50),
      size: sizes[(brandIndex + productIndex) % sizes.length],
      condition: conditions[(brandIndex + productIndex * 2) % conditions.length],
      tagId: `${brand.id}-t${(productIndex % 2) + 1}`,
      referenceNumber: `AI-${brand.categoryId.toUpperCase().slice(0, 3)}-${releaseYear}-${String(brandIndex + 1).padStart(2, "0")}${productIndex + 1}`,
      knownVariants: ["내수 유통", "수출 라벨", productIndex % 2 === 0 ? "대체 케어라벨 배열" : "지역별 원단 로트 편차"],
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
      factoryInformation: `${brand.manufacturingCountries[tagIndex % brand.manufacturingCountries.length]} 생산분으로, 시대별 타이포그래피와 케어 문구가 반영되어 있습니다.`,
      stitchType: (["Single stitch", "Double stitch", "Chain stitch", "Overlock"] as const)[(brandIndex + tagIndex) % 4],
      knownVariants: ["내수 사이즈 블록", "수출용 케어 문구", "후기 생산분 폰트 굵기 변화"],
      authenticationNotes: "라벨 섬유, 프린트 번짐, 가장자리 해짐, 사이즈 타이포그래피, 스티치 장력, 정렬을 알려진 생산 연대와 대조합니다.",
      commonFakes: "흔한 복각/가품은 현대식 블랭크 라벨, 지나치게 선명한 잉크, 일관되지 않은 원산지 문구, 잘못된 스티치 밀도를 보입니다.",
      productionDifferences: "차이는 주로 케어 심볼, RN 또는 계약 번호, 실 색감, 라벨 뒷면, 국가별 세탁 문구에서 나타납니다.",
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
        title: `${category.name} 아카이브 이정표 ${eventIndex + 1}`,
        description: `${category.timelineFocus} 이 이정표는 오브젝트, 생산 변화, 마켓 행동을 연결합니다.`,
        marketImpact: eventIndex % 3 === 0 ? "이 시기의 검증된 개체는 출처와 태그가 온전할 때 프리미엄에 거래됩니다." : "비교 가능한 거래는 컨디션 보정 평가의 유용한 기준선을 만듭니다.",
        type: ["문화적 이정표", "생산 변화", "마켓 영향", "태그 변화"][eventIndex % 4],
      };
    }),
  ),
  ...brands.slice(0, 20).map((brand) => ({
    id: `${brand.id}-brand-event`,
    categoryId: brand.categoryId,
    brandId: brand.id,
    year: brand.foundingYear + 25,
    title: `${brand.name} 컬렉터 인식 구간`,
    description: `${brand.name}의 이 시기 개체는 라벨 언어, 구조, 유통 채널을 통해 구분하기 쉬워집니다.`,
    marketImpact: "타임라인 증거와 의류 디테일이 일치할 때 컬렉터 신뢰도가 높아집니다.",
    type: "브랜드 역사",
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
    authenticationNotes: "기여자는 기록된 생산 연대와 일치하는 태그 섬유, 프린트 크랙, 솔기 마모, 실측을 기록했습니다.",
    rightsAgreementAt: `${monthAgo(exampleIndex + 1, index)}T12:00:00.000Z`,
  })),
);

export const rareItemRequests: RareItemRequest[] = [
  { id: "rare-1", title: "1994 Nirvana Heart Shaped Box Tee", categoryId: "band-tee", brand: "Nirvana", rewardPoints: 850, requestedBy: "SubPopIndex", notes: "앞면, 뒷면, 태그, 프린트 디테일, 실측이 포함된 검증 사진을 찾고 있습니다." },
  { id: "rare-2", title: "1998 Stussy Dragon Tee", categoryId: "streetwear", brand: "Stussy", rewardPoints: 700, requestedBy: "LagunaArchive", notes: "최초 소유자 사례 또는 숍 출처가 있는 개체를 우선합니다." },
  { id: "rare-3", title: "2001 Raf Simons Riot Riot Riot Bomber", categoryId: "designer-archive", brand: "Raf Simons", rewardPoints: 1200, requestedBy: "RunwayLedger", notes: "라벨, 안감, 하드웨어, 런웨이 레퍼런스 디테일을 찾고 있습니다." },
  { id: "rare-4", title: "Carhartt J97 MOS Blanket Lined Detroit Jacket", categoryId: "workwear", brand: "Carhartt", rewardPoints: 650, requestedBy: "DuckCanvasLab", notes: "파티나, 탭 위치, 라이닝 마모 비교를 위한 페이드 개체가 필요합니다." },
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
  const direction = product.priceChangePercent >= 0 ? "상승했습니다" : "완화되었습니다";
  const construction = tag?.stitchType.toLowerCase() ?? "period construction";
  return {
    whyPriceChanged: `${brand?.name}의 검증된 ${construction} 디테일 개체가 더 명확한 생산연도 신뢰도를 바탕으로 거래되면서 가격이 ${direction}.`,
    historicalContext: `${category?.name} 컬렉터들은 태그 연대, 제조국, 시대별 사건을 활용해 오리지널 아티팩트와 이후 오마주를 구분합니다.`,
    collectorDemand: product.rarityScore > 82 ? "수요는 오리지널 라벨, 출처, 희귀 변형을 중시하는 고급 컬렉터에게 집중되어 있습니다." : "수요는 넓지만 컨디션에 민감하며, 구매자는 프리미엄을 지불하기 전 여러 마켓 거래를 비교합니다.",
    marketSentiment: product.priceChangePercent > 8 ? "우호적" : product.priceChangePercent < -5 ? "선별적" : "안정적",
    rarityScore: product.rarityScore,
    authenticityConfidence: Math.min(98, Math.round(66 + product.rarityScore / 3)),
    investmentScore: Math.min(100, Math.round(product.rarityScore * 0.55 + product.popularity * 0.35 + Math.max(0, product.priceChangePercent))),
    marketConfidenceScore: Math.min(100, Math.round(62 + product.popularity / 3)),
    futureDemandOutlook: "향후 수요는 문서화된 개체, 커뮤니티 제출 자료, 공개 판매 아카이브에서 비교 가능한 태그가 계속 발견되는지에 달려 있습니다.",
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

