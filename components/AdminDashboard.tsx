"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Faq, GalleryData, GalleryItem, GalleryType, HomeAbout, ManifestName, SitePage, SitePageSlug } from "@/lib/gallery-types";
import { formatAuctionDate } from "@/lib/auction-date";
import { formatTestimonialDateTime, toDateTimeInput } from "@/lib/testimonial-date";
import { faqCategories } from "@/lib/faq-categories";
import { defaultHomeAbout } from "@/lib/home-about";
import { sitePages } from "@/lib/site-page-defaults";

type SessionResponse = { authenticated: boolean; configured: boolean; csrfToken: string | null };
type ActivePanel = "home-page" | "home-about" | "latest-collection" | "current-exhibition" | "auctions" | "team-members" | "archive-page" | "testimonials" | "faq" | "site-pages";
type ApiError = Error & { status?: number };

const panelTypes: { id: ActivePanel; label: string; type: GalleryType; heading: string }[] = [
  { id: "home-page", label: "Home Page", type: "banner", heading: "Homepage banners" },
  { id: "latest-collection", label: "Latest Collection", type: "artwork", heading: "Art collection" },
  { id: "current-exhibition", label: "Current Exhibition", type: "exhibition", heading: "Current exhibitions" },
  // { id: "auctions", label: "Upcoming Auctions", type: "auction", heading: "Upcoming auctions" },
  { id: "team-members", label: "Meet Our Team", type: "team", heading: "Meet Our Team" },
  { id: "testimonials", label: "Testimonials", type: "testimonial", heading: "Client testimonials" },
  { id: "archive-page", label: "Archive Page", type: "archive", heading: "Artwork archive" },
];

// The about section, F.A.Q and footer pages have no images like the gallery lists, so they have their own panels.
const tabs: { id: ActivePanel; label: string }[] = [
  panelTypes[0],
  { id: "home-about", label: "About Section" },
  ...panelTypes.slice(1),
  { id: "faq", label: "F.A.Q" },
  { id: "site-pages", label: "Footer Pages" },
];

const typeLabels: Record<GalleryType, string> = {
  banner: "banners",
  artwork: "artworks",
  exhibition: "exhibitions",
  archive: "archived artworks",
  auction: "auctions",
  team: "team members",
  testimonial: "testimonials",
};

const manifestNames: Record<GalleryType, ManifestName> = {
  banner: "banners",
  artwork: "artworks",
  exhibition: "exhibitions",
  archive: "archives",
  auction: "auctions",
  team: "team",
  testimonial: "testimonials",
};

async function request<T>(action: string, csrfToken = "", options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${action}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(csrfToken && options.method !== "GET" ? { "X-CSRF-Token": csrfToken } : {}),
    },
  });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) {
    const error = new Error(result.error || "The request could not be completed.") as ApiError;
    error.status = response.status;
    throw error;
  }
  return result;
}

function initialGallery(): GalleryData {
  return { banners: [], artworks: [], exhibitions: [], archives: [], auctions: [], team: [], testimonials: [] };
}

