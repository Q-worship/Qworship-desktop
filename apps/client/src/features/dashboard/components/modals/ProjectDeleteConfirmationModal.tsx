import React from "react";

interface ProjectDeleteConfirmationModalProps {
  isDeleteModalOpen: boolean;
  projectToDelete: any;
  cancelDeleteProject: () => void;
  confirmDeleteProject: () => void;
  deletePresentationMutation: { isPending: boolean }; // Adjust type based on react-query
}

export const ProjectDeleteConfirmationModal: React.FC<
  ProjectDeleteConfirmationModalProps
> = ({
  isDeleteModalOpen,
  projectToDelete,
  cancelDeleteProject,
  confirmDeleteProject,
  deletePresentationMutation,
}) => {
  if (!isDeleteModalOpen || !projectToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-gradient-to-b from-[#2a1f3d] to-[#1a0f2e] border border-[#8356F3]/30 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-3">
            Delete Project
          </h3>

          {/* Message */}
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete the project:
          </p>
          <p className="font-medium text-[#8356F3] text-lg mb-6">
            "{projectToDelete.name}"
          </p>

          <p className="text-sm text-gray-400 mb-8">
            This action will permanently delete all content, slides, and
            settings. This cannot be undone.
          </p>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={cancelDeleteProject}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button
              onClick={confirmDeleteProject}
              disabled={deletePresentationMutation.isPending}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium">
              {deletePresentationMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
