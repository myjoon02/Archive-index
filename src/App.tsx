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
    const onHash = () => setView(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path === "/" ? "" : path;
    setView(parseHash());
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brand, tag, year, category, country, product, reference..." />
      </form>
      <button className="gold-button" onClick={() => navigate("/submit")}>Contribute to Archive</button>
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
          <p className="eyebrow">Bloomberg Terminal for Vintage Clothing</p>
          <h1>Historical archive, authentication lab, and market intelligence for vintage garments.</h1>
          <p>ARCHIVE INDEX combines museum-grade research, community submissions, tag authentication, and multi-market price tracking without becoming a marketplace.</p>
          <div className="hero-actions">
            <button className="gold-button" onClick={() => props.navigate("/submit")}>Contribute to Archive</button>
            <button className="ghost-button" onClick={() => props.navigate("/rare")}>Rare Item Requests</button>
            <button className="ghost-button" onClick={() => props.navigate("/generator")}>Generate Content</button>
          </div>
        </div>
        <div className="terminal-card panel">
          <p className="eyebrow">Archive database</p>
          <div className="metric-row"><span>Categories</span><strong>{categories.length}</strong></div>
          <div className="metric-row"><span>Brands</span><strong>{brands.length}</strong></div>
          <div className="metric-row"><span>Products</span><strong>{products.length.toLocaleString()}</strong></div>
          <div className="metric-row"><span>Tag records</span><strong>{tags.length}</strong></div>
          <div className="metric-row"><span>Market transactions</span><strong>{archive.transactions.length.toLocaleString()}</strong></div>
          <div className="metric-row"><span>Market volume</span><strong>{currency(marketSummary.salesVolume)}</strong></div>
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
          <SectionTitle eyebrow="Collection Tracker" title="Personal value, alerts, and watchlist" />
          <div className="stat-grid compact">
            <Stat label="Current value" value={currency(collectorStats.currentValue)} />
            <Stat label="Purchase price" value={currency(collectorStats.purchasePrice)} />
            <Stat label="Profit / loss" value={`${profitLoss >= 0 ? "+" : ""}${currency(profitLoss)}`} tone={profitLoss >= 0 ? "up" : "down"} />
            <Stat label="Insurance value" value={currency(collectorStats.insuranceValue)} />
            <Stat label="Saved searches" value={collectorStats.savedSearches.toString()} />
            <Stat label="Market alerts" value={collectorStats.marketAlerts.toString()} />
          </div>
        </div>
        <div className="panel">
          <SectionTitle eyebrow="AI Market Analysis" title="Vintage-specific signals" />
          <ul className="check-list">
            <li>Rarity score from production volume, sales frequency, surviving examples, and demand.</li>
            <li>Authenticity confidence from tag windows, stitch construction, country, and production variance.</li>
            <li>Market confidence based on transaction count, spread, liquidity, and comparable archive examples.</li>
          </ul>
        </div>
      </section>

      <ProductRail title="Top movers" products={topMovers()} {...props} />
      <ProductRail title="Featured archive additions" products={featured} {...props} />
      {!!recentProducts.length && <ProductRail title="Recently viewed" products={recentProducts} {...props} />}
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
      <PageHero eyebrow="Global Search" title="Search the archive by brand, tag, year, category, country, product name, or reference number." action={<button className="gold-button" onClick={() => props.navigate("/submit")}>Contribute to Archive</button>} />
      <div className="panel filter-panel">
        <input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Try Nirvana, Carhartt, 1994, Japan, single stitch, AI-BAN..." />
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={year} onChange={(event) => setYear(event.target.value)}><option>All</option>{["194", "195", "196", "197", "198", "199", "200"].map((item) => <option key={item}>{item}0s</option>)}</select>
        <select value={country} onChange={(event) => setCountry(event.target.value)}><option>All</option>{Array.from(new Set(products.map((item) => item.country))).map((item) => <option key={item}>{item}</option>)}</select>
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
      <PageHero eyebrow="Category Archive" title={category.name} description={category.description} action={<button className="gold-button" onClick={() => props.navigate("/submit")}>Contribute to Archive</button>} />
      <section className="split-grid">
        <InfoPanel title="Historical significance" text={category.historicalSignificance} />
        <InfoPanel title="Cultural influence" text={category.culturalInfluence} />
      </section>
      <section className="panel">
        <SectionTitle eyebrow="Market Overview" title="Category liquidity and price intelligence" />
        <div className="stat-grid compact"><Stat label="Median" value={currency(summary.median)} /><Stat label="Average" value={currency(summary.average)} /><Stat label="Highest sale" value={currency(summary.highest)} /><Stat label="Lowest sale" value={currency(summary.lowest)} /><Stat label="Sales volume" value={currency(summary.salesVolume)} /><Stat label="Transactions" value={summary.transactionCount.toLocaleString()} /><Stat label="Volatility" value={String(summary.volatility)} /><Stat label="Spread" value={`${summary.spread}%`} /></div>
      </section>
      <Timeline events={events} />
      <section className="panel">
        <SectionTitle eyebrow="Representative Brands" title="Important makers and cultural anchors" />
        <div className="brand-grid">{categoryBrands.map((brand) => <button key={brand.id} onClick={() => props.navigate(`/brand/${brand.slug}`)}><strong>{brand.name}</strong><span>{brand.foundingYear} / {brand.country}</span></button>)}</div>
      </section>
      <ProductRail title="Top movers" products={topMovers(category.id)} {...props} />
      <ProductRail title="Newest archive additions" products={newestAdditions(category.id)} {...props} />
      <section className="panel">
        <div className="section-head"><div><p className="eyebrow">Product Archive</p><h2>{categoryProducts.length.toLocaleString()} indexed references</h2><p>Displaying 10 pages with 30 products per page, optimized for research and comparison.</p></div><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>{["Year", "Price", "Popularity", "Rarity"].map((item) => <option key={item}>{item}</option>)}</select></div>
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
      <PageHero eyebrow={`${brand.country} / Founded ${brand.foundingYear}`} title={brand.name} description={brand.history} action={<button className="gold-button" onClick={() => props.navigate("/submit")}>Contribute to Archive</button>} />
      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="Key moments" title="Brand history" /><ul className="timeline-list small">{brand.keyMoments.map((moment) => <li key={moment}>{moment}</li>)}</ul></div>
        <div className="panel"><SectionTitle eyebrow="Manufacturing countries" title="Production geography" /><div className="pill-row">{brand.manufacturingCountries.map((country) => <span key={country}>{country}</span>)}</div><p>{getCategory(brand.categoryId)?.marketNarrative}</p></div>
      </section>
      <Timeline events={events} />
      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="Tag evolution" title="Label windows" />{brand.tagEvolution.map((item) => <p className="note" key={item}>{item}</p>)}</div>
        <div className="panel"><SectionTitle eyebrow="Authentication guide" title="What to verify" /><ul className="check-list">{brand.authenticationGuide.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>
      <section className="panel"><SectionTitle eyebrow="Price Trends" title="Brand market summary" /><div className="stat-grid compact"><Stat label="Median" value={currency(summary.median)} /><Stat label="Average" value={currency(summary.average)} /><Stat label="Highest sale" value={currency(summary.highest)} /><Stat label="Liquidity" value={summary.liquidity} /></div></section>
      <section className="panel"><SectionTitle eyebrow="Tag archive" title="Museum-style label records" /><div className="tag-grid">{brandTags.map((tag) => <TagCard key={tag.id} tagId={tag.id} />)}</div></section>
      <ProductRail title="Rare items and related products" products={brandProducts.slice(0, 12)} {...props} />
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
  const [timeframe, setTimeframe] = useState("3 Years");
  const months = { "30 Days": 1, "90 Days": 3, "1 Year": 12, "3 Years": 36, "5 Years": 60, "All Time": 84 }[timeframe] ?? 36;
  const history = priceHistory(product, months);
  const analysis = aiMarketAnalysis(product);
  const examples = props.submissions.filter((submission) => submission.productId === product.id && submission.status === "Approved");
  const related = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 8);

  return (
    <section className="page-stack">
      <div className="product-layout">
        <div className="panel sticky-panel"><ArchiveImage product={product} /><div className="cta-stack"><button className="gold-button" onClick={() => props.navigate("/submit")}>Contribute to Archive</button><button className="ghost-button" onClick={() => props.navigate("/copyright")}>Report Copyright Issue</button></div></div>
        <div className="product-main panel">
          <p className="eyebrow">{category.name} / {product.referenceNumber}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="stat-grid compact"><Stat label="Release year" value={String(product.releaseYear)} /><Stat label="Category" value={category.name} /><Stat label="Market price" value={currency(product.marketPrice)} /><Stat label="Price trend" value={percent(product.priceChangePercent)} tone={product.priceChangePercent >= 0 ? "up" : "down"} /><Stat label="Rarity score" value={`${product.rarityScore}/100`} /><Stat label="Popularity" value={`${product.popularity}/100`} /></div>
          <div className="two-column-copy"><InfoPanel title="Historical significance" text={product.historicalSignificance} /><InfoPanel title="Cultural impact" text={product.culturalImpact} /><InfoPanel title="Production details" text={product.productionDetails} /><InfoPanel title="Known variants" text={product.knownVariants.join(". ")} /></div>
        </div>
      </div>

      <section className="panel">
        <div className="section-head"><SectionTitle eyebrow="Price History" title="Interactive price and volume charts" /><div className="segmented">{["30 Days", "90 Days", "1 Year", "3 Years", "5 Years", "All Time"].map((item) => <button className={timeframe === item ? "active" : ""} onClick={() => setTimeframe(item)} key={item}>{item}</button>)}</div></div>
        <div className="chart-grid"><LineChart points={history} valueKey="price" label="Price graph" /><BarChart points={history} label="Volume graph" /></div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="Market Intelligence" title="Multi-market sales summary" />
        <div className="stat-grid compact"><Stat label="Median price" value={currency(summary.median)} /><Stat label="Average price" value={currency(summary.average)} /><Stat label="Highest sale" value={currency(summary.highest)} /><Stat label="Lowest sale" value={currency(summary.lowest)} /><Stat label="Sales volume" value={currency(summary.salesVolume)} /><Stat label="Transactions" value={summary.transactionCount.toString()} /><Stat label="Volatility" value={String(summary.volatility)} /><Stat label="Liquidity" value={summary.liquidity} /><Stat label="Market spread" value={`${summary.spread}%`} /></div>
        <div className="market-table">{comparison.map((row) => <div key={row.marketplace}><strong>{row.marketplace}</strong><span>{row.count} sales</span><span>{row.average ? currency(row.average) : "No public comp"}</span></div>)}</div>
      </section>

      <section className="split-grid">
        <div className="panel"><SectionTitle eyebrow="AI Market Analysis" title="Vintage-specific reasoning" />{Object.entries(analysis).map(([key, value]) => <p className="analysis-line" key={key}><strong>{labelize(key)}:</strong> {String(value)}</p>)}</div>
        <div className="panel"><SectionTitle eyebrow="Authentication Module" title="Compare garment evidence" /><ul className="check-list"><li>Tag comparison: {tag.label}, {tag.yearStart}-{tag.yearEnd}, {tag.country}.</li><li>Print comparison: examine ink aging, cracking direction, screen registration, and blank compatibility.</li><li>Stitch comparison: {tag.stitchType}; verify seam tension and thread oxidation.</li><li>Country comparison: match care text, label language, and period import rules.</li><li>Production period comparison: validate against known variants and market examples.</li></ul></div>
      </section>

      <section className="panel"><SectionTitle eyebrow="Tag Information" title={tag.label} /><div className="tag-grid"><TagCard tagId={tag.id} /></div></section>

      <section className="panel">
        <SectionTitle eyebrow="Community Examples" title="Approved collector submissions of the same item" />
        <div className="example-grid">{examples.length ? examples.map((example, index) => <CommunityExample key={example.id} example={example} index={index} />) : <p>No approved examples yet. Contribute front, back, tag, and construction detail photos to help document this reference.</p>}</div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="Marketplace Listings" title="Text-only external references" />
        <div className="link-grid">{marketplaces.slice(0, 8).map((marketplace) => <a key={marketplace} href={product.marketplaceLinks[marketplace]} target="_blank" rel="noreferrer">{marketplace}</a>)}<a href={`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">Pinterest Search</a><a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(product.name)}`} target="_blank" rel="noreferrer">Google Images Search</a></div>
      </section>
      <ProductRail title="Related items" products={related} {...props} />
    </section>
  );
}

