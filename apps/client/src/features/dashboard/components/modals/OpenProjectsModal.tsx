import React from "react";
import { SearchIcon, X, PlusIcon, Calendar } from "lucide-react";

interface OpenProjectsModalProps {
  isOpenModalOpen: boolean;
  setIsOpenModalOpen: (open: boolean) => void;
  projectSearchQuery: string;
  setProjectSearchQuery: (query: string) => void;
  projectSortBy: string;
  setProjectSortBy: (sort: string) => void;
  projectSortOrder: "desc" | "asc";
  setProjectSortOrder: (order: "desc" | "asc") => void;
  projectViewMode: "list" | "grid";
  setProjectViewMode: React.Dispatch<React.SetStateAction<"list" | "grid">>;
  getFilteredAndSortedProjects: () => any[];
  savedProjects: any[];
  setIsNewPresentationModalOpen: (open: boolean) => void;
  handleOpenProject: (project: any) => void;
  handleDeleteProject: (projectId: number) => void;
  editingModalProjectId: string | number | null;
  modalProjectNameInputRef: React.RefObject<HTMLInputElement>;
  editingModalProjectName: string;
  setEditingModalProjectName: (name: string) => void;
  handleModalProjectNameKeyDown: (e: React.KeyboardEvent) => void;
  saveModalProjectName: () => void;
  startEditingModalProjectName: (project: any) => void;
  formatProjectDate: (date: any) => string;
  calculateSlideCount: (project: any) => number;
}

