"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { GalleryData, GalleryItem, GalleryType } from "@/lib/gallery-types";

type SessionResponse = { authenticated: boolean; configured: boolean; csrfToken: string | null };
type ActivePanel = "home-page" | "latest-collection" | "current-exhibition" | "team-members" | "archive-page";
type ApiError = Error & { status?: number };

const panelTypes: { id: ActivePanel; label: string; type: GalleryType; heading: string }[] = [
  { id: "home-page", label: "Home Page", type: "banner", heading: "Homepage banners" },
  { id: "latest-collection", label: "Latest Collection", type: "artwork", heading: "Art collection" },
  { id: "current-exhibition", label: "Current Exhibition", type: "exhibition", heading: "Current exhibitions" },
  { id: "team-members", label: "Meet Our Team", type: "team", heading: "Meet Our Team" },
  { id: "archive-page", label: "Archive Page", type: "archive", heading: "Artwork archive" },
];

const typeLabels: Record<GalleryType, string> = {
  banner: "banners",
  artwork: "artworks",
  exhibition: "exhibitions",
  archive: "archived artworks",
  team: "team members",
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
  return { banners: [], artworks: [], exhibitions: [], archives: [], team: [] };
}

export function AdminDashboard() {
  const [mode, setMode] = useState<"loading" | "setup" | "login" | "dashboard">("loading");
  const [csrfToken, setCsrfToken] = useState("");
  const [gallery, setGallery] = useState<GalleryData>(initialGallery);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("home-page");
  const [loading, setLoading] = useState(false);

  const loadGallery = useCallback(async () => {
    const result = await request<GalleryData>("public");
    setGallery(result);
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
                    <input className="form-control form-control-lg mb-3" id="newPassword" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required />
                    <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                    <input className="form-control form-control-lg mb-3" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required />
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
            {panelTypes.map((panel) => (
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
            {panelTypes.filter((panel) => panel.id === activePanel).map((panel) => (
              <div className="col-lg-8" key={panel.id}>
                <section className="admin-panel p-4" aria-label={`${panel.label} content`}>
                  <h2 className="h3 mb-1">{panel.heading}</h2>
                  <p className="text-secondary small mb-4">
                    {panel.type === "archive"
                      ? "Archived artwork appears on the public Archive page. Restore it to the latest collection whenever you like."
                      : panel.type === "artwork"
                        ? "Add artwork cards to the public collection. Images up to 8 MB."
                        : panel.type === "banner"
                          ? "Add a slide to the homepage banner carousel. Images up to 8 MB."
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
                    {gallery[panel.type === "banner" ? "banners" : panel.type === "artwork" ? "artworks" : panel.type === "exhibition" ? "exhibitions" : panel.type === "archive" ? "archives" : "team"].length === 0
                      ? <p className="small text-secondary mb-0">No {typeLabels[panel.type]} uploaded yet.</p>
                      : <div className="admin-item-list">
                        {gallery[panel.type === "banner" ? "banners" : panel.type === "artwork" ? "artworks" : panel.type === "exhibition" ? "exhibitions" : panel.type === "archive" ? "archives" : "team"].map((item) => (
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

function UploadForm({
  type,
  disabled,
  onSubmit,
}: {
  type: Exclude<GalleryType, "archive">;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, type: GalleryType, item?: GalleryItem) => void;
}) {
  const titleLabel = type === "team" ? "Artist name" : type === "artwork" ? "Artwork title" : type === "exhibition" ? "Exhibition title" : "Banner heading";
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
      {type === "exhibition" && <><label className="form-label" htmlFor="new-date">Dates</label><input className="form-control mb-3" id="new-date" name="dateLabel" maxLength={100} /></>}
      {type === "team" && <><label className="form-label" htmlFor="new-designation">Designation</label><input className="form-control mb-3" id="new-designation" name="designation" maxLength={100} required /></>}
      {type !== "team" && <><label className="form-label" htmlFor={`new-${type}-description`}>Description</label><textarea className="form-control mb-3" id={`new-${type}-description`} name="description" maxLength={500} rows={type === "artwork" ? 2 : 3} /></>}
      <label className="form-label" htmlFor={`new-${type}-image`}>{type === "team" ? "Profile image" : `${type[0].toUpperCase()}${type.slice(1)} image`}</label>
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
          <div className={type === "artwork" ? "col-md-6" : "col-12"}>
            <label className="form-label small" htmlFor={`edit-title-${item.id}`}>{type === "team" ? "Artist name" : "Title"}</label>
            <input className="form-control form-control-sm" id={`edit-title-${item.id}`} name="title" defaultValue={item.title} maxLength={100} required />
          </div>
          {type === "artwork" && <>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-artist-${item.id}`}>Artist</label><input className="form-control form-control-sm" id={`edit-artist-${item.id}`} name="artist" defaultValue={item.artist ?? ""} maxLength={100} /></div>
            <div className="col-md-6"><label className="form-label small" htmlFor={`edit-category-${item.id}`}>Category</label><input className="form-control form-control-sm" id={`edit-category-${item.id}`} name="category" defaultValue={item.category ?? ""} maxLength={60} /></div>
          </>}
          {type === "exhibition" && <div className="col-12"><label className="form-label small" htmlFor={`edit-date-${item.id}`}>Dates</label><input className="form-control form-control-sm" id={`edit-date-${item.id}`} name="dateLabel" defaultValue={item.dateLabel ?? ""} maxLength={100} /></div>}
          {type === "team" && <div className="col-12"><label className="form-label small" htmlFor={`edit-designation-${item.id}`}>Designation</label><input className="form-control form-control-sm" id={`edit-designation-${item.id}`} name="designation" defaultValue={item.designation ?? ""} maxLength={100} required /></div>}
          {type !== "team" && <div className="col-12"><label className="form-label small" htmlFor={`edit-description-${item.id}`}>Description</label><textarea className="form-control form-control-sm" id={`edit-description-${item.id}`} name="description" defaultValue={item.description ?? ""} maxLength={500} rows={2} /></div>}
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