function ContributionPage({ navigate, submissions, setSubmissions }: { navigate: (path: string) => void; submissions: CommunitySubmission[]; setSubmissions: (items: CommunitySubmission[]) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(products[0].id);
  const [rights, setRights] = useState(false);
  const [photos, setPhotos] = useState(["Front View", "Back View"]);
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
      <PageHero eyebrow="Community Archive Submission" title="Contribute museum-style records, not marketplace listings." description="Collectors, sellers, and enthusiasts can submit garment evidence for moderator review. Only approved submissions appear publicly." />
      {submitted && <div className="success-banner panel"><strong>Submission received.</strong> Status: Pending Review. Curators may request more photos, merge duplicates, or edit metadata before approval.</div>}
      <form className="panel form-grid" onSubmit={submit}>
        <label>Category<select name="category" defaultValue={product.categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Related product<select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>{products.slice(0, 250).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Brand<input name="brand" defaultValue={getBrand(product.brandId)?.name} /></label>
        <label>Product Name<input name="productName" defaultValue={product.name} /></label>
        <label>Production Year<input name="year" type="number" defaultValue={product.releaseYear} /></label>
        <label>Manufacturing Country<input name="country" defaultValue={product.country} /></label>
        <label>Tag Information<input name="tagInfo" defaultValue={getTag(product.tagId)?.label} /></label>
        <label>Condition<select name="condition"><option>Deadstock</option><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option><option>Distressed</option></select></label>
        <label>Size<input name="size" defaultValue={product.size} /></label>
        <label>Tag Type<input name="tagType" placeholder="Single stitch / double stitch / woven label" /></label>
        <label>Made In<input name="madeIn" defaultValue={product.country} /></label>
        <label>Known Variants<input name="variants" defaultValue={product.knownVariants.join(", ")} /></label>
        <label>Measurements<input name="measurements" placeholder="Pit to pit, length, shoulder, sleeve" /></label>
        <label className="wide">Authentication Notes<textarea name="authNotes" placeholder="Tag, stitching, print, country, production period, and fake indicators." /></label>
        <label className="wide">Notes<textarea name="notes" placeholder="Ownership history, provenance, repairs, fade, distressing, construction details." /></label>
        <div className="wide upload-zone"><strong>Drag and drop photos</strong><p>Required: Front View and Back View. Optional: Tag Photo, Stitching Detail, Print Detail, Care Label, Factory Label, Packaging. Maximum 20 photos.</p><div className="photo-options">{["Front View", "Back View", "Tag Photo", "Stitching Detail", "Print Detail", "Care Label", "Factory Label", "Packaging"].map((photo) => <label key={photo}><input type="checkbox" checked={photos.includes(photo)} disabled={["Front View", "Back View"].includes(photo)} onChange={(event) => setPhotos(event.target.checked ? [...photos, photo] : photos.filter((item) => item !== photo))} />{photo}</label>)}</div></div>
        <label className="wide checkbox-line"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} /> I confirm that I own these photos or have permission to upload them.</label>
        <div className="wide form-actions"><button className="gold-button" disabled={!rights}>Submit for Pending Review</button><button type="button" className="ghost-button" onClick={() => navigate("/copyright")}>Photo rights policy</button></div>
      </form>
    </section>
  );
}

function AdminPage({ submissions, setSubmissions }: { submissions: CommunitySubmission[]; setSubmissions: (items: CommunitySubmission[]) => void }) {
  const updateStatus = (id: string, status: SubmissionStatus) => setSubmissions(submissions.map((item) => item.id === id ? { ...item, status } : item));
  return (
    <section className="page-stack">
      <PageHero eyebrow="Archive Review Panel" title="Moderate community submissions before public release." description="Admins can approve, reject, request more photos, merge duplicate entries, and edit metadata." />
      <div className="review-list">{submissions.slice(0, 24).map((submission) => { const product = products.find((item) => item.id === submission.productId)!; return <div className="panel review-card" key={submission.id}><div><p className="eyebrow">{submission.status}</p><h3>{product.name}</h3><p>Contributed by {submission.contributor} on {submission.contributionDate}. Rights agreement: {submission.rightsAgreementAt}</p><p>{submission.authenticationNotes}</p></div><div className="review-actions"><button onClick={() => updateStatus(submission.id, "Approved")}>Approve</button><button onClick={() => updateStatus(submission.id, "Rejected")}>Reject</button><button onClick={() => updateStatus(submission.id, "Flagged")}>Request More Photos</button><button>Merge Duplicate Entries</button><button>Edit Metadata</button></div></div>; })}</div>
    </section>
  );
}

function RareRequestsPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <section className="page-stack">
      <PageHero eyebrow="Rare Item Request System" title="Request missing archive items and reward verified contributors." action={<button className="gold-button" onClick={() => navigate("/submit")}>Upload Verified Example</button>} />
      <div className="request-grid">{rareItemRequests.map((request) => <div className="panel" key={request.id}><p className="eyebrow">Looking For</p><h2>{request.title}</h2><p>{request.notes}</p><div className="metric-row"><span>Brand</span><strong>{request.brand}</strong></div><div className="metric-row"><span>Category</span><strong>{getCategory(request.categoryId)?.name}</strong></div><div className="metric-row"><span>Reward</span><strong>{request.rewardPoints} pts</strong></div><button className="gold-button" onClick={() => navigate("/submit")}>Contribute Example</button></div>)}</div>
    </section>
  );
}

