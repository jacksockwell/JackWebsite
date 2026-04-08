const portfolioAdminApi = window.PortfolioSupabase;

const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const sessionPanel = document.getElementById("sessionPanel");
const sessionCopy = document.getElementById("sessionCopy");
const signOutButton = document.getElementById("signOutButton");
const adminStatus = document.getElementById("adminStatus");
const newProjectButton = document.getElementById("newProjectButton");
const refreshProjectsButton = document.getElementById("refreshProjectsButton");
const importLocalButton = document.getElementById("importLocalButton");
const projectList = document.getElementById("projectList");
const projectForm = document.getElementById("projectForm");
const projectFieldset = document.getElementById("projectFieldset");
const projectId = document.getElementById("projectId");
const projectSlug = document.getElementById("projectSlug");
const projectSection = document.getElementById("projectSection");
const projectStatus = document.getElementById("projectStatus");
const projectTitle = document.getElementById("projectTitle");
const projectDateLabel = document.getElementById("projectDateLabel");
const projectSortOrder = document.getElementById("projectSortOrder");
const projectText = document.getElementById("projectText");
const projectMadeIn = document.getElementById("projectMadeIn");
const thumbnailSrc = document.getElementById("thumbnailSrc");
const thumbnailAlt = document.getElementById("thumbnailAlt");
const thumbnailUpload = document.getElementById("thumbnailUpload");
const thumbnailPreview = document.getElementById("thumbnailPreview");
const mediaRows = document.getElementById("mediaRows");
const mediaRowTemplate = document.getElementById("mediaRowTemplate");
const addMediaButton = document.getElementById("addMediaButton");
const deleteProjectButton = document.getElementById("deleteProjectButton");

const adminState = {
  session: null,
  projects: [],
  selectedProject: portfolioAdminApi.createEmptyProject(),
};

function setAdminStatus(message, tone = "info") {
  adminStatus.textContent = message;
  adminStatus.classList.remove("is-error", "is-warning");

  if (tone === "error") {
    adminStatus.classList.add("is-error");
  }

  if (tone === "warning") {
    adminStatus.classList.add("is-warning");
  }
}

function sortProjects(projects) {
  return [...projects].sort((left, right) => {
    if ((right.sortOrder || 0) !== (left.sortOrder || 0)) {
      return (right.sortOrder || 0) - (left.sortOrder || 0);
    }

    return (left.title || "").localeCompare(right.title || "");
  });
}

function resolveAssetUrl(src) {
  const cleaned = typeof src === "string" ? src.trim() : "";

  if (!cleaned) {
    return "";
  }

  try {
    return new URL(cleaned, window.location.href).href;
  } catch (_error) {
    return cleaned;
  }
}

