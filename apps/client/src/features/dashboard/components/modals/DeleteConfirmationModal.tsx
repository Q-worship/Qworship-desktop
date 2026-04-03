import React from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  deleteConfirmation: { isOpen: boolean; item: any; sectionName: string };
  cancelDelete: () => void;
  confirmDelete: () => void;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({ deleteConfirmation, cancelDelete, confirmDelete }) => {
  if (!deleteConfirmation.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-gradient-to-b from-[#2a1f3d] to-[#1a0f2e] border border-[#8356F3]/30 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-3">Remove Item</h3>

          {/* Message */}
          <p className="text-gray-300 mb-6">
            Are you sure you want to remove "
            <span className="font-medium text-white">
              {deleteConfirmation.item?.title}
            </span>
            " from{" "}
            <span className="font-medium text-[#8356F3]">
              {deleteConfirmation.sectionName}
            </span>
            ?
          </p>

          <p className="text-sm text-gray-400 mb-8">
            This will also remove any associated slides and content. This action
            cannot be undone.
          </p>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={cancelDelete}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