function ContentGeneratorPage({ openProduct }: { openProduct: (product: Product) => void }) {
  const [productId, setProductId] = useState(products[0].id);
  const [format, setFormat] = useState("Instagram Carousel");
  const product = products.find((item) => item.id === productId)!;
  const brand = getBrand(product.brandId)!;
  const tag = getTag(product.tagId)!;
  const summary = summarizeMarket(productTransactions(product.id));
  const slides = [
    { title: "Cover", body: `${product.name} / ${brand.name} / ${product.releaseYear}` },
    { title: "Historical significance", body: product.historicalSignificance },
    { title: "Tag information", body: `${tag.label}. ${tag.stitchType}. Made in ${tag.country}.` },
    { title: "Market price history", body: `Median ${currency(summary.median)}, average ${currency(summary.average)}, spread ${summary.spread}%.` },
    { title: "Authentication guide", body: tag.authenticationNotes },
    { title: "Rarity score", body: `${product.rarityScore}/100 based on production window, sales frequency, surviving examples, and demand.` },
    { title: "Call to action", body: "Contribute original photos and tag details to Archive Index." },
  ];
  return (
    <section className="page-stack">
      <PageHero eyebrow="Content Generator" title="Generate social and research outputs directly from archive data." description="Supported formats include Instagram Carousel, Instagram Story, Market Report, Brand Spotlight, and Tag Archive Series." />
      <div className="panel filter-panel"><select value={productId} onChange={(event) => setProductId(event.target.value)}>{products.slice(0, 300).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><select value={format} onChange={(event) => setFormat(event.target.value)}>{["Instagram Carousel", "Instagram Story", "Market Report", "Brand Spotlight", "Tag Archive Series"].map((item) => <option key={item}>{item}</option>)}</select><button className="ghost-button" onClick={() => openProduct(product)}>Open Product Page</button></div>
      <div className="slide-grid">{slides.map((slide, index) => <article className="slide-card" key={slide.title}><span>Slide {index + 1}</span><h3>{slide.title}</h3><p>{slide.body}</p></article>)}</div>
      <div className="panel export-panel"><strong>{format} export</strong><p>Export options are designed for production pipelines: PNG, PDF, and Canva compatible format.</p><div className="hero-actions"><button className="gold-button">Export PNG</button><button className="ghost-button">Export PDF</button><button className="ghost-button">Canva compatible</button></div></div>
    </section>
  );
}

function CopyrightPage() {
  return (
    <section className="page-stack">
      <PageHero eyebrow="Copyright Policy" title="Archive Index is a historical database, not an image repository." description="Marketplace images are not stored locally. Marketplace listings are text-only external links. We prioritize original photography, user-contributed images, and attribution where applicable." />
      <form className="panel form-grid"><label>Your name<input placeholder="Rights holder or authorized agent" /></label><label>Email<input type="email" placeholder="name@example.com" /></label><label>Submission or product URL<input placeholder="Archive Index reference URL" /></label><label className="wide">Copyright issue<textarea placeholder="Describe the work, ownership, and requested action." /></label><label className="wide checkbox-line"><input type="checkbox" /> I certify that the information in this request is accurate.</label><button className="gold-button">Submit removal request</button></form>
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
      <div className="product-card-body"><p className="eyebrow">{brand.name} / {category.name}</p><h3><button onClick={() => openProduct(product)}>{product.name}</button></h3><div className="metric-row"><span>{product.releaseYear}</span><strong>{currency(product.marketPrice)}</strong></div><div className="pill-row"><span>Rarity {product.rarityScore}</span><span className={product.priceChangePercent >= 0 ? "up" : "down"}>{percent(product.priceChangePercent)}</span></div><div className="card-actions"><button onClick={() => toggle(favorites, setFavorites)}>{favorites.includes(product.id) ? "Favorited" : "Favorite"}</button><button onClick={() => toggle(watchlist, setWatchlist)}>{watchlist.includes(product.id) ? "Watching" : "Watch"}</button></div></div>
    </article>
  );
}

function ArchiveImage({ product, compact = false }: { product: Product; compact?: boolean }) {
  return <div className={`archive-image ${compact ? "compact" : ""}`}><span>{getCategory(product.categoryId)?.name}</span><strong>{product.releaseYear}</strong><em>{product.referenceNumber}</em><small>Original / user upload placeholder</small></div>;
}

function TagCard({ tagId }: { tagId: string }) {
  const tag = getTag(tagId)!;
  return <article className="tag-card"><div className="tag-photo"><span>TAG PHOTO</span><strong>{tag.yearStart}-{tag.yearEnd}</strong></div><h3>{tag.label}</h3><p><strong>Country:</strong> {tag.country}</p><p><strong>Factory:</strong> {tag.factoryInformation}</p><p><strong>Stitch:</strong> {tag.stitchType}</p><p><strong>Known variants:</strong> {tag.knownVariants.join(", ")}</p><p><strong>Authentication notes:</strong> {tag.authenticationNotes}</p><p><strong>Common fakes:</strong> {tag.commonFakes}</p><p><strong>Production differences:</strong> {tag.productionDifferences}</p></article>;
}

function CommunityExample({ example, index }: { example: CommunitySubmission; index: number }) {
  return <article className="example-card"><p className="eyebrow">Example #{index + 1}</p><h3>Contributed by: {example.contributor}</h3><p>{example.badge} / {example.contributionDate} / <a href={example.profileUrl}>Profile Link</a></p><div className="mini-photo-row">{example.photos.map((photo) => <span key={photo}>{photo}</span>)}</div><p>{example.year} / {example.country} / {example.tagType}</p><p>{example.authenticationNotes}</p><a href="#/copyright">Report Copyright Issue</a></article>;
}

type CategoryFilters = { brand: string; year: string; country: string; condition: string; marketplace: string; price: string };

function FilterControls({ filters, setFilters, brands }: { filters: CategoryFilters; setFilters: (filters: CategoryFilters) => void; brands: { id: string; name: string }[] }) {
  const update = (key: keyof CategoryFilters, value: string) => setFilters({ ...filters, [key]: value });
  return <div className="filter-panel nested"><select value={filters.brand} onChange={(event) => update("brand", event.target.value)}><option>All</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><select value={filters.year} onChange={(event) => update("year", event.target.value)}><option>All</option>{["194", "195", "196", "197", "198", "199", "200"].map((item) => <option key={item} value={item}>{item}0s</option>)}</select><select value={filters.country} onChange={(event) => update("country", event.target.value)}><option>All</option>{Array.from(new Set(products.map((item) => item.country))).map((item) => <option key={item}>{item}</option>)}</select><select value={filters.condition} onChange={(event) => update("condition", event.target.value)}><option>All</option>{["Deadstock", "Excellent", "Very Good", "Good", "Fair", "Distressed"].map((item) => <option key={item}>{item}</option>)}</select><select value={filters.marketplace} onChange={(event) => update("marketplace", event.target.value)}><option>All</option>{marketplaces.map((item) => <option key={item}>{item}</option>)}</select><select value={filters.price} onChange={(event) => update("price", event.target.value)}><option>All</option><option>Under $250</option><option>$250-$750</option><option>$750+</option></select></div>;
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

function Footer({ navigate }: { navigate: (path: string) => void }) {
  return <footer className="footer"><div><strong>ARCHIVE INDEX</strong><p>Museum, library, and research database first. Market intelligence second.</p></div><div><button onClick={() => navigate("/submit")}>Contribute</button><button onClick={() => navigate("/admin")}>Review Panel</button><button onClick={() => navigate("/copyright")}>Copyright Removal</button></div></footer>;
}

export default App;