function guessAssetType(src, fallback = "image") {
  return /\.(mp4|mov|m4v|webm)(?:[?#].*)?$/i.test(src || "") ? "video" : fallback;
}

function setPreviewEmpty(container, message) {
  if (!container) {
    return;
  }

  container.replaceChildren();
  container.classList.add("is-empty");

  const empty = document.createElement("p");
  empty.className = "admin-preview-empty";
  empty.textContent = message;
  container.append(empty);
}

function renderAssetPreview(container, asset = {}, options = {}) {
  if (!container) {
    return;
  }

  const {
    compact = false,
    emptyMessage = "Preview will show here.",
    fallbackAlt = "Portfolio asset preview",
    showSource = true,
    sourceLabel = "",
  } = options;

  const source = typeof asset?.src === "string" ? asset.src.trim() : "";
  const previewUrl = resolveAssetUrl(source);

  if (!previewUrl) {
    setPreviewEmpty(container, emptyMessage);
    return;
  }

  container.replaceChildren();
  container.classList.remove("is-empty");

  const type = asset?.type === "video" ? "video" : guessAssetType(source, "image");
  const mediaElement = document.createElement(type === "video" ? "video" : "img");

  if (type === "video") {
    mediaElement.src = previewUrl;
    mediaElement.preload = "metadata";
    mediaElement.playsInline = true;

    const posterUrl = resolveAssetUrl(asset?.poster || "");
    if (posterUrl) {
      mediaElement.poster = posterUrl;
    }

    if (compact) {
      mediaElement.autoplay = true;
      mediaElement.loop = true;
      mediaElement.muted = true;
    } else {
      mediaElement.controls = true;
    }
  } else {
    mediaElement.src = previewUrl;
    mediaElement.alt = asset?.alt?.trim() || fallbackAlt;
    mediaElement.loading = "lazy";
  }

  mediaElement.addEventListener("error", () => {
    setPreviewEmpty(container, "Could not load preview.");
  });

  container.append(mediaElement);

  if (showSource) {
    const sourceCopy = document.createElement("p");
    sourceCopy.className = "admin-preview-source";
    sourceCopy.textContent = sourceLabel ? `${sourceLabel}: ${source}` : source;
    container.append(sourceCopy);
  }
}

function getProjectPreviewAsset(project) {
  if (project?.thumbnail?.src) {
    return {
      src: project.thumbnail.src,
      alt: project.thumbnail.alt || `${project.title || "Project"} thumbnail`,
      type: guessAssetType(project.thumbnail.src, "image"),
    };
  }

  const firstMedia = Array.isArray(project?.media) ? project.media.find((item) => item?.src) : null;
  return firstMedia || null;
}

function refreshThumbnailPreview() {
  renderAssetPreview(
    thumbnailPreview,
    {
      src: thumbnailSrc.value.trim(),
      alt: thumbnailAlt.value.trim() || `${projectTitle.value.trim() || "Project"} thumbnail`,
      type: guessAssetType(thumbnailSrc.value.trim(), "image"),
    },
    {
      emptyMessage: "Thumbnail preview will show here.",
      fallbackAlt: `${projectTitle.value.trim() || "Project"} thumbnail`,
      showSource: true,
      sourceLabel: "Thumbnail",
    },
  );
}

function createBlankProject() {
  const highestSortOrder = adminState.projects.reduce((highest, project) => {
    const nextSortOrder = Number(project.sortOrder) || 0;
    return Math.max(highest, nextSortOrder);
  }, new Date().getFullYear() * 100);

  return {
    ...portfolioAdminApi.createEmptyProject(),
    sortOrder: highestSortOrder + 1,
    status: "draft",
    section: "art",
    media: [createEmptyMedia()],
  };
}

function getSelectedProjectKey(project = adminState.selectedProject) {
  return project?.id || project?.slug || "__new__";
}

function setEditorEnabled(enabled) {
  authSubmit.disabled = !portfolioAdminApi.isConfigured();
  authEmail.disabled = !portfolioAdminApi.isConfigured();
  authPassword.disabled = !portfolioAdminApi.isConfigured();

  newProjectButton.disabled = !enabled;
  refreshProjectsButton.disabled = !enabled;
  importLocalButton.disabled = !enabled;
  projectFieldset.disabled = !enabled;
}

function formatProjectMeta(project) {
  const mediaCount = Array.isArray(project.media) ? project.media.length : 0;
  return [project.dateLabel || "No timeline label", project.section || "art", project.status || "draft", `${mediaCount} items`].join(" • ");
}

function renderProjectList() {
  projectList.replaceChildren();

  if (!portfolioAdminApi.isConfigured()) {
    const empty = document.createElement("p");
    empty.className = "admin-helper";
    empty.textContent = "Fill in supabase-config.js first, then sign in here.";
    projectList.append(empty);
    return;
  }

  if (!adminState.session) {
    const empty = document.createElement("p");
    empty.className = "admin-helper";
    empty.textContent = "Sign in to load and edit your remote portfolio projects.";
    projectList.append(empty);
    return;
  }

  if (!adminState.projects.length) {
    const empty = document.createElement("p");
    empty.className = "admin-helper";
    empty.textContent = "No remote projects yet. Import your local portfolio or create a fresh project.";
    projectList.append(empty);
    return;
  }

  const selectedKey = getSelectedProjectKey();

  adminState.projects.forEach((project) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-project-item";

    if (selectedKey === getSelectedProjectKey(project)) {
      button.classList.add("is-active");
    }

    const title = document.createElement("p");
    title.className = "admin-project-item-title";
    title.textContent = project.title || "Untitled project";

    const meta = document.createElement("p");
    meta.className = "admin-project-item-meta";
    meta.textContent = formatProjectMeta(project);

    const preview = document.createElement("div");
    preview.className = "admin-asset-preview admin-project-item-thumb";
    renderAssetPreview(preview, getProjectPreviewAsset(project), {
      compact: true,
      emptyMessage: "No preview",
      fallbackAlt: `${project.title || "Project"} preview`,
      showSource: false,
    });

    const copy = document.createElement("div");
    copy.className = "admin-project-item-copy";
    copy.append(title, meta);

    button.append(preview, copy);
    button.addEventListener("click", () => {
      selectProject(project);
    });
    projectList.append(button);
  });
}

function syncFormWithProject(project) {
  const nextProject = portfolioAdminApi.deepClone(project || createBlankProject());
  adminState.selectedProject = nextProject;

  projectId.value = nextProject.id || "";
  projectSlug.value = nextProject.slug || "";
  projectSection.value = nextProject.section || "art";
  projectStatus.value = nextProject.status || "draft";
  projectTitle.value = nextProject.title || "";
  projectDateLabel.value = nextProject.dateLabel || "";
  projectSortOrder.value = Number.isFinite(Number(nextProject.sortOrder)) ? String(nextProject.sortOrder) : "";
  projectText.value = nextProject.text || "";
  projectMadeIn.value = Array.isArray(nextProject.madeIn) ? nextProject.madeIn.join(", ") : "";
  thumbnailSrc.value = nextProject.thumbnail?.src || "";
  thumbnailAlt.value = nextProject.thumbnail?.alt || "";
  thumbnailUpload.value = "";
  refreshThumbnailPreview();

  renderMediaRows(Array.isArray(nextProject.media) && nextProject.media.length ? nextProject.media : [createEmptyMedia()]);
  renderProjectList();
}

function selectProject(project) {
  syncFormWithProject(project);
}

function createEmptyMedia() {
  return {
    src: "",
    alt: "",
    caption: "",
    type: "image",
    poster: "",
    stage: "",
  };
}

function moveMediaRow(row, direction) {
  if (!row?.parentElement) {
    return;
  }

  if (direction < 0 && row.previousElementSibling) {
    row.parentElement.insertBefore(row, row.previousElementSibling);
  }

  if (direction > 0 && row.nextElementSibling) {
    row.parentElement.insertBefore(row.nextElementSibling, row);
  }
}

async function uploadFileAndPopulate(file, onComplete, folder) {
  if (!file) {
    return;
  }

  setAdminStatus(`Uploading ${file.name}…`);

  try {
    const uploaded = await portfolioAdminApi.uploadFile(file, folder);
    onComplete(uploaded.publicUrl);
    setAdminStatus(`Uploaded ${file.name}.`);
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Upload failed.", "error");
  }
}

function createMediaRow(media = createEmptyMedia()) {
  const fragment = mediaRowTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".admin-media-row");
  const preview = fragment.querySelector(".admin-media-preview");
  const srcInput = fragment.querySelector(".media-src");
  const typeInput = fragment.querySelector(".media-type");
  const stageInput = fragment.querySelector(".media-stage");
  const altInput = fragment.querySelector(".media-alt");
  const captionInput = fragment.querySelector(".media-caption");
  const posterInput = fragment.querySelector(".media-poster");
  const uploadInput = fragment.querySelector(".media-upload");
  const upButton = fragment.querySelector('[data-media-action="up"]');
  const downButton = fragment.querySelector('[data-media-action="down"]');
  const removeButton = fragment.querySelector('[data-media-action="remove"]');

  srcInput.value = media.src || "";
  typeInput.value = media.type || "image";
  stageInput.value = media.stage || (projectSection.value === "wips" ? "wip" : "finished");
  altInput.value = media.alt || "";
  captionInput.value = media.caption || "";
  posterInput.value = media.poster || "";

  const refreshPreview = () => {
    renderAssetPreview(
      preview,
      {
        src: srcInput.value.trim(),
        type: typeInput.value || "image",
        stage: stageInput.value || (projectSection.value === "wips" ? "wip" : "finished"),
        alt: altInput.value.trim() || `${projectTitle.value.trim() || "Project"} media item`,
        poster: posterInput.value.trim(),
      },
      {
        emptyMessage: "Media preview will show here.",
        fallbackAlt: altInput.value.trim() || `${projectTitle.value.trim() || "Project"} media item`,
        showSource: true,
        sourceLabel: typeInput.value === "video" ? "Video" : "Image",
      },
    );
  };

  upButton.addEventListener("click", () => {
    moveMediaRow(row, -1);
  });

  downButton.addEventListener("click", () => {
    moveMediaRow(row, 1);
  });

  removeButton.addEventListener("click", () => {
    row.remove();

    if (!mediaRows.childElementCount) {
      mediaRows.append(createMediaRow());
    }
  });

  uploadInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    await uploadFileAndPopulate(
      file,
      (publicUrl) => {
        srcInput.value = publicUrl;

        if (file?.type?.startsWith("video/")) {
          typeInput.value = "video";
        }

        if (!altInput.value.trim() && projectTitle.value.trim()) {
          altInput.value = `${projectTitle.value.trim()} media item`;
        }

        refreshPreview();
      },
      "projects",
    );

    uploadInput.value = "";
  });

  srcInput.addEventListener("input", refreshPreview);
  typeInput.addEventListener("change", refreshPreview);
  stageInput.addEventListener("change", refreshPreview);
  altInput.addEventListener("input", refreshPreview);
  posterInput.addEventListener("input", refreshPreview);
  refreshPreview();

  return fragment;
}

