export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/_includes/svg": "assets/svg" });
  eleventyConfig.addPassthroughCopy({ ".nojekyll": ".nojekyll" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  eleventyConfig.addCollection("practices", (collection) =>
    collection
      .getFilteredByGlob("src/practices/*.md")
      .sort((a, b) => (a.data.title || "").localeCompare(b.data.title || "")),
  );

  eleventyConfig.addCollection("routines", (collection) =>
    collection
      .getFilteredByGlob("src/routines/*.md")
      .sort((a, b) => (a.data.title || "").localeCompare(b.data.title || "")),
  );

  eleventyConfig.addFilter("findBySlug", (collection, slug) => {
    if (!collection) return null;
    return collection.find(
      (item) => (item.data && item.data.slug ? item.data.slug : item.fileSlug) === slug,
    );
  });

  eleventyConfig.addFilter("includesCategory", (routines, category) => {
    if (!routines) return [];
    return routines.filter((r) => ((r.data && r.data.categories) || []).includes(category));
  });

  eleventyConfig.addCollection("practicesByFlag", (collection) => {
    const groups = { quiet: [], active: [], "body-intense": [], tender: [] };
    for (const p of collection.getFilteredByGlob("src/practices/*.md")) {
      const flag = p.data.accessibility_flag;
      if (groups[flag]) groups[flag].push(p);
    }
    for (const flag of Object.keys(groups)) {
      groups[flag].sort((a, b) =>
        (a.data.title || "").localeCompare(b.data.title || ""),
      );
    }
    return groups;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