export const OpenProjectsModal: React.FC<OpenProjectsModalProps> = ({
  isOpenModalOpen,
  setIsOpenModalOpen,
  projectSearchQuery,
  setProjectSearchQuery,
  projectSortBy,
  setProjectSortBy,
  projectSortOrder,
  setProjectSortOrder,
  projectViewMode,
  setProjectViewMode,
  getFilteredAndSortedProjects,
  savedProjects,
  setIsNewPresentationModalOpen,
  handleOpenProject,
  handleDeleteProject,
  editingModalProjectId,
  modalProjectNameInputRef,
  editingModalProjectName,
  setEditingModalProjectName,
  handleModalProjectNameKeyDown,
  saveModalProjectName,
  startEditingModalProjectName,
  formatProjectDate,
  calculateSlideCount,
}) => {
  if (!isOpenModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-gradient-to-br from-[#291D3C] to-[#1F1429] rounded-lg shadow-2xl w-full max-w-7xl mx-6 relative max-h-[90vh] flex flex-col border border-white/20">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsOpenModalOpen(false);
            // Reset search and filters when closing
            setProjectSearchQuery("");
            setProjectSortBy("lastModified");
            setProjectSortOrder("desc");
            setProjectViewMode("list");
          }}
          className="absolute top-6 right-6 text-gray-300 hover:text-white transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className="px-8 bg-[#291D3C]/50 backdrop-blur-sm rounded-t-lg pt-8 pb-8 flex-shrink-0 border-b border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4">Open Project</h1>
          <p className="text-gray-300 text-lg">
            Select a saved presentation to open and continue working.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="px-8 py-6 border-b border-white/20 flex-shrink-0">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by name, date, or description..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#2D1B42] border border-[#4A3B5C] rounded-lg text-white placeholder-gray-400 focus:border-[#8356F3] focus:outline-none transition-colors"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-4">
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <label className="text-gray-300 text-sm">Sort by:</label>
                <select
                  value={projectSortBy}
                  onChange={(e) => setProjectSortBy(e.target.value)}
                  className="bg-[#2D1B42] border border-[#4A3B5C] rounded-lg text-white px-3 py-2 text-sm focus:border-[#8356F3] focus:outline-none">
                  <option value="lastModified">Last Modified</option>
                  <option value="name">Name</option>
                  <option value="createdDate">Created Date</option>
                  <option value="presentationDate">Event Date</option>
                  <option value="slideCount">Slide Count</option>
                </select>
                <button
                  onClick={() =>
                    setProjectSortOrder(
                      projectSortOrder === "asc" ? "desc" : "asc",
                    )
                  }
                  className="p-2 bg-[#2D1B42] border border-[#4A3B5C] rounded-lg text-gray-400 hover:text-white hover:border-[#8356F3] transition-colors"
                  title={
                    projectSortOrder === "asc"
                      ? "Sort Descending"
                      : "Sort Ascending"
                  }>
                  {projectSortOrder === "asc" ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h9m0 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#2D1B42] border border-[#4A3B5C] rounded-lg p-1">
                <button
                  onClick={() => setProjectViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    projectViewMode === "grid"
                      ? "bg-[#8356F3] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid View">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setProjectViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    projectViewMode === "list"
                      ? "bg-[#8356F3] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="List View">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          {(() => {
            const filteredProjects = getFilteredAndSortedProjects();

            if (filteredProjects.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-48 h-32 border-2 border-dashed border-[#8356F3] rounded-lg flex items-center justify-center bg-transparent">
                      <div className="w-8 h-8 text-[#8356F3] flex items-center justify-center">
                        <PlusIcon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-lg mb-2">
                    No projects found
                  </div>
                  <div className="text-gray-500 text-sm">
                    {projectSearchQuery
                      ? "Try adjusting your search terms"
                      : "Create your first presentation to get started"}
                  </div>
                </div>
              );
            }

            if (projectViewMode === "grid") {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-[#2D1B42] border border-[#4A3B5C] rounded-lg overflow-hidden hover:border-[#8356F3] transition-colors group cursor-pointer"
                      onClick={() => handleOpenProject(project)}>
                      <div className="h-32 bg-gradient-to-r from-purple-900/20 to-purple-800/20 flex items-center justify-center relative">
                        <div className="text-purple-400">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4m0-1v1m8 0V3M8 8h8M8 12h8M8 16h4"
                            />
                          </svg>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        {editingModalProjectId === project.id ? (
                          <input
                            ref={modalProjectNameInputRef}
                            type="text"
                            value={editingModalProjectName}
                            onChange={(e) =>
                              setEditingModalProjectName(e.target.value)
                            }
                            onKeyDown={handleModalProjectNameKeyDown}
                            onBlur={saveModalProjectName}
                            className="bg-transparent text-white font-medium border-b border-white/50 focus:border-white outline-none px-1 mb-2 w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h3
                            className="text-white font-medium mb-2 line-clamp-2 cursor-pointer hover:text-gray-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingModalProjectName(project);
                            }}
                            title="Click to rename project">
                            {project.name}
                          </h3>
                        )}
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="space-y-1 text-sm text-gray-400">
                          <div>
                            Created: {formatProjectDate(project.createdAt)}
                          </div>
                          <div>
                            Event Date:{" "}
                            {project.presentationDate
                              ? formatProjectDate(project.presentationDate)
                              : "Not set"}
                          </div>
                          <div>
                            Modified:{" "}
                            {formatProjectDate(
                              project.updatedAt || project.createdAt,
                            )}
                          </div>
                          <div>{calculateSlideCount(project)} slides</div>
                        </div>
                      </div>

                      <div className="border-t border-[#4A3B5C] p-4 flex justify-between items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProject(project);
                          }}
                          className="text-[#8356F3] hover:text-[#7C3AED] transition-colors text-sm font-medium">
                          Open
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            } else {
              return (
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-[#2D1B42] border border-[#4A3B5C] rounded-lg hover:border-[#8356F3] transition-colors group cursor-pointer"
                      onClick={() => handleOpenProject(project)}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-purple-400 flex-shrink-0">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4m0-1v1m8 0V3M8 8h8M8 12h8M8 16h4"
                              />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            {editingModalProjectId === project.id ? (
                              <input
                                ref={modalProjectNameInputRef}
                                type="text"
                                value={editingModalProjectName}
                                onChange={(e) =>
                                  setEditingModalProjectName(e.target.value)
                                }
                                onKeyDown={handleModalProjectNameKeyDown}
                                onBlur={saveModalProjectName}
                                className="bg-transparent text-white font-medium border-b border-white/50 focus:border-white outline-none px-1 mb-1 w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <h3
                                className="text-white font-medium mb-1 truncate cursor-pointer hover:text-gray-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingModalProjectName(project);
                                }}
                                title="Click to rename project">
                                {project.name}
                              </h3>
                            )}
                            <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                              {project.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                Created: {formatProjectDate(project.createdAt)}
                              </span>
                              <span>
                                Event:{" "}
                                {project.presentationDate
                                  ? formatProjectDate(project.presentationDate)
                                  : "Not set"}
                              </span>
                              <span>
                                Modified:{" "}
                                {formatProjectDate(
                                  project.updatedAt || project.createdAt,
                                )}
                              </span>
                              <span>{calculateSlideCount(project)} slides</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(project);
                            }}
                            className="text-[#8356F3] hover:text-[#7C3AED] transition-colors text-sm font-medium px-3 py-1">
                            Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors text-sm px-3 py-1">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
          })()}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <div className="text-gray-400 text-sm">
            Showing {getFilteredAndSortedProjects().length} of{" "}
            {savedProjects.length} projects
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsOpenModalOpen(false);
                setIsNewPresentationModalOpen(true);
              }}
              className="px-6 py-3 bg-[#8356F3] hover:bg-[#7C3AED] text-white rounded-lg transition-all">
              Create new presentation
            </button>
            <button
              onClick={() => {
                setIsOpenModalOpen(false);
                setProjectSearchQuery("");
                setProjectSortBy("lastModified");
                setProjectSortOrder("desc");
                setProjectViewMode("list");
              }}
              className="px-6 py-3 bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