function renderMediaRows(items) {
  mediaRows.replaceChildren();
  items.forEach((item) => {
    mediaRows.append(createMediaRow(item));
  });
}

function readMediaRows() {
  return Array.from(mediaRows.querySelectorAll(".admin-media-row"))
    .map((row) => {
      const src = row.querySelector(".media-src")?.value.trim() || "";

      if (!src) {
        return null;
      }

      return {
        src,
        type: row.querySelector(".media-type")?.value || "image",
        stage: row.querySelector(".media-stage")?.value || (projectSection.value === "wips" ? "wip" : "finished"),
        alt: row.querySelector(".media-alt")?.value.trim() || "",
        caption: row.querySelector(".media-caption")?.value.trim() || "",
        poster: row.querySelector(".media-poster")?.value.trim() || "",
      };
    })
    .filter(Boolean);
}

function readProjectForm() {
  const media = readMediaRows();

  if (!projectTitle.value.trim()) {
    throw new Error("Project title is required.");
  }

  if (!media.length) {
    throw new Error("Add at least one media item before saving.");
  }

  const thumbnail = thumbnailSrc.value.trim()
    ? {
        src: thumbnailSrc.value.trim(),
        alt: thumbnailAlt.value.trim(),
      }
    : null;

  return {
    id: projectId.value.trim(),
    slug: projectSlug.value.trim(),
    section: projectSection.value,
    status: projectStatus.value,
    title: projectTitle.value.trim(),
    text: projectText.value.trim(),
    dateLabel: projectDateLabel.value.trim(),
    sortOrder: Number(projectSortOrder.value) || 0,
    madeIn: projectMadeIn.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    thumbnail,
    media,
  };
}

