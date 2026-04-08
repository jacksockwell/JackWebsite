(function bootstrapPortfolioFromSupabase() {
  const api = window.PortfolioSupabase;

  window.portfolioBootstrapPromise = (async () => {
    if (!api?.isConfigured()) {
      return;
    }

    const remoteProjects = await api.fetchPublishedProjects();

    if (Array.isArray(remoteProjects) && remoteProjects.length) {
      window.portfolioItems = remoteProjects;
      window.portfolioSource = "supabase";
    } else {
      window.portfolioSource = "local";
    }
  })().catch((error) => {
    console.warn("Unable to load portfolio projects from Supabase.", error);
    window.portfolioSource = "local";
  });
})();
