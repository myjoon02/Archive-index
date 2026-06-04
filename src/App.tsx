import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  aiMarketAnalysis,
  archive,
  brands,
  categories,
  collectorStats,
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
  searchArchive,
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
  | { page: "copyright" };

type SortOption = "Year" | "Price" | "Popularity" | "Rarity";

const parseHash = (): View => {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return { page: "home" };
  if (parts[0] === "category" && parts[1]) return { page: "category", slug: parts[1] };
  if (parts[0] === "brand" && parts[1]) return { page: "brand", slug: parts[1] };
  if (parts[0] === "product" && parts[1]) return { page: "product", slug: parts[1] };
  if (["search", "submit", "admin", "rare", "generator", "copyright"].includes(parts[0])) return { page: parts[0] as View["page"] } as View;
  return { page: "home" };
};

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

  const searchSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate("/search");
  };

  const sharedProps = { navigate, openProduct, favorites, setFavorites, watchlist, setWatchlist };

  return (
    <div className="app-shell">
      <Header query={query} setQuery={setQuery} onSubmit={searchSubmit} navigate={navigate} />
      <main>
        {view.page === "home" && <HomePage {...sharedProps} recent={recent} />}
        {view.page === "search" && <SearchPage {...sharedProps} query={query} setQuery={setQuery} />}
        {view.page === "category" && <CategoryPage {...sharedProps} slug={view.slug} />}
        {view.page === "brand" && <BrandPage {...sharedProps} slug={view.slug} />}
        {view.page === "product" && <ProductPage {...sharedProps} slug={view.slug} submissions={submissions} />}
        {view.page === "submit" && <ContributionPage navigate={navigate} submissions={submissions} setSubmissions={setSubmissions} />}
        {view.page === "admin" && <AdminPage submissions={submissions} setSubmissions={setSubmissions} />}
        {view.page === "rare" && <RareRequestsPage navigate={navigate} />}
        {view.page === "generator" && <ContentGeneratorPage openProduct={openProduct} />}
        {view.page === "copyright" && <CopyrightPage />}
      </main>
      <Footer navigate={navigate} />
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

function Header({ query, setQuery, onSubmit, navigate }: { query: string; setQuery: (value: string) => void; onSubmit: (event: FormEvent) => void; navigate: (path: string) => void }) {
  return (
    <header className="topbar">
      <button className="brand-mark" onClick={() => navigate("/")} aria-label="Archive Index home">
        <span>ARCHIVE</span>
        <strong>INDEX</strong>
      </button>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {categories.map((category) => (
          <button key={category.id} onClick={() => navigate(`/category/${category.slug}`)}>{category.name}</button>
        ))}
      </nav>
      <form className="global-search" onSubmit={onSubmit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="브랜드, 태그, 연도, 카테고리, 국가, 제품명, 레퍼런스 검색..." />
      </form>
      <button className="gold-button" onClick={() => navigate("/submit")}>아카이브에 기여하기</button>
    </header>
  );
}

function HomePage(props: SharedProps & { recent: string[] }) {
  const marketSummary = summarizeMarket(archive.transactions);
  const featured = products.slice(0, 8);
  const recentProducts = props.recent.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[];
  const profitLoss = collectorStats.currentValue - collectorStats.purchasePrice;

  return (
    <section className="page-stack">
      <div className="hero-grid">
        <div className="hero-copy panel">
          <p className="eyebrow">빈티지 의류를 위한 블룸버그 터미널</p>
          <h1>빈티지 의류를 위한 역사 아카이브, 인증 연구소, 마켓 인텔리전스.</h1>
          <p>ARCHIVE INDEX는 마켓플레이스가 아니라, 박물관 수준의 리서치와 커뮤니티 제출 자료, 태그 인증, 다중 마켓 가격 추적을 결합한 리서치 플랫폼입니다.</p>
          <div className="hero-actions">
            <button className="gold-button" onClick={() => props.navigate("/submit")}>아카이브에 기여하기</button>
            <button className="ghost-button" onClick={() => props.navigate("/rare")}>희귀 아이템 요청</button>
            <button className="ghost-button" onClick={() => props.navigate("/generator")}>콘텐츠 생성</button>
          </div>
        </div>
        <div className="terminal-card panel">
          <p className="eyebrow">아카이브 데이터베이스</p>
          <div className="metric-row"><span>카테고리</span><strong>{categories.length}</strong></div>
          <div className="metric-row"><span>브랜드</span><strong>{brands.length}</strong></div>
          <div className="metric-row"><span>제품</span><strong>{products.length.toLocaleString()}</strong></div>
          <div className="metric-row"><span>태그 기록</span><strong>{tags.length}</strong></div>
          <div className="metric-row"><span>마켓 거래</span><strong>{archive.transactions.length.toLocaleString()}</strong></div>
          <div className="metric-row"><span>거래 규모</span><strong>{currency(marketSummary.salesVolume)}</strong></div>
        </div>
      </div>

      <section className="category-grid">
        {categories.map((category) => (
          <button className="category-card panel" key={category.id} onClick={() => props.navigate(`/category/${category.slug}`)}>
            <span className="eyebrow">{category.heroStat}</span>
            <h2>{category.name}</h2>
            <p>{category.description}</p>
            <small>{category.marketNarrative}</small>
          </button>
        ))}
      </section>

      <section className="split-grid">
        <div className="panel">
          <SectionTitle eyebrow="컬렉션 트래커" title="개인 보유 가치, 알림, 관심 목록" />
          <div className="stat-grid compact">
            <Stat label="현재 가치" value={currency(collectorStats.currentValue)} />
            <Stat label="구매가" value={currency(collectorStats.purchasePrice)} />
            <Stat label="손익" value={`${profitLoss >= 0 ? "+" : ""}${currency(profitLoss)}`} tone={profitLoss >= 0 ? "up" : "down"} />
            <Stat label="보험 평가액" value={currency(collectorStats.insuranceValue)} />
            <Stat label="저장된 검색" value={collectorStats.savedSearches.toString()} />
            <Stat label="마켓 알림" value={collectorStats.marketAlerts.toString()} />
          </div>
        </div>
        <div className="panel">
          <SectionTitle eyebrow="AI 마켓 분석" title="빈티지 특화 신호" />
          <ul className="check-list">
            <li>생산량, 거래 빈도, 남아 있는 개체 수, 수요를 기반으로 희귀도 점수를 산정합니다.</li>
            <li>태그 연도대, 스티치 구조, 제조국, 생산 편차로 진품 신뢰도를 추정합니다.</li>
            <li>거래 수, 스프레드, 유동성, 비교 가능한 아카이브 사례를 기반으로 마켓 신뢰도를 계산합니다.</li>
          </ul>
        </div>
      </section>

      <ProductRail title="가격 변동 상위" products={topMovers()} {...props} />
      <ProductRail title="주요 신규 아카이브" products={featured} {...props} />
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
}

function SearchPage(props: SharedProps & { query: string; setQuery: (value: string) => void }) {
  const [category, setCategory] = useState("All");
  const [year, setYear] = useState("All");
  const [country, setCountry] = useState("All");
  const results = useMemo(() => {
    return searchArchive(props.query).filter((product) => {
      const categoryPass = category === "All" || product.categoryId === category;
      const yearPass = year === "All" || String(product.releaseYear).startsWith(year);
      const countryPass = country === "All" || product.country === country;
      return categoryPass && yearPass && countryPass;
    });
  }, [props.query, category, year, country]);

  return (
    <section className="page-stack">
      <PageHero eyebrow="통합 검색" title="브랜드, 태그, 연도, 카테고리, 국가, 제품명, 레퍼런스 번호로 아카이브를 검색하세요." action={<button className="gold-button" onClick={() => props.navigate("/submit")}>아카이브에 기여하기</button>} />
      <div className="panel filter-panel">
        <input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="예: Nirvana, Carhartt, 1994, Japan, single stitch, AI-BAN..." />
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">전체</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={year} onChange={(event) => setYear(event.target.value)}><option value="All">전체</option>{["194", "195", "196", "197", "198", "199", "200"].map((item) => <option key={item}>{item}0년대</option>)}</select>
        <select value={country} onChange={(event) => setCountry(event.target.value)}><option value="All">전체</option>{Array.from(new Set(products.map((item) => item.country))).map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="product-grid">{results.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>
    </section>
  );
}

function CategoryPage(props: SharedProps & { slug: string }) {
  const category = getCategoryBySlug(props.slug) ?? categories[0];
  const categoryProducts = products.filter((product) => product.categoryId === category.id);
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
  const events = timelineEvents.filter((event) => event.categoryId === category.id).slice(0, 8);
  const summary = summarizeMarket(archive.transactions.filter((sale) => getProduct(sale.productId)?.categoryId === category.id));

  return (
    <section className="page-stack">
      <PageHero eyebrow="카테고리 아카이브" title={category.name} description={category.description} action={<button className="gold-button" onClick={() => props.navigate("/submit")}>아카이브에 기여하기</button>} />
      <section className="split-grid">
        <InfoPanel title="역사적 의미" text={category.historicalSignificance} />
        <InfoPanel title="문화적 영향" text={category.culturalInfluence} />
      </section>
      <section className="panel">
        <SectionTitle eyebrow="마켓 개요" title="카테고리 유동성과 가격 인텔리전스" />
        <div className="stat-grid compact"><Stat label="중앙값" value={currency(summary.median)} /><Stat label="평균" value={currency(summary.average)} /><Stat label="최고 거래가" value={currency(summary.highest)} /><Stat label="최저 거래가" value={currency(summary.lowest)} /><Stat label="거래액" value={currency(summary.salesVolume)} /><Stat label="거래 수" value={summary.transactionCount.toLocaleString()} /><Stat label="변동성" value={String(summary.volatility)} /><Stat label="스프레드" value={`${summary.spread}%`} /></div>
      </section>
      <Timeline events={events} />
      <section className="panel">
        <SectionTitle eyebrow="Representative 브랜드" title="중요 제작사와 문화적 기준점" />
        <div className="brand-grid">{categoryBrands.map((brand) => <button key={brand.id} onClick={() => props.navigate(`/brand/${brand.slug}`)}><strong>{brand.name}</strong><span>{brand.foundingYear} / {brand.country}</span></button>)}</div>
      </section>
      <ProductRail title="가격 변동 상위" products={topMovers(category.id)} {...props} />
      <ProductRail title="최신 아카이브 추가" products={newestAdditions(category.id)} {...props} />
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
  const brandProducts = products.filter((product) => product.brandId === brand.id);
  const brandTags = tags.filter((tag) => tag.brandId === brand.id);
  const summary = summarizeMarket(archive.transactions.filter((sale) => getProduct(sale.productId)?.brandId === brand.id));
  const events = timelineEvents.filter((event) => event.brandId === brand.id || event.categoryId === brand.categoryId).slice(0, 7);

  return (
    <section className="page-stack">
      <PageHero eyebrow={`${brand.country} / 설립 ${brand.foundingYear}년`} title={brand.name} description={brand.history} action={<button className="gold-button" onClick={() => props.navigate("/submit")}>아카이브에 기여하기</button>} />
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
  const product = getProductBySlug(props.slug) ?? products[0];
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
  const related = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 8);

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
  const [selectedProduct, setSelectedProduct] = useState(products[0].id);
  const [rights, setRights] = useState(false);
  const [photos, setPhotos] = useState(["앞면", "뒷면"]);
  const product = products.find((item) => item.id === selectedProduct)!;

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
      <PageHero eyebrow="커뮤니티 아카이브 제출" title="마켓플레이스 매물이 아닌, 뮤지엄 스타일 기록을 제출하세요." description="컬렉터, 빈티지 셀러, 애호가는 의류 증거 자료를 제출할 수 있으며, 승인된 제출물만 공개됩니다." />
      {submitted && <div className="success-banner panel"><strong>제출이 접수되었습니다.</strong> 상태: 검토 대기. 큐레이터는 승인 전 추가 사진 요청, 중복 병합, 메타데이터 수정을 할 수 있습니다.</div>}
      <form className="panel form-grid" onSubmit={submit}>
        <label>Category<select name="category" defaultValue={product.categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>관련 제품<select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>{products.slice(0, 250).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
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
      <div className="review-list">{submissions.slice(0, 24).map((submission) => { const product = products.find((item) => item.id === submission.productId)!; return <div className="panel review-card" key={submission.id}><div><p className="eyebrow">{statusLabel(submission.status)}</p><h3>{product.name}</h3><p>기여자: {submission.contributor} / {submission.contributionDate}. 권리 동의: {submission.rightsAgreementAt}</p><p>{submission.authenticationNotes}</p></div><div className="review-actions"><button onClick={() => updateStatus(submission.id, "Approved")}>승인</button><button onClick={() => updateStatus(submission.id, "Rejected")}>거절</button><button onClick={() => updateStatus(submission.id, "Flagged")}>추가 사진 요청</button><button>중복 항목 병합</button><button>메타데이터 수정</button></div></div>; })}</div>
    </section>
  );
}

function RareRequestsPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="page-stack">
      <PageHero eyebrow="희귀 아이템 요청 시스템" title="누락된 아카이브 아이템을 요청하고 검증된 기여자에게 포인트를 보상합니다." action={<button className="gold-button" onClick={() => navigate("/submit")}>검증 사례 업로드</button>} />
      <div className="request-grid">{rareItemRequests.map((request) => <div className="panel" key={request.id}><p className="eyebrow">찾는 중</p><h2>{request.title}</h2><p>{request.notes}</p><div className="metric-row"><span>Brand</span><strong>{request.brand}</strong></div><div className="metric-row"><span>Category</span><strong>{getCategory(request.categoryId)?.name}</strong></div><div className="metric-row"><span>보상</span><strong>{request.rewardPoints} pts</strong></div><button className="gold-button" onClick={() => navigate("/submit")}>사례 기여하기</button></div>)}</div>
    </section>
  );
}

function ContentGeneratorPage({ openProduct }: { openProduct: (product: Product) => void }) {
  const [productId, setProductId] = useState(products[0].id);
  const [format, setFormat] = useState("인스타그램 캐러셀");
  const product = products.find((item) => item.id === productId)!;
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
      <div className="panel filter-panel"><select value={productId} onChange={(event) => setProductId(event.target.value)}>{products.slice(0, 300).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select value={format} onChange={(event) => setFormat(event.target.value)}>{["인스타그램 캐러셀", "인스타그램 스토리", "마켓 리포트", "브랜드 스포트라이트", "태그 아카이브 시리즈"].map((item) => <option key={item}>{item}</option>)}</select><button className="ghost-button" onClick={() => openProduct(product)}>제품 페이지 열기</button></div>
      <div className="slide-grid">{slides.map((slide, index) => <article className="slide-card" key={slide.title}><span>슬라이드 {index + 1}</span><h3>{slide.title}</h3><p>{slide.body}</p></article>)}</div>
      <div className="panel export-panel"><strong>{format} 내보내기</strong><p>내보내기 옵션: PNG, PDF, Canva 호환 형식.</p><div className="hero-actions"><button className="gold-button">PNG 내보내기</button><button className="ghost-button">PDF 내보내기</button><button className="ghost-button">Canva 호환</button></div></div>
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
  return <section className="panel"><SectionTitle eyebrow="Archive Index" title={title} /><div className="product-grid">{railProducts.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div></section>;
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
  return <div className="filter-panel nested"><select value={filters.brand} onChange={(event) => update("brand", event.target.value)}><option value="All">전체</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><select value={filters.year} onChange={(event) => update("year", event.target.value)}><option value="All">전체</option>{["194", "195", "196", "197", "198", "199", "200"].map((item) => <option key={item} value={item}>{item}0년대</option>)}</select><select value={filters.country} onChange={(event) => update("country", event.target.value)}><option value="All">전체</option>{Array.from(new Set(products.map((item) => item.country))).map((item) => <option key={item}>{item}</option>)}</select><select value={filters.condition} onChange={(event) => update("condition", event.target.value)}><option value="All">전체</option>{["Deadstock", "Excellent", "Very Good", "Good", "Fair", "Distressed"].map((item) => <option key={item}>{item}</option>)}</select><select value={filters.marketplace} onChange={(event) => update("marketplace", event.target.value)}><option value="All">전체</option>{marketplaces.map((item) => <option key={item}>{item}</option>)}</select><select value={filters.price} onChange={(event) => update("price", event.target.value)}><option value="All">전체</option><option>Under $250</option><option>$250-$750</option><option>$750+</option></select></div>;
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

function Footer({ navigate }: { navigate: (path: string) => void }) {
  return <footer className="footer"><div><strong>ARCHIVE INDEX</strong><p>박물관, 도서관, 리서치 데이터베이스가 먼저이고, 마켓 인텔리전스는 그 다음입니다.</p></div><div><button onClick={() => navigate("/submit")}>Contribute</button><button onClick={() => navigate("/admin")}>검토 패널</button><button onClick={() => navigate("/copyright")}>저작권 삭제 요청</button></div></footer>;
}

export default App;