async function refreshProjects(preserveSelection = true) {
  if (!portfolioAdminApi.isConfigured()) {
    renderProjectList();
    return;
  }

  if (!adminState.session) {
    adminState.projects = [];
    renderProjectList();
    syncFormWithProject(createBlankProject());
    return;
  }

  const currentKey = preserveSelection ? getSelectedProjectKey() : "";
  setAdminStatus("Loading projects…");

  try {
    const remoteProjects = await portfolioAdminApi.fetchProjects({ includeDrafts: true });
    adminState.projects = sortProjects(remoteProjects);

    const nextProject =
      adminState.projects.find((project) => getSelectedProjectKey(project) === currentKey) ||
      adminState.projects[0] ||
      createBlankProject();

    renderProjectList();
    syncFormWithProject(nextProject);
    setAdminStatus(`Loaded ${adminState.projects.length} project${adminState.projects.length === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Could not load remote projects.", "error");
  }
}

function updateAuthUi(session) {
  adminState.session = session;
  authForm.hidden = Boolean(session);
  sessionPanel.hidden = !session;
  sessionCopy.textContent = session?.user?.email ? `Signed in as ${session.user.email}` : "Signed in.";
  setEditorEnabled(Boolean(session) && portfolioAdminApi.isConfigured());
  renderProjectList();
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!portfolioAdminApi.isConfigured()) {
    setAdminStatus("Open supabase-config.js and add your Supabase URL + anon key first.", "warning");
    return;
  }

  authSubmit.disabled = true;
  setAdminStatus("Signing in…");

  try {
    const session = await portfolioAdminApi.signIn(authEmail.value.trim(), authPassword.value);
    authPassword.value = "";
    updateAuthUi(session);
    await refreshProjects(false);
    setAdminStatus("Signed in and ready to edit.");
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Sign in failed.", "error");
  } finally {
    authSubmit.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  try {
    await portfolioAdminApi.signOut();
    updateAuthUi(null);
    syncFormWithProject(createBlankProject());
    setAdminStatus("Signed out.");
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Sign out failed.", "error");
  }
});

newProjectButton.addEventListener("click", () => {
  syncFormWithProject(createBlankProject());
  setAdminStatus("New draft ready.");
});

refreshProjectsButton.addEventListener("click", async () => {
  await refreshProjects(true);
});

importLocalButton.addEventListener("click", async () => {
  if (!adminState.session) {
    setAdminStatus("Sign in before importing local projects.", "warning");
    return;
  }

  const localProjects = Array.isArray(window.portfolioItems) ? window.portfolioItems : [];

  if (!localProjects.length) {
    setAdminStatus("No local portfolio data was found to import.", "warning");
    return;
  }

  const approved = window.confirm(
    `Import ${localProjects.length} local project${localProjects.length === 1 ? "" : "s"} into Supabase? Existing rows with matching slugs will be updated.`,
  );

  if (!approved) {
    return;
  }

  setAdminStatus("Importing local portfolio…");

  try {
    await portfolioAdminApi.seedProjects(localProjects);
    await refreshProjects(false);
    setAdminStatus(`Imported ${localProjects.length} local project${localProjects.length === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Import failed.", "error");
  }
});

thumbnailUpload.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];

  await uploadFileAndPopulate(
  file,
    (publicUrl) => {
      thumbnailSrc.value = publicUrl;

      if (!thumbnailAlt.value.trim() && projectTitle.value.trim()) {
        thumbnailAlt.value = `${projectTitle.value.trim()} thumbnail`;
      }

      refreshThumbnailPreview();
    },
    "thumbnails",
  );

  thumbnailUpload.value = "";
});

