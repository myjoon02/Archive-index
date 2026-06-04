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
  newestAdditions,
  priceHistory,
  productTransactions,
  products,
  rareItemRequests,
  summarizeMarket,
  tags,
  timelineEvents,
  topMovers,
  type CategoryId,
  type CommunitySubmission,
  type Marketplace,
  type Product,
  type SubmissionStatus,
} from "./archiveData";

type View =
  | { page: "home" }
  | { page: "search" }
  | { page: "category"; slug: string }
  | { page: "brand"; slug: string }
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
  if (parts[0] === "product" && parts[1]) return { page: "product", slug: parts[1] };
  if (["search", "submit", "admin", "rare", "generator", "copyright", "about"].includes(parts[0])) return { page: parts[0] as View["page"] } as View;
  return { page: "home" };
};

const currentArchiveYear = new Date().getFullYear();
const invalidTitleKeywords = ["test", "demo", "sample", "placeholder", "unknown"];

const isValidArchiveProduct = (product: Product) => {
  const normalizedTitle = product.name.toLowerCase();
  return product.releaseYear <= currentArchiveYear && !invalidTitleKeywords.some((keyword) => normalizedTitle.includes(keyword));
};

const validProducts = products.filter(isValidArchiveProduct);
const validProductIds = new Set(validProducts.map((product) => product.id));
const validTransactions = archive.transactions.filter((transaction) => validProductIds.has(transaction.productId));
const validTags = tags.filter((tag) => validProductIds.has(tag.productId));
const visibleBrands = brands.filter((brand) => validProducts.some((product) => product.brandId === brand.id));

