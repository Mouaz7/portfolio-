"use client";
import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { type Project } from "@/components/projects/ProjectCard";
import { CATEGORY_COLORS } from "@/components/projects/CategoryFolder";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAccentHex } from "@/lib/hooks/useAccentRgb";

const ProjectsPageClient: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // DB-driven accent, live with the theme toggle.
  const ACCENT = useAccentHex();

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/project");
        if (!res.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await res.json();
        setProjects(data);

        // Set first category as open by default
        if (data.length > 0) {
          const firstCategory = data[0].category;
          setOpenCategory(firstCategory);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Group projects by category
  const projectsByCategory = projects.reduce((acc, project) => {
    if (!acc[project.category]) {
      acc[project.category] = [];
    }
    acc[project.category].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <div className="relative flex flex-col overflow-hidden h-screen">
      <Header />

      {/* Main area (constellation backdrop is global in app/layout.tsx) */}
      <main className="relative flex-1 min-h-0 overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 flex flex-col">
        {/* Content above the global backdrop - NO SCROLLING */}
        <div className="relative z-10 flex flex-col h-full max-w-[1800px] mx-auto w-full overflow-hidden">
        {/* Loading State */}
        {loading && <LoadingAnimation text="Loading projects..." />}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-accent hover:bg-accent-strong text-white font-medium rounded-full transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-accent mb-2">
                No projects found
              </h3>
              <p className="text-white/70">
                No projects available at the moment.
              </p>
            </div>
          </div>
        )}

        {/* Projects List */}
        {!loading && !error && projects.length > 0 && (
          <div className="h-full flex flex-col px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 md:py-6 gap-3 sm:gap-4 md:gap-5">
            {/* Category Selector */}
            <div className="flex-shrink-0">
              <div className="flex gap-2 sm:gap-2.5 md:gap-3 justify-center flex-wrap max-w-5xl mx-auto">
                {Object.keys(projectsByCategory).map((category) => {
                  const isActive = openCategory === category;
                  const colors = CATEGORY_COLORS[category];
                  const projectCount = projectsByCategory[category].length;

                  return (
                    <motion.button
                      key={category}
                      onClick={() => setOpenCategory(category)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 border-2"
                      style={{
                        backgroundColor: isActive ? `${colors?.accent || ACCENT}25` : 'var(--fg-10)',
                        borderColor: isActive ? `${colors?.accent || ACCENT}` : 'var(--surface-border)',
                        color: isActive ? '#fff' : 'var(--fg-70)',
                        boxShadow: isActive ? `0 0 20px ${colors?.glow || 'rgba(var(--accent-rgb),0.5)'}` : 'none',
                      }}
                    >
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        {category}
                        <span
                          className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor: isActive ? `${colors?.accent || ACCENT}40` : 'var(--fg-10)',
                          }}
                        >
                          {projectCount}
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Horizontal List Layout */}
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent">
              <AnimatePresence mode="wait">
                {openCategory && projectsByCategory[openCategory] && (
                  <motion.div
                    key={openCategory}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-3 sm:space-y-4"
                  >
                    {projectsByCategory[openCategory].map((project, idx) => {
                      const colors = CATEGORY_COLORS[openCategory];
                      const accentColor = colors?.accent || ACCENT;

                      return (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-center gap-4 sm:gap-5 md:gap-6 p-3 sm:p-4 bg-[var(--surface-2)]/40 backdrop-blur-sm border border-white/5 hover:border-white/20 transition-all duration-300 rounded-lg"
                          style={{
                            borderLeftColor: accentColor,
                            borderLeftWidth: '3px'
                          }}
                        >
                          {/* Icon - Fixed Size */}
                          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] flex items-center justify-center p-3 border border-white/10 rounded-md">
                            {project.cover_image_url ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={project.cover_image_url}
                                  alt={project.title}
                                  fill
                                  className="object-contain"
                                  sizes="96px"
                                />
                              </div>
                            ) : (
                              <div className="text-white/20 text-xs">No Icon</div>
                            )}
                          </div>

                          {/* Info - Always Visible */}
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1"
                              style={{ color: accentColor }}
                            >
                              {project.category}
                            </div>

                            <h3 className="text-white font-bold text-base sm:text-lg md:text-xl mb-1 truncate">
                              {project.title}
                            </h3>

                            <p className="text-white/60 text-xs sm:text-sm mb-2 line-clamp-2">
                              {project.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                              {project.languages.slice(0, 5).map((lang) => (
                                <span
                                  key={lang}
                                  className="text-[10px] sm:text-xs px-2 py-0.5 bg-white/5 text-white/70 border border-white/10 rounded"
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* GitHub Link */}
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-3 sm:p-4 hover:bg-white/5 transition-colors border border-white/10 hover:border-white/30 group rounded-md"
                            style={{
                              borderColor: `${accentColor}30`
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 fill-current text-white/70 group-hover:text-white transition-colors"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          </a>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default ProjectsPageClient;
