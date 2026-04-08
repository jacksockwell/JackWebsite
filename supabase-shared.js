(function attachPortfolioSupabaseApi() {
  const DEFAULT_CONFIG = {
    url: "",
    anonKey: "",
    projectTable: "portfolio_projects",
    storageBucket: "portfolio-media",
    publicSection: "art",
  };

  const videoPattern = /\.(mp4|webm|ogg|mov)$/i;
  let cachedClient = null;
  let cachedClientKey = "";

  function getConfig() {
    return {
      ...DEFAULT_CONFIG,
      ...(window.SUPABASE_CONFIG || {}),
    };
  }

  function isConfigured(config = getConfig()) {
    return Boolean(config.url && config.anonKey && window.supabase?.createClient);
  }

  function getClient() {
    const config = getConfig();

    if (!isConfigured(config)) {
      return null;
    }

    const nextKey = `${config.url}|${config.anonKey}`;

    if (!cachedClient || cachedClientKey !== nextKey) {
      cachedClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      cachedClientKey = nextKey;
    }

    return cachedClient;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function parsePossibleJson(value, fallback) {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (Array.isArray(value) || typeof value === "object") {
      return value;
    }

    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        return fallback;
      }
    }

    return fallback;
  }

  function coerceArray(value) {
    const parsed = parsePossibleJson(value, []);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  }

  function coerceObject(value) {
    const parsed = parsePossibleJson(value, null);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }

    return null;
  }

  function guessMediaType(src, explicitType = "") {
    if (explicitType === "video" || explicitType === "image") {
      return explicitType;
    }

    return videoPattern.test(src || "") ? "video" : "image";
  }

  function normalizeMediaAsset(asset) {
    if (typeof asset === "string") {
      return {
        src: asset,
        alt: "",
        caption: "",
        type: guessMediaType(asset),
        poster: "",
      };
    }

    if (!asset?.src) {
      return null;
    }

    return {
      src: asset.src,
      alt: asset.alt || "",
      caption: asset.caption || "",
      type: guessMediaType(asset.src, asset.type),
      poster: asset.poster || "",
    };
  }

  function normalizeThumbnailAsset(asset) {
    if (!asset) {
      return null;
    }

    return normalizeMediaAsset(asset);
  }

  function slugify(value) {
    const normalized = String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    return normalized || `project-${Date.now()}`;
  }

  function sanitizeFileName(value) {
    const cleaned = String(value || "upload")
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    return cleaned || `upload-${Date.now()}`;
  }

  function createEmptyProject() {
    return {
      id: "",
      slug: "",
      section: "art",
      status: "draft",
      title: "",
      text: "",
      dateLabel: "",
      sortOrder: new Date().getFullYear() * 100,
      madeIn: [],
      thumbnail: null,
      media: [
        {
          src: "",
          alt: "",
          caption: "",
          type: "image",
          poster: "",
        },
      ],
    };
  }

  function mapProjectRowToClient(row) {
    return {
      id: row.id || "",
      slug: row.slug || "",
      section: row.section || "art",
      status: row.status || "published",
      title: row.title || "",
      text: row.description || "",
      dateLabel: row.date_label || "",
      sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
      madeIn: coerceArray(row.made_in).filter(Boolean),
      thumbnail: normalizeThumbnailAsset(coerceObject(row.thumbnail)),
      media: coerceArray(row.media).map(normalizeMediaAsset).filter(Boolean),
    };
  }

  function mapProjectClientToRow(project) {
    const media = coerceArray(project.media).map(normalizeMediaAsset).filter(Boolean);
    const thumbnail = normalizeThumbnailAsset(project.thumbnail);
    const slug = slugify(project.slug || project.title);
    const row = {
      slug,
      section: project.section || "art",
      status: project.status || "draft",
      title: project.title?.trim() || "",
      description: project.text || "",
      date_label: project.dateLabel || "",
      sort_order: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
      made_in: Array.isArray(project.madeIn) ? project.madeIn.filter(Boolean) : [],
      thumbnail,
      media,
    };

    if (project.id) {
      row.id = project.id;
    }

    return row;
  }

  async function fetchProjects(options = {}) {
    const client = getClient();
    const config = getConfig();

    if (!client) {
      return [];
    }

    let query = client
      .from(config.projectTable)
      .select("*")
      .order("sort_order", { ascending: false })
      .order("updated_at", { ascending: false });

    if (options.section) {
      query = query.eq("section", options.section);
    }

    if (!options.includeDrafts) {
      query = query.eq("status", "published");
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(mapProjectRowToClient);
  }

  async function fetchPublishedProjects() {
    const config = getConfig();

    return fetchProjects({
      section: config.publicSection || "art",
      includeDrafts: false,
    });
  }

  async function saveProject(project) {
    const client = getClient();
    const config = getConfig();

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const row = mapProjectClientToRow(project);

    if (!row.title) {
      throw new Error("Project title is required.");
    }

    if (!row.media.length) {
      throw new Error("Add at least one media item before saving.");
    }

    const { data, error } = await client
      .from(config.projectTable)
      .upsert(row, { onConflict: "slug" })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapProjectRowToClient(data);
  }

  async function deleteProject(id) {
    const client = getClient();
    const config = getConfig();

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const { error } = await client.from(config.projectTable).delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  async function seedProjects(sourceItems = []) {
    const client = getClient();
    const config = getConfig();

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const slugCounts = new Map();
    const rows = sourceItems
      .map((item, index) => {
        if (!item?.title) {
          return null;
        }

        const baseSlug = slugify(item.slug || item.title);
        const seen = slugCounts.get(baseSlug) || 0;
        slugCounts.set(baseSlug, seen + 1);
        const uniqueSlug = seen ? `${baseSlug}-${seen + 1}` : baseSlug;

        return mapProjectClientToRow({
          ...createEmptyProject(),
          ...deepClone(item),
          slug: uniqueSlug,
          sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : sourceItems.length - index,
          section: item.section || "art",
          status: item.status || "published",
        });
      })
      .filter(Boolean);

    if (!rows.length) {
      return [];
    }

    const { data, error } = await client
      .from(config.projectTable)
      .upsert(rows, { onConflict: "slug" })
      .select("*");

    if (error) {
      throw error;
    }

    return (data || []).map(mapProjectRowToClient);
  }

  async function uploadFile(file, folder = "projects") {
    const client = getClient();
    const config = getConfig();

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const fileName = sanitizeFileName(file?.name);
    const objectPath = `${folder}/${Date.now()}-${fileName}`;
    const { error } = await client.storage.from(config.storageBucket).upload(objectPath, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file?.type || undefined,
    });

    if (error) {
      throw error;
    }

    const { data } = client.storage.from(config.storageBucket).getPublicUrl(objectPath);

    return {
      path: objectPath,
      publicUrl: data?.publicUrl || "",
    };
  }

  async function getSession() {
    const client = getClient();

    if (!client) {
      return null;
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function signIn(email, password) {
    const client = getClient();

    if (!client) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function signOut() {
    const client = getClient();

    if (!client) {
      return;
    }

    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  function onAuthStateChange(callback) {
    const client = getClient();

    if (!client) {
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    }

    return client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  window.PortfolioSupabase = {
    getConfig,
    isConfigured,
    getClient,
    slugify,
    deepClone,
    createEmptyProject,
    mapProjectRowToClient,
    mapProjectClientToRow,
    fetchProjects,
    fetchPublishedProjects,
    saveProject,
    deleteProject,
    seedProjects,
    uploadFile,
    getSession,
    signIn,
    signOut,
    onAuthStateChange,
  };
})();