const searchValidArchive = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return validProducts.slice(0, 24);
  return validProducts
    .filter((product) => {
      const brand = getBrand(product.brandId);
      const tag = getTag(product.tagId);
      return [product.name, product.referenceNumber, product.releaseYear, product.country, product.categoryId, brand?.name, tag?.label, tag?.country]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    })
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
  const [gridColumns, setGridColumnsState] = useState<2 | 3 | 4>(() => {
    const saved = Number(localStorage.getItem("archiveGridColumns"));
    return saved === 2 || saved === 3 || saved === 4 ? saved : 4;
  });

  const setGridColumns = (columns: 2 | 3 | 4) => {
    setGridColumnsState(columns);
    localStorage.setItem("archiveGridColumns", String(columns));
  };

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

  const sharedProps = { navigate, openProduct, favorites, setFavorites, watchlist, setWatchlist, gridColumns, setGridColumns };

  return (
    <div className="app-shell">
      <Header query={query} setQuery={setQuery} navigate={navigate} />
      <main>
        {view.page === "home" && <HomePage {...sharedProps} recent={recent} query={query} setQuery={setQuery} />}
        {view.page === "search" && <SearchPage {...sharedProps} query={query} setQuery={setQuery} />}
        {view.page === "category" && <CategoryPage {...sharedProps} slug={view.slug} />}
        {view.page === "brand" && <BrandPage {...sharedProps} slug={view.slug} />}
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
    { label: "아카이브 기여", path: "/submit" },
    { label: "태그 제보", path: "/submit" },
    { label: "시장 데이터 제보", path: "/submit" },
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
  const marketSummary = summarizeMarket(validTransactions);
  const heroStats = [
    { label: "Products", value: validProducts.length.toLocaleString() },
    { label: "Brands", value: visibleBrands.length.toLocaleString() },
    { label: "Tag Records", value: validTags.length.toLocaleString() },
    { label: "Market Transactions", value: validTransactions.length.toLocaleString() },
  ];
  const categoryCounts = categories.map((category) => ({
    category,
    count: validProducts.filter((product) => product.categoryId === category.id).length,
  }));
  const latestArchive = newestValidAdditions().slice(0, 4);
  const recentSales = validTransactions.slice(-4).reverse();
  const popularTags = ["Single Stitch", "Big E", "Brockum", "MA-1", "M-65", "Selvedge"];
  const recentProducts = props.recent.map((id) => validProducts.find((product) => product.id === id)).filter(Boolean) as Product[];

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    props.navigate("/search");
  };

  return (
    <section className="page-stack home-redesign">
      <section className="archive-hero panel">
        <div className="archive-hero-copy">
          <p className="eyebrow">Vintage Archive + Market Intelligence</p>
          <h1>ARCHIVE INDEX</h1>
          <h2>빈티지 문화와 의류의 역사 데이터베이스</h2>
          <p>
            Archive Index는 빈티지 의류와 서브컬처의 역사, 태그, 생산 배경, 시장 데이터를 기록하는 오픈 아카이브입니다.
          </p>
          <div className="hero-stat-line">
            <strong>{validProducts.length.toLocaleString()} Products</strong>
            <strong>{visibleBrands.length.toLocaleString()} Brands</strong>
            <strong>{validTags.length.toLocaleString()} Tag Records</strong>
          </div>
          <div className="hero-actions">
            <button className="gold-button" onClick={() => props.navigate("/search")}>검색하기</button>
            <button className="ghost-button" onClick={() => document.getElementById("archive-categories")?.scrollIntoView({ behavior: "smooth", block: "start" })}>아카이브 둘러보기</button>
          </div>
        </div>
        <div className="hero-stat-grid">
          {heroStats.map((stat) => <Stat key={stat.label} label={stat.label} value={stat.value} />)}
        </div>
      </section>

      <form className="hero-search panel" onSubmit={submitSearch}>
        <label htmlFor="home-search">검색</label>
        <input
          id="home-search"
          value={props.query}
          onChange={(event) => props.setQuery(event.target.value)}
          placeholder="브랜드, 태그, 연도, 국가, 제품명 검색"
        />
        <p>예시: Levi's 501 / Stussy / M-65 / Brockum / 1992 / Raf Simons</p>
      </form>

      <section id="archive-categories" className="category-nav-section panel">
        <SectionTitle eyebrow="Archive Navigation" title="카테고리별 아카이브" />
        <div className="category-grid category-nav-grid">
          {categoryCounts.map(({ category, count }) => (
            <button className="category-card panel" key={category.id} onClick={() => props.navigate(`/category/${category.slug}`)}>
              <span className="eyebrow">{count.toLocaleString()}+ 레퍼런스</span>
              <h2>{category.name}</h2>
              <p>{category.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="data-dashboard-grid">
        <div className="panel data-list-card">
          <SectionTitle eyebrow="Latest Archive" title="최근 추가된 아카이브" />
          {latestArchive.map((product) => (
            <button key={product.id} className="data-row" onClick={() => props.openProduct(product)}>
              <span>{product.name}</span>
              <strong>{product.releaseYear}</strong>
            </button>
          ))}
        </div>
        <div className="panel data-list-card">
          <SectionTitle eyebrow="Market Feed" title="최근 거래 기록" />
          {recentSales.map((sale) => {
            const product = validProducts.find((item) => item.id === sale.productId);
            return <button key={sale.id} className="data-row" onClick={() => product && props.openProduct(product)}><span>{product?.name}</span><strong>{currency(sale.price)}</strong></button>;
          })}
        </div>
        <div className="panel data-list-card tag-cloud-card">
          <SectionTitle eyebrow="Tag Index" title="인기 태그" />
          <div className="tag-cloud">{popularTags.map((tag) => <button key={tag} onClick={() => { props.setQuery(tag); props.navigate("/search"); }}>{tag}</button>)}</div>
        </div>
      </section>

      <section className="split-grid">
        <div className="panel">
          <SectionTitle eyebrow="Market Intelligence" title="실거래 기반 아카이브 데이터" />
          <div className="stat-grid compact">
            <Stat label="중앙값" value={currency(marketSummary.median)} />
            <Stat label="평균" value={currency(marketSummary.average)} />
            <Stat label="거래액" value={currency(marketSummary.salesVolume)} />
            <Stat label="스프레드" value={`${marketSummary.spread}%`} />
          </div>
        </div>
        <div className="panel">
          <SectionTitle eyebrow="Data Quality" title="검증 규칙이 적용된 아카이브" />
          <p>미래 연도와 test, demo, sample, placeholder, unknown 키워드가 포함된 제품은 공개 목록에서 자동으로 제외됩니다.</p>
        </div>
      </section>

      <ProductRail title="가격 변동 상위" products={topValidMovers()} {...props} />
      {!!recentProducts.length && <ProductRail title="최근 본 항목" products={recentProducts} {...props} />}
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
  gridColumns: 2 | 3 | 4;
  setGridColumns: (columns: 2 | 3 | 4) => void;
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
      <div className="section-head product-rail-head"><SectionTitle eyebrow="Search Results" title={`${results.length}개 검색 결과`} /><GridToggle gridColumns={props.gridColumns} setGridColumns={props.setGridColumns} /></div><div className={`product-grid grid-${props.gridColumns}`}>{results.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
    </section>
  );
}

function CategoryPage(props: SharedProps & { slug: string }) {
  const category = getCategoryBySlug(props.slug) ?? categories[0];
  const categoryProducts = validProducts.filter((product) => product.categoryId === category.id);
  const categoryBrands = brands.filter((brand) => brand.categoryId === category.id);
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
  const events = categoryHistoricalEvents(category.id);
  const summary = summarizeMarket(validTransactions.filter((sale) => getProduct(sale.productId)?.categoryId === category.id));

  return (
    <section className="page-stack category-redesign">
      <PageHero eyebrow="Category Archive" title={category.name} description={category.description} />

      <section className="panel category-intro-card">
        <SectionTitle eyebrow="카테고리 소개" title={`${category.name} 데이터베이스`} />
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
        <div className="section-head product-rail-head"><SectionTitle eyebrow="View" title="보기 방식" /><GridToggle gridColumns={props.gridColumns} setGridColumns={props.setGridColumns} /></div><div className={`product-grid dense grid-${props.gridColumns}`}>{visible.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </section>
    </section>
  );
}

function BrandPage(props: SharedProps & { slug: string }) {
  const brand = getBrandBySlug(props.slug) ?? brands[0];
  const brandProducts = validProducts.filter((product) => product.brandId === brand.id);
  const brandTags = tags.filter((tag) => tag.brandId === brand.id);
  const summary = summarizeMarket(validTransactions.filter((sale) => getProduct(sale.productId)?.brandId === brand.id));
  const events = timelineEvents.filter((event) => event.brandId === brand.id || event.categoryId === brand.categoryId).slice(0, 7);

  return (
    <section className="page-stack">
      <PageHero eyebrow={`${brand.country} / 설립 ${brand.foundingYear}년`} title={brand.name} description={brand.history} />
      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="주요 순간" title="브랜드 역사" /><ul className="timeline-list small">{brand.keyMoments.map((moment) => <li key={moment}>{moment}</li>)}</ul></div>
        <div className="panel"><SectionTitle eyebrow="제조 국가" title="생산 지역" /><div className="pill-row">{brand.manufacturingCountries.map((country) => <span key={country}>{country}</span>)}</div><p>{getCategory(brand.categoryId)?.marketNarrative}</p></div>
      </section>
      <Timeline events={events} />
      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="태그 변화" title="라벨 연대 구간" />{brand.tagEvolution.map((item) => <p className="note" key={item}>{item}</p>)}</div>
        <div className="panel"><SectionTitle eyebrow="인증 가이드" title="확인해야 할 요소" /><ul className="check-list">{brand.authenticationGuide.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>
      <section className="panel"><SectionTitle eyebrow="가격 추세" title="브랜드 마켓 요약" /><div className="stat-grid compact"><Stat label="중앙값" value={currency(summary.median)} /><Stat label="평균" value={currency(summary.average)} /><Stat label="최고 거래가" value={currency(summary.highest)} /><Stat label="유동성" value={liquidityLabel(summary.liquidity)} /></div></section>
      <section className="panel"><SectionTitle eyebrow="태그 아카이브" title="뮤지엄 스타일 라벨 기록" /><div className="tag-grid">{brandTags.map((tag) => <TagCard key={tag.id} tagId={tag.id} />)}</div></section>
      <ProductRail title="희귀 아이템 및 관련 제품" products={brandProducts.slice(0, 12)} {...props} />
    </section>
  );
}

function ProductPage(props: SharedProps & { slug: string; submissions: CommunitySubmission[] }) {
  const product = validProducts.find((item) => item.slug === props.slug) ?? validProducts[0];
  const brand = getBrand(product.brandId)!;
  const category = getCategory(product.categoryId)!;
  const tag = getTag(product.tagId)!;
  const sales = productTransactions(product.id);
  const summary = summarizeMarket(sales);
  const comparison = marketplaceComparison(sales);
  const [timeframe, setTimeframe] = useState("3년");
  const months = { "30일": 1, "90일": 3, "1년": 12, "3년": 36, "5년": 60, "전체 기간": 84 }[timeframe] ?? 36;
  const history = priceHistory(product, months);
  const analysis = aiMarketAnalysis(product);
  const examples = props.submissions.filter((submission) => submission.productId === product.id && submission.status === "Approved");
  const related = validProducts.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 8);

  return (
    <section className="page-stack">
      <div className="product-layout">
        <div className="panel sticky-panel"><ArchiveImage product={product} /><div className="cta-stack"><button className="gold-button" onClick={() => props.navigate("/submit")}>아카이브에 기여하기</button><button className="ghost-button" onClick={() => props.navigate("/copyright")}>저작권 문제 신고</button></div></div>
        <div className="product-main panel">
          <p className="eyebrow">{category.name} / {product.referenceNumber}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="stat-grid compact"><Stat label="출시/생산 연도" value={String(product.releaseYear)} /><Stat label="카테고리" value={category.name} /><Stat label="마켓 가격" value={currency(product.marketPrice)} /><Stat label="가격 추세" value={percent(product.priceChangePercent)} tone={product.priceChangePercent >= 0 ? "up" : "down"} /><Stat label="Rarity score" value={`${product.rarityScore}/100`} /><Stat label="Popularity" value={`${product.popularity}/100`} /></div>
          <div className="two-column-copy"><InfoPanel title="역사적 의미" text={product.historicalSignificance} /><InfoPanel title="Cultural impact" text={product.culturalImpact} /><InfoPanel title="생산 디테일" text={product.productionDetails} /><InfoPanel title="알려진 변형" text={product.knownVariants.join(". ")} /></div>
        </div>
      </div>

      <section className="panel">
        <div className="section-head"><SectionTitle eyebrow="가격 히스토리" title="인터랙티브 가격 및 거래량 차트" /><div className="segmented">{["30일", "90일", "1년", "3년", "5년", "전체 기간"].map((item) => <button className={timeframe === item ? "active" : ""} onClick={() => setTimeframe(item)} key={item}>{item}</button>)}</div></div>
        <div className="chart-grid"><LineChart points={history} valueKey="price" label="가격 그래프" /><BarChart points={history} label="거래량 그래프" /></div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="마켓 인텔리전스" title="다중 마켓 거래 요약" />
        <div className="stat-grid compact"><Stat label="중앙값 price" value={currency(summary.median)} /><Stat label="평균 price" value={currency(summary.average)} /><Stat label="최고 거래가" value={currency(summary.highest)} /><Stat label="최저 거래가" value={currency(summary.lowest)} /><Stat label="거래액" value={currency(summary.salesVolume)} /><Stat label="거래 수" value={summary.transactionCount.toString()} /><Stat label="변동성" value={String(summary.volatility)} /><Stat label="유동성" value={liquidityLabel(summary.liquidity)} /><Stat label="마켓 스프레드" value={`${summary.spread}%`} /></div>
        <div className="market-table">{comparison.map((row) => <div key={row.marketplace}><strong>{row.marketplace}</strong><span>{row.count}건 거래</span><span>{row.average ? currency(row.average) : "공개 비교 거래 없음"}</span></div>)}</div>
      </section>

      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="AI 마켓 분석" title="빈티지 특화 분석 근거" />{Object.entries(analysis).map(([key, value]) => <p className="analysis-line" key={key}><strong>{labelize(key)}:</strong> {String(value)}</p>)}</div>
        <div className="panel"><SectionTitle eyebrow="인증 모듈" title="의류 증거 비교" /><ul className="check-list"><li>태그 비교: {tag.label}, {tag.yearStart}-{tag.yearEnd}, {tag.country}.</li><li>프린트 비교: 잉크 노화, 크랙 방향, 실크스크린 정렬, 바디 호환성을 확인합니다.</li><li>스티치 비교: {tag.stitchType}; 솔기 장력과 실 산화를 확인합니다.</li><li>제조국 비교: 케어라벨 문구, 라벨 언어, 당시 수입 규정을 대조합니다.</li><li>생산 시기 비교: 알려진 변형과 마켓 사례를 기준으로 검증합니다.</li></ul></div>
      </section>

      <section className="panel"><SectionTitle eyebrow="태그 정보" title={tag.label} /><div className="tag-grid"><TagCard tagId={tag.id} /></div></section>

      <section className="panel">
        <SectionTitle eyebrow="커뮤니티 사례" title="동일 아이템에 대한 승인된 컬렉터 제출 자료" />
        <div className="example-grid">{examples.length ? examples.map((example, index) => <CommunityExample key={example.id} example={example} index={index} />) : <p>아직 승인된 사례가 없습니다. 앞면, 뒷면, 태그, 봉제 디테일 사진을 제출해 이 레퍼런스 기록을 도와주세요.</p>}</div>
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
  const [selectedProduct, setSelectedProduct] = useState(validProducts[0].id);
  const [rights, setRights] = useState(false);
  const [photos, setPhotos] = useState(["앞면", "뒷면"]);
  const product = validProducts.find((item) => item.id === selectedProduct)!;

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
  return (
    <section className="page-stack">
      <PageHero eyebrow="아카이브 검토 패널" title="공개 전 커뮤니티 제출 자료를 검토합니다." description="관리자는 승인, 거절, 추가 사진 요청, 중복 항목 병합, 메타데이터 수정을 할 수 있습니다." />
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
  const [productId, setProductId] = useState(validProducts[0].id);
  const [format, setFormat] = useState("인스타그램 캐러셀");
  const product = validProducts.find((item) => item.id === productId)!;
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
        <p>ARCHIVE INDEX는 빈티지 의류와 서브컬처를 기록하는 오픈 아카이브입니다.</p>
        <p>우리는 단순한 마켓플레이스가 아닌 역사적 배경, 생산 정보, 태그와 디테일, 문화적 영향, 시장 데이터를 함께 기록합니다.</p>
        <ul>
          <li>역사적 배경</li>
          <li>생산 정보</li>
          <li>태그와 디테일</li>
          <li>문화적 영향</li>
          <li>시장 데이터</li>
        </ul>
        <p>밀리터리, 워크웨어, 밴드티, 스트리트웨어, 디자이너 아카이브 분야의 레퍼런스를 장기적으로 축적하는 것이 목표입니다.</p>
        <p>우리는 빈티지 문화를 박물관, 도서관, 연구 데이터베이스의 관점으로 보존하고 기록합니다.</p>
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

function ProductRail({ title, products: railProducts, gridColumns, setGridColumns, ...props }: SharedProps & { title: string; products: Product[] }) {
  return (
    <section className="panel product-rail">
      <div className="section-head product-rail-head">
        <SectionTitle eyebrow="Archive Index" title={title} />
        <GridToggle gridColumns={gridColumns} setGridColumns={setGridColumns} />
      </div>
      <div className={`product-grid grid-${gridColumns}`}>{railProducts.map((product) => <ProductCard key={product.id} product={product} gridColumns={gridColumns} setGridColumns={setGridColumns} {...props} />)}</div>
    </section>
  );
}

function GridToggle({ gridColumns, setGridColumns }: { gridColumns: 2 | 3 | 4; setGridColumns: (columns: 2 | 3 | 4) => void }) {
  return (
    <div className="grid-toggle" aria-label="제품 카드 보기 방식">
      {[2, 3, 4].map((columns) => (
        <button key={columns} className={gridColumns === columns ? "active" : ""} onClick={() => setGridColumns(columns as 2 | 3 | 4)}>
          {columns} Columns
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, openProduct, favorites, setFavorites, watchlist, setWatchlist }: SharedProps & { product: Product }) {
  const brand = getBrand(product.brandId)!;
  const category = getCategory(product.categoryId)!;
  const toggle = (list: string[], setter: (ids: string[]) => void) => setter(list.includes(product.id) ? list.filter((id) => id !== product.id) : [...list, product.id]);
  return (
    <article className="product-card">
      <button className="image-button" onClick={() => openProduct(product)}><ArchiveImage product={product} compact /></button>
      <div className="product-card-body"><p className="eyebrow">{brand.name} / {category.name}</p><h3><button onClick={() => openProduct(product)}>{product.name}</button></h3><div className="metric-row"><span>{product.releaseYear}</span><strong>{currency(product.marketPrice)}</strong></div><div className="pill-row"><span>희귀도 {product.rarityScore}</span><span className={product.priceChangePercent >= 0 ? "up" : "down"}>{percent(product.priceChangePercent)}</span></div><div className="card-actions"><button onClick={() => toggle(favorites, setFavorites)}>{favorites.includes(product.id) ? "즐겨찾기됨" : "즐겨찾기"}</button><button onClick={() => toggle(watchlist, setWatchlist)}>{watchlist.includes(product.id) ? "추적 중" : "관심추적"}</button></div></div>
    </article>
  );
}

function ArchiveImage({ product, compact = false }: { product: Product; compact?: boolean }) {
  return <div className={`archive-image ${compact ? "compact" : ""}`}><span>{getCategory(product.categoryId)?.name}</span><strong>{product.releaseYear}</strong><em>{product.referenceNumber}</em><small>직접 제작 / 사용자 업로드 이미지 영역</small></div>;
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