export function AdminDashboard() {
  const [mode, setMode] = useState<"loading" | "setup" | "login" | "dashboard">("loading");
  const [csrfToken, setCsrfToken] = useState("");
  const [gallery, setGallery] = useState<GalleryData>(initialGallery);
  const [about, setAbout] = useState<HomeAbout | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [footerPages, setFooterPages] = useState<Partial<Record<SitePageSlug, SitePage | null>>>({});
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("home-page");
  const [loading, setLoading] = useState(false);

  const loadGallery = useCallback(async () => {
    const [result, aboutResult, faqResult, pagesResult] = await Promise.all([
      request<GalleryData>("public"),
      request<{ about: HomeAbout | null }>("home-about"),
      request<{ faqs: Faq[] }>("faqs"),
      request<{ pages: Record<SitePageSlug, SitePage | null> }>("site-pages"),
    ]);
    setGallery(result);
    setAbout(aboutResult.about);
    setFaqs(faqResult.faqs);
    setFooterPages(pagesResult.pages);
  }, []);

  useEffect(() => {
    let alive = true;
    request<SessionResponse>("session")
      .then(async (session) => {
        if (!alive) return;
        if (session.authenticated) {
          setCsrfToken(session.csrfToken ?? "");
          setMode("dashboard");
          await loadGallery();
        } else {
          setMode(session.configured ? "login" : "setup");
        }
      })
      .catch((error: Error) => {
        if (alive) {
          setMode("login");
          setNotice({ message: error.message, error: true });
        }
      });
    return () => { alive = false; };
  }, [loadGallery]);

  async function handleAuthentication(event: FormEvent<HTMLFormElement>, action: "setup" | "login") {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    if (action === "setup" && password !== formData.get("confirmPassword")) {
      setNotice({ message: "The passwords do not match.", error: true });
      return;
    }
    setLoading(true);
    try {
      const result = await request<{ csrfToken: string }>(action, "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setCsrfToken(result.csrfToken);
      setMode("dashboard");
      await loadGallery();
      form.reset();
      setNotice({ message: action === "setup" ? "Admin password set. Your gallery is ready to manage." : "Signed in. Your gallery is ready to manage.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function submitContent(event: FormEvent<HTMLFormElement>, type: GalleryType, item?: GalleryItem) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("type", type);
    if (item) formData.set("id", item.id);
    setLoading(true);
    try {
      await request(item ? "update" : "upload", csrfToken, { method: "POST", body: formData });
      if (!item) form.reset();
      await loadGallery();
      setNotice({ message: item ? "Gallery item updated." : `${type[0].toUpperCase()}${type.slice(1)} uploaded.`, error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function moveArtwork(action: "archive" | "restore", id: string) {
    try {
      await request(action, csrfToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadGallery();
      setNotice({ message: action === "archive" ? "Artwork moved to the archive." : "Artwork restored to the latest collection.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    }
  }

  async function removeItem(type: GalleryType, id: string, title: string) {
    if (!window.confirm(`Remove “${title}” from the gallery?`)) return;
    try {
      await request("delete", csrfToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      await loadGallery();
      setNotice({ message: "Gallery image removed.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    }
  }

  async function saveAbout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await request<{ about: HomeAbout }>("home-about", csrfToken, {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      setAbout(result.about);
      setNotice({ message: "About section saved.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function resetAbout() {
    if (!window.confirm("Reset the about section to the default text and image?")) return;
    setLoading(true);
    try {
      await request("home-about-reset", csrfToken, { method: "POST" });
      setAbout(null);
      setNotice({ message: "About section reset to the default.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function saveFooterPage(event: FormEvent<HTMLFormElement>, slug: SitePageSlug) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const result = await request<{ page: SitePage }>("site-page", csrfToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: formData.get("title"), intro: formData.get("intro"), content: formData.get("content") }),
      });
      setFooterPages((pages) => ({ ...pages, [slug]: result.page }));
      setNotice({ message: "Page saved.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function resetFooterPage(slug: SitePageSlug) {
    if (!window.confirm("Reset this page to the default text?")) return;
    setLoading(true);
    try {
      await request("site-page-reset", csrfToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      setFooterPages((pages) => ({ ...pages, [slug]: null }));
      setNotice({ message: "Page reset to the default.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    } finally {
      setLoading(false);
    }
  }

  async function saveFaq(event: FormEvent<HTMLFormElement>, faq?: Faq): Promise<boolean> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    try {
      await request(faq ? "faq-update" : "faq-create", csrfToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: faq?.id,
          question: formData.get("question"),
          answer: formData.get("answer"),
          category: formData.get("category"),
          sortOrder: formData.get("sortOrder"),
        }),
      });
      if (!faq) form.reset();
      setFaqs((await request<{ faqs: Faq[] }>("faqs")).faqs);
      setNotice({ message: faq ? "Question updated." : "Question added.", error: false });
      return true;
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function removeFaq(faq: Faq) {
    if (!window.confirm(`Remove the question “${faq.question}”?`)) return;
    try {
      await request("faq-delete", csrfToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id }),
      });
      setFaqs((await request<{ faqs: Faq[] }>("faqs")).faqs);
      setNotice({ message: "Question removed.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    }
  }

  async function logout() {
    try {
      await request("logout", csrfToken, { method: "POST" });
      setCsrfToken("");
      setMode("login");
      setNotice({ message: "You have signed out.", error: false });
    } catch (error) {
      setNotice({ message: (error as Error).message, error: true });
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="container d-flex justify-content-between align-items-center gap-3 pt-3">
            <Link href="/" className="admin-brand">Art Gallery <span>/ Admin</span></Link>
            <div className="d-flex gap-2">
              <Link href="/" className="btn btn-dark nav-action-btn">View gallery</Link>
              {mode === "dashboard" && <button className="btn btn-outline-dark" type="button" onClick={logout}>Sign out</button>}
            </div>
        </div>    
      </div>
       <section className="container pt-4">
      {notice && <div className={`alert ${notice.error ? "alert-danger" : "alert-success"}`} role="status">{notice.message}</div>}
      {mode === "loading" && <p className="text-secondary">Loading gallery management…</p>}</section>
      {mode === "setup" && (
        <section>
          <div className="container">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <div className="admin-panel">
                  <div className="section-label mb-2">First-time setup</div>
                  <h1 className="h2 mb-2">Create your admin password</h1>
                  <p className="text-secondary mb-4">Choose a password at least 12 characters long. It will be stored securely as a hash on this server.</p>
                  <form onSubmit={(event) => handleAuthentication(event, "setup")}>
                    <label className="form-label" htmlFor="newPassword">Admin password</label>
                    <input className="form-control form-control-lg mb-3" id="newPassword" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
                    <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                    <input className="form-control form-control-lg mb-3" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
                    <button className="btn btn-accent w-100 btn-lg" type="submit" disabled={loading}>Set admin password</button>
                  </form>
                </div>  
              </div>  
            </div>  
          </div>    
        </section>
      )}
      {mode === "login" && (
        <section>
          <div className="container">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <div className="admin-panel p-lg-5 p-4">
                  <div className="section-label mb-2">Gallery management</div>
                  <h1 className="h2 mb-2">Admin sign in</h1>
                  <p className="text-secondary mb-4">Sign in to update the homepage banners and artwork collection.</p>
                  <form onSubmit={(event) => handleAuthentication(event, "login")}>
                    <label className="form-label" htmlFor="password">Admin password</label>
                    <input className="form-control form-control-lg mb-3" id="password" name="password" type="password" autoComplete="current-password" required />
                    <button className="btn btn-accent w-100 btn-lg" type="submit" disabled={loading}>Sign in</button>
                  </form>
                </div>  
            </div>
          </div>
        </div>
        </section>
      )}
      {mode === "dashboard" && (
        <section className="container pb-3 pb-lg-5">
          <div className="mb-4">
            <div className="section-label">Content management</div>
            <h1 className="display-6 mb-1">Gallery dashboard</h1>
            <p className="text-secondary mb-0">Upload and manage the images displayed on your public gallery.</p>
          </div>
          <nav className="dashboard-tabs d-flex flex-wrap gap-2 mb-4" aria-label="Dashboard sections">
            {tabs.map((panel) => (
              <button
                key={panel.id}
                className="btn dashboard-tab"
                type="button"
                aria-pressed={activePanel === panel.id}
                aria-current={activePanel === panel.id ? "page" : undefined}
                onClick={() => setActivePanel(panel.id)}
              >
                {panel.label}
              </button>
            ))}
          </nav>
          <div className="row g-4">
            {activePanel === "home-about" && (
              <div className="col-lg-8">
                <HomeAboutPanel about={about} disabled={loading} onSubmit={saveAbout} onReset={resetAbout} />
              </div>
            )}
            {activePanel === "faq" && (
              <div className="col-lg-8">
                <FaqPanel faqs={faqs} disabled={loading} onSubmit={saveFaq} onRemove={removeFaq} />
              </div>
            )}
            {activePanel === "site-pages" && (
              <div className="col-lg-8">
                <FooterPagesPanel pages={footerPages} disabled={loading} onSubmit={saveFooterPage} onReset={resetFooterPage} />
              </div>
            )}
            {panelTypes.filter((panel) => panel.id === activePanel).map((panel) => (
              <div className="col-lg-8" key={panel.id}>
                <section className="admin-panel p-4" aria-label={`${panel.label} content`}>
                  <h2 className="h3 mb-1">{panel.heading}</h2>
                  <p className="text-secondary small mb-4">
                    {panel.type === "archive"
                      ? "Archived artwork appears on the public Archive page. Restore it to the latest collection whenever you like."
                      : panel.type === "artwork"
                        ? "Add artwork cards to the public collection. Images up to 8 MB."
                        : panel.type === "auction"
                          ? "Add artworks to the homepage Upcoming Auctions section. Only auctions dated today or later show there; past ones move to Past Auctions on the Auctions page."
                        : panel.type === "banner"
                          ? "Add a slide to the homepage banner carousel. Images up to 8 MB."
                          : panel.type === "testimonial"
                            ? "Client testimonials shown in the slider above the homepage footer. The section is hidden until you add one. Photos up to 8 MB."
                          : panel.type === "exhibition"
                            ? "Manage the exhibition cards shown on the public homepage."
                            : "Add artist and team profiles to the homepage. Images up to 8 MB."}
                  </p>
                  {panel.type === "archive" ? (
                    <Link className="btn btn-outline-secondary btn-sm mb-3" href="/archive">View public archive</Link>
                  ) : (
                    <UploadForm type={panel.type} disabled={loading} onSubmit={submitContent} />
                  )}
                  <hr className="my-4" />
                  <div aria-live="polite">
                    {gallery[manifestNames[panel.type]].length === 0
                      ? <p className="small text-secondary mb-0">No {typeLabels[panel.type]} uploaded yet.</p>
                      : <div className="admin-item-list">
                        {gallery[manifestNames[panel.type]].map((item) => (
                          <AdminItem
                            key={item.id}
                            item={item}
                            type={panel.type}
                            disabled={loading}
                            onSubmit={submitContent}
                            onMove={moveArtwork}
                            onRemove={removeItem}
                          />
                        ))}
                      </div>}
                  </div>
                </section>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function HomeAboutPanel({
  about,
  disabled,
  onSubmit,
  onReset,
}: {
  about: HomeAbout | null;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  const current = about ?? defaultHomeAbout;
  return (
    <section className="admin-panel p-4" aria-label="About section content">
      <h2 className="h3 mb-1">Homepage about section</h2>
      <p className="text-secondary small mb-4">
        The &ldquo;Experience creativity&rdquo; section below the latest collection.
        {about ? "" : " It is showing the default content until you save it."}
      </p>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Image className="admin-preview" src={current.imageUrl ?? current.filename} alt="" width={72} height={60} unoptimized />
        <div className="small text-secondary">{about ? "Current image" : "Default image"}</div>
      </div>
      {/* Keyed so the fields refill with the saved values after a save or reset. */}
      <form key={about?.updatedAt ?? about?.createdAt ?? "default"} onSubmit={onSubmit} encType="multipart/form-data">
        <label className="form-label" htmlFor="about-label">Small heading</label>
        <input className="form-control mb-3" id="about-label" name="label" defaultValue={current.label} maxLength={60} />
        <label className="form-label" htmlFor="about-title">Title</label>
        <input className="form-control mb-3" id="about-title" name="title" defaultValue={current.title} maxLength={100} required />
        <label className="form-label" htmlFor="about-description">Description</label>
        <textarea className="form-control" id="about-description" name="description" defaultValue={current.description} maxLength={1000} rows={6} />
        <div className="form-text mb-3">Leave a blank line between paragraphs.</div>
        <div className="row">
          <div className="col-sm-6">
            <label className="form-label" htmlFor="about-button-text">Button text</label>
            <input className="form-control mb-3" id="about-button-text" name="buttonText" defaultValue={current.buttonText} maxLength={60} />
          </div>
          <div className="col-sm-6">
            <label className="form-label" htmlFor="about-button-link">Button link</label>
            <input className="form-control mb-3" id="about-button-link" name="buttonLink" defaultValue={current.buttonLink} maxLength={255} placeholder="/about" />
          </div>
        </div>
        <label className="form-label" htmlFor="about-image">{about ? "Replace image (optional)" : "Section image"}</label>
        <input className="form-control" id="about-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!about} />
        <div className="form-text mb-3">JPG, PNG, or WebP; maximum 8 MB.{about ? " Leave empty to keep the current image." : ""}</div>
        <div className="d-flex gap-2">
          <button className="btn btn-accent" type="submit" disabled={disabled}>Save about section</button>
          {about && <button className="btn btn-outline-danger" type="button" disabled={disabled} onClick={onReset}>Reset to default</button>}
        </div>
      </form>
    </section>
  );
}

function FooterPagesPanel({
  pages,
  disabled,
  onSubmit,
  onReset,
}: {
  pages: Partial<Record<SitePageSlug, SitePage | null>>;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, slug: SitePageSlug) => void;
  onReset: (slug: SitePageSlug) => void;
}) {
  const [slug, setSlug] = useState<SitePageSlug>(sitePages[0].slug);
  const definition = sitePages.find((page) => page.slug === slug)!;
  const saved = pages[slug] ?? null;
  const current = saved ?? definition.defaults;
  return (
    <section className="admin-panel p-4" aria-label="Footer pages content">
      <h2 className="h3 mb-1">Footer pages</h2>
      <p className="text-secondary small mb-4">The Support Center, Privacy Policy and Terms &amp; Conditions pages linked at the bottom of every page.</p>
      <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Choose a page">
        {sitePages.map((page) => (
          <button key={page.slug} className="btn btn-sm dashboard-tab" type="button" aria-pressed={slug === page.slug} onClick={() => setSlug(page.slug)}>
            {page.label}
          </button>
        ))}
      </div>
      <p className="small text-secondary">
        {saved ? "Showing your saved text." : "Showing the default text until you save it."}{" "}
        <Link href={definition.path}>View page</Link>
      </p>
      {/* Keyed so the fields refill when switching pages, or after a save or reset. */}
      <form key={`${slug}-${saved?.updatedAt ?? saved?.createdAt ?? "default"}`} onSubmit={(event) => onSubmit(event, slug)}>
        <label className="form-label" htmlFor="site-page-title">Title</label>
        <input className="form-control mb-3" id="site-page-title" name="title" defaultValue={current.title} maxLength={100} required />
        <label className="form-label" htmlFor="site-page-intro">Introduction</label>
        <textarea className="form-control mb-3" id="site-page-intro" name="intro" defaultValue={current.intro} maxLength={300} rows={2} />
        <label className="form-label" htmlFor="site-page-content">Content</label>
        <textarea className="form-control" id="site-page-content" name="content" defaultValue={current.content} maxLength={20000} rows={18} required />
        <div className="form-text mb-3">Leave a blank line between paragraphs. Start a line with &ldquo;## &rdquo; for a heading, or &ldquo;- &rdquo; for a list item.</div>
        <div className="d-flex gap-2">
          <button className="btn btn-accent" type="submit" disabled={disabled}>Save page</button>
          {saved && <button className="btn btn-outline-danger" type="button" disabled={disabled} onClick={() => onReset(slug)}>Reset to default</button>}
        </div>
      </form>
    </section>
  );
}

type FaqSubmit = (event: FormEvent<HTMLFormElement>, faq?: Faq) => Promise<boolean>;

function FaqFields({ faq, compact }: { faq?: Faq; compact?: boolean }) {
  const prefix = faq ? `edit-faq-${faq.id}` : "new-faq";
  const label = compact ? "form-label small" : "form-label";
  const control = compact ? "form-control form-control-sm" : "form-control";
  return (
    <>
      <label className={label} htmlFor={`${prefix}-category`}>Tab</label>
      <select className={`${compact ? "form-select form-select-sm" : "form-select"} mb-3`} id={`${prefix}-category`} name="category" defaultValue={faq?.category ?? faqCategories[0].id} style={{ maxWidth: 220 }}>
        {faqCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
      </select>
      <label className={label} htmlFor={`${prefix}-question`}>Question</label>
      <input className={`${control} mb-3`} id={`${prefix}-question`} name="question" defaultValue={faq?.question} maxLength={200} required />
      <label className={label} htmlFor={`${prefix}-answer`}>Answer</label>
      <textarea className={control} id={`${prefix}-answer`} name="answer" defaultValue={faq?.answer} maxLength={2000} rows={compact ? 3 : 4} required />
      <div className="form-text mb-3">Leave a blank line between paragraphs.</div>
      <label className={label} htmlFor={`${prefix}-order`}>Display order</label>
      <input className={`${control} mb-1`} id={`${prefix}-order`} name="sortOrder" type="number" min={0} max={10000} step={1} defaultValue={faq?.sortOrder ?? 0} style={{ maxWidth: 140 }} />
      <div className="form-text mb-3">Lower numbers appear first.</div>
    </>
  );
}

function FaqPanel({
  faqs,
  disabled,
  onSubmit,
  onRemove,
}: {
  faqs: Faq[];
  disabled: boolean;
  onSubmit: FaqSubmit;
  onRemove: (faq: Faq) => void;
}) {
  return (
    <section className="admin-panel p-4" aria-label="F.A.Q content">
      <h2 className="h3 mb-1">Frequently asked questions</h2>
      <p className="text-secondary small mb-4">
        Questions shown on the public F.A.Q page, grouped into tabs. Tabs with no questions are hidden.
        {faqs.length === 0 ? " Until you add one, the page shows a few default questions." : ""}
      </p>
      <Link className="btn btn-outline-secondary btn-sm mb-3" href="/faq">View public F.A.Q</Link>
      <form onSubmit={(event) => onSubmit(event)}>
        <FaqFields />
        <button className="btn btn-accent" type="submit" disabled={disabled}>Add question</button>
      </form>
      <hr className="my-4" />
      <div aria-live="polite">
        {faqs.length === 0
          ? <p className="small text-secondary mb-0">No questions added yet.</p>
          : faqCategories.filter((category) => faqs.some((faq) => faq.category === category.id)).map((category) => (
            <div className="mb-3" key={category.id}>
              <h3 className="h5 mb-1">{category.label}</h3>
              <div className="admin-item-list">
                {faqs.filter((faq) => faq.category === category.id).map((faq) => (
                  <FaqAdminItem key={faq.id} faq={faq} disabled={disabled} onSubmit={onSubmit} onRemove={onRemove} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function FaqAdminItem({
  faq,
  disabled,
  onSubmit,
  onRemove,
}: {
  faq: Faq;
  disabled: boolean;
  onSubmit: FaqSubmit;
  onRemove: (faq: Faq) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="admin-item py-3">
      <div className="d-flex align-items-center gap-3">
        <span className="badge text-bg-light border" title="Display order">{faq.sortOrder}</span>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-semibold text-truncate">{faq.question}</div>
          <div className="small text-secondary text-truncate">{faq.answer}</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" type="button" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</button>
          <button className="btn btn-outline-danger btn-sm" type="button" disabled={disabled} onClick={() => onRemove(faq)}>Remove</button>
        </div>
      </div>
      {editing && (
        <form className="mt-3" onSubmit={async (event) => { if (await onSubmit(event, faq)) setEditing(false); }}>
          <FaqFields faq={faq} compact />
          <button className="btn btn-accent btn-sm" type="submit" disabled={disabled}>Save changes</button>
        </form>
      )}
    </div>
  );
}

function UploadForm({
  type,
  disabled,
  onSubmit,
}: {
  type: Exclude<GalleryType, "archive">;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, type: GalleryType, item?: GalleryItem) => void;
}) {
  const titleLabel = type === "team" ? "Artist name" : type === "artwork" || type === "auction" ? "Artwork title" : type === "exhibition" ? "Exhibition title" : type === "testimonial" ? "Heading (e.g. Excellent Auction Item!)" : "Banner heading";
  return (
    <form onSubmit={(event) => onSubmit(event, type)} encType="multipart/form-data">
      <label className="form-label" htmlFor={`new-${type}-title`}>{titleLabel}</label>
      <input className="form-control mb-3" id={`new-${type}-title`} name="title" maxLength={100} required />
      {type === "artwork" && (
        <div className="row">
          <div className="col-sm-6"><label className="form-label" htmlFor="new-artist">Artist</label><input className="form-control mb-3" id="new-artist" name="artist" maxLength={100} /></div>
          <div className="col-sm-6"><label className="form-label" htmlFor="new-category">Category</label><input className="form-control mb-3" id="new-category" name="category" maxLength={60} /></div>
        </div>
      )}
      {type === "auction" && (
        <div className="row">
          <div className="col-sm-6"><label className="form-label" htmlFor="new-auction-artist">Artist</label><input className="form-control mb-3" id="new-auction-artist" name="artist" maxLength={100} /></div>
          <div className="col-sm-6"><label className="form-label" htmlFor="new-auction-date">Auction date</label><input className="form-control mb-3" id="new-auction-date" name="auctionDate" type="date" required /></div>
          <div className="col-sm-6"><label className="form-label" htmlFor="new-auction-estimate">Estimate (optional)</label><input className="form-control mb-3" id="new-auction-estimate" name="estimate" maxLength={100} placeholder="₹50,000 – ₹80,000" /></div>
        </div>
      )}
      {type === "exhibition" && <><label className="form-label" htmlFor="new-date">Dates</label><input className="form-control mb-3" id="new-date" name="dateLabel" maxLength={100} /></>}
      {type === "team" && <><label className="form-label" htmlFor="new-designation">Designation</label><input className="form-control mb-3" id="new-designation" name="designation" maxLength={100} required /></>}
      {type === "testimonial" && (
        <div className="row">
          <div className="col-sm-6"><label className="form-label" htmlFor="new-testimonial-name">Client name</label><input className="form-control mb-3" id="new-testimonial-name" name="authorName" maxLength={100} required /></div>
          <div className="col-sm-6"><label className="form-label" htmlFor="new-testimonial-role">Designation (optional)</label><input className="form-control mb-3" id="new-testimonial-role" name="designation" maxLength={100} placeholder="Art Critic" /></div>
          <div className="col-sm-6"><label className="form-label" htmlFor="new-testimonial-when">Date and time</label><input className="form-control mb-3" id="new-testimonial-when" name="givenAt" type="datetime-local" required /></div>
        </div>
      )}
      {type !== "team" && <><label className="form-label" htmlFor={`new-${type}-description`}>{type === "testimonial" ? "Testimonial" : "Description"}</label><textarea className="form-control mb-3" id={`new-${type}-description`} name="description" maxLength={500} rows={type === "artwork" ? 2 : 3} required={type === "testimonial"} /></>}
      <label className="form-label" htmlFor={`new-${type}-image`}>{type === "team" ? "Profile image" : type === "testimonial" ? "Client photo" : `${type[0].toUpperCase()}${type.slice(1)} image`}</label>
      <input className="form-control mb-3" id={`new-${type}-image`} name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
      <button className="btn btn-accent" type="submit" disabled={disabled}>Add {type === "team" ? "team member" : type}</button>
    </form>
  );
}

function AdminItem({
  item,
  type,
  disabled,
  onSubmit,
  onMove,
  onRemove,
}: {
  item: GalleryItem;
  type: GalleryType;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, type: GalleryType, item?: GalleryItem) => void;
  onMove: (action: "archive" | "restore", id: string) => void;
  onRemove: (type: GalleryType, id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const subtitle = type === "team"
    ? item.designation
    : type === "artwork" || type === "archive"
      ? [item.artist, item.category].filter(Boolean).join(" · ")
      : type === "auction"
        ? [formatAuctionDate(item.auctionDate), item.artist, item.estimate].filter(Boolean).join(" · ")
      : type === "testimonial"
        ? [item.authorName, item.designation, formatTestimonialDateTime(item.givenAt)?.date].filter(Boolean).join(" · ")
      : type === "exhibition"
        ? item.dateLabel || item.description
        : item.description;
  return (
    <div className="admin-item py-3">
      <div className="d-flex align-items-center gap-3">
        <Image className="admin-preview" src={item.imageUrl ?? item.filename} alt="" width={72} height={60} unoptimized />
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-semibold text-truncate">{item.title}</div>
          <div className="small text-secondary text-truncate">{subtitle}</div>
        </div>
        <div className="d-flex gap-2">
          {type !== "archive" && <button className="btn btn-outline-secondary btn-sm" type="button" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</button>}
          {(type === "artwork" || type === "archive") && <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => onMove(type === "artwork" ? "archive" : "restore", item.id)}>{type === "artwork" ? "Archive" : "Restore"}</button>}
          <button className="btn btn-outline-danger btn-sm" type="button" disabled={disabled} onClick={() => onRemove(type, item.id, item.title)}>Remove</button>
        </div>
      </div>
      {editing && (
        <form className="row g-2 mt-2" onSubmit={(event) => { onSubmit(event, type, item); setEditing(false); }} encType="multipart/form-data">
          <div className={type === "artwork" || type === "auction" ? "col-md-6" : "col-12"}>
            <label className="form-label small" htmlFor={`edit-title-${item.id}`}>{type === "team" ? "Artist name" : "Title"}</label>
            <input className="form-control form-control-sm" id={`edit-title-${item.id}`} name="title" defaultValue={item.title} maxLength={100} required />
          </div>
          {type === "artwork" && <>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-artist-${item.id}`}>Artist</label><input className="form-control form-control-sm" id={`edit-artist-${item.id}`} name="artist" defaultValue={item.artist ?? ""} maxLength={100} /></div>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-category-${item.id}`}>Category</label><input className="form-control form-control-sm" id={`edit-category-${item.id}`} name="category" defaultValue={item.category ?? ""} maxLength={60} /></div>
          </>}
          {type === "auction" && <>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-artist-${item.id}`}>Artist</label><input className="form-control form-control-sm" id={`edit-artist-${item.id}`} name="artist" defaultValue={item.artist ?? ""} maxLength={100} /></div>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-auction-date-${item.id}`}>Auction date</label><input className="form-control form-control-sm" id={`edit-auction-date-${item.id}`} name="auctionDate" type="date" defaultValue={item.auctionDate ?? ""} required /></div>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-estimate-${item.id}`}>Estimate</label><input className="form-control form-control-sm" id={`edit-estimate-${item.id}`} name="estimate" defaultValue={item.estimate ?? ""} maxLength={100} /></div>
          </>}
          {type === "exhibition" && <div className="col-12"><label className="form-label small" htmlFor={`edit-date-${item.id}`}>Dates</label><input className="form-control form-control-sm" id={`edit-date-${item.id}`} name="dateLabel" defaultValue={item.dateLabel ?? ""} maxLength={100} /></div>}
          {type === "team" && <div className="col-12"><label className="form-label small" htmlFor={`edit-designation-${item.id}`}>Designation</label><input className="form-control form-control-sm" id={`edit-designation-${item.id}`} name="designation" defaultValue={item.designation ?? ""} maxLength={100} required /></div>}
          {type === "testimonial" && <>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-name-${item.id}`}>Client name</label><input className="form-control form-control-sm" id={`edit-name-${item.id}`} name="authorName" defaultValue={item.authorName ?? ""} maxLength={100} required /></div>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-role-${item.id}`}>Designation</label><input className="form-control form-control-sm" id={`edit-role-${item.id}`} name="designation" defaultValue={item.designation ?? ""} maxLength={100} /></div>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-when-${item.id}`}>Date and time</label><input className="form-control form-control-sm" id={`edit-when-${item.id}`} name="givenAt" type="datetime-local" defaultValue={toDateTimeInput(item.givenAt)} required /></div>
          </>}
          {type !== "team" && <div className="col-12"><label className="form-label small" htmlFor={`edit-description-${item.id}`}>{type === "testimonial" ? "Testimonial" : "Description"}</label><textarea className="form-control form-control-sm" id={`edit-description-${item.id}`} name="description" defaultValue={item.description ?? ""} maxLength={500} rows={type === "testimonial" ? 4 : 2} required={type === "testimonial"} /></div>}
          <div className="col-12">
            <label className="form-label small" htmlFor={`edit-image-${item.id}`}>Replace image (optional)</label>
            <input className="form-control form-control-sm" id={`edit-image-${item.id}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" />
            <div className="form-text">JPG, PNG, or WebP; maximum 8 MB. Leave empty to keep the current image.</div>
          </div>
          <div className="col-12"><button className="btn btn-accent btn-sm" type="submit" disabled={disabled}>Save changes</button></div>
        </form>
      )}
    </div>
  );
}