thumbnailSrc.addEventListener("input", refreshThumbnailPreview);
thumbnailAlt.addEventListener("input", refreshThumbnailPreview);
projectTitle.addEventListener("input", refreshThumbnailPreview);

addMediaButton.addEventListener("click", () => {
  mediaRows.append(createMediaRow());
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!adminState.session) {
    setAdminStatus("Sign in before saving projects.", "warning");
    return;
  }

  try {
    const project = readProjectForm();
    setAdminStatus(`Saving ${project.title}…`);
    const savedProject = await portfolioAdminApi.saveProject(project);
    adminState.projects = sortProjects([
      ...adminState.projects.filter((item) => item.id !== savedProject.id),
      savedProject,
    ]);
    syncFormWithProject(savedProject);
    setAdminStatus(`Saved ${savedProject.title}.`);
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Save failed.", "error");
  }
});

deleteProjectButton.addEventListener("click", async () => {
  if (!adminState.session) {
    setAdminStatus("Sign in before deleting projects.", "warning");
    return;
  }

  const activeId = projectId.value.trim();

  if (!activeId) {
    syncFormWithProject(createBlankProject());
    setAdminStatus("Unsaved draft cleared.");
    return;
  }

  const approved = window.confirm(`Delete "${projectTitle.value.trim() || "this project"}"? This cannot be undone.`);

  if (!approved) {
    return;
  }

  try {
    await portfolioAdminApi.deleteProject(activeId);
    adminState.projects = adminState.projects.filter((project) => project.id !== activeId);
    const nextProject = adminState.projects[0] || createBlankProject();
    syncFormWithProject(nextProject);
    setAdminStatus("Project deleted.");
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || "Delete failed.", "error");
  }
});

portfolioAdminApi.onAuthStateChange(async (_event, session) => {
  updateAuthUi(session);

  if (session) {
    await refreshProjects(true);
  }
});

(async function initPortfolioAdmin() {
  if (!portfolioAdminApi.isConfigured()) {
    updateAuthUi(null);
    syncFormWithProject(createBlankProject());
    setAdminStatus("Supabase is not configured yet. Add your project URL and anon key in supabase-config.js, then run the SQL setup.", "warning");
    return;
  }

  try {
    const session = await portfolioAdminApi.getSession();
    updateAuthUi(session);

    if (session) {
      await refreshProjects(false);
      setAdminStatus("Signed in and ready to edit.");
    } else {
      syncFormWithProject(createBlankProject());
      setAdminStatus("Supabase is configured. Sign in to start editing.");
    }
  } catch (error) {
    console.error(error);
    updateAuthUi(null);
    syncFormWithProject(createBlankProject());
    setAdminStatus(error.message || "Could not initialize the admin editor.", "error");
  }
})();
