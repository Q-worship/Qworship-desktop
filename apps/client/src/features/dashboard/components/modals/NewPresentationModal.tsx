import React from "react";
import { X, Calendar } from "lucide-react";

interface NewPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPresentationName: string;
  setNewPresentationName: (name: string) => void;
  isModalCalendarOpen: boolean;
  setIsModalCalendarOpen: (isOpen: boolean) => void;
  modalSelectedDate: Date | null;
  formatModalDate: (date: Date | null) => string;
  renderModalCalendar: () => React.ReactNode;
  handleCreateNewPresentation: () => void;
}

export function NewPresentationModal({
  isOpen,
  onClose,
  newPresentationName,
  setNewPresentationName,
  isModalCalendarOpen,
  setIsModalCalendarOpen,
  modalSelectedDate,
  formatModalDate,
  renderModalCalendar,
  handleCreateNewPresentation,
}: NewPresentationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-gradient-to-b from-[#3B1E5F] to-[#1A0B2E] rounded-lg shadow-2xl w-full max-w-4xl mx-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className="px-16 bg-[#291D3C] rounded-t-lg pt-[37px] pb-[37px]">
          <h1 className="text-4xl font-bold text-white mb-6">
            Create New Presentation
          </h1>
          <p className="text-gray-300 text-lg">
            Enter a title to begin your church presentation.
          </p>
        </div>

        {/* Form Section */}
        <div className="px-16 pb-16 mt-[82px] mb-[82px]">
          <div className="grid grid-cols-2 gap-16">
            {/* Presentation Name */}
            <div>
              <label className="block text-white text-xl font-medium mb-8">
                Presentation Name
              </label>
              <input
                type="text"
                value={newPresentationName}
                onChange={(e) => setNewPresentationName(e.target.value)}
                placeholder="e.g., Sunday Service, Christmas Special"
                className="w-full px-6 py-5 bg-[#2D1B42] border border-[#4A3B5C] rounded-lg text-white placeholder-gray-400 focus:border-[#8356F3] focus:outline-none transition-colors text-lg"
                autoFocus
              />
            </div>

            {/* Presentation Date */}
            <div>
              <label className="block text-white text-xl font-medium mb-8">
                Presentation Date
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsModalCalendarOpen(!isModalCalendarOpen)}
                  className="modal-date-button w-full px-6 py-5 bg-[#2D1B42] border border-[#4A3B5C] rounded-lg text-white focus:border-[#8356F3] focus:outline-none transition-colors text-lg text-left flex items-center justify-between"
                >
                  <span>{formatModalDate(modalSelectedDate)}</span>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </button>
                {isModalCalendarOpen && renderModalCalendar()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 px-16 py-10">
          <div className="flex justify-end gap-6">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-lg transition-all text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNewPresentation}
              className="px-8 py-3 bg-[#8356F3] hover:bg-[#7C3AED] text-white rounded-lg transition-all text-lg"
              disabled={!newPresentationName.trim()}
            >
              Create presentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
