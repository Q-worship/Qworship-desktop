import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/features/auth/auth.store";
import {
  CalendarIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  FolderIcon,
  ClockIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import qworshipLogo from "@assets/Group 1_1754122708985.png";

export interface Presentation {
  id: number | string;
  name: string;
  description: string;
  presentationDate: string;
  createdAt: string;
  updatedAt: string;
  slideCount: number;
  status: string;
}

import { useProjectsOffline } from "@/hooks/useProjectsOffline";

export function ProjectSelection() {
  const [, setLocation] = useLocation();
  const user = useAuthStore((state) => state.user);
  const authLoading = false; // Zustand is synchronous; keeping for compat
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for new presentation creation
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPresentationName, setNewPresentationName] = useState("");
  const [newPresentationDate, setNewPresentationDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Calendar modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Calculate the next coming Sunday
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(
      today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
    );
    return nextSunday;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(
      today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
    );
    return new Date(nextSunday.getFullYear(), nextSunday.getMonth(), 1);
  });

  // Initialize next Sunday date for new presentation
  useEffect(() => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(
      today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
    );
    const formattedDate = nextSunday.toISOString().split("T")[0];
    setNewPresentationDate(formattedDate);
  }, []);

  // Fetch user presentations & mutations via Offline Sync Hook
  const { 
    presentations: rawPresentations, 
    isLoading: presentationsLoading,
    createPresentationMutation,
    loadPresentationMutation 
  } = useProjectsOffline(user);

  const presentations: Presentation[] = rawPresentations as any[];

  // Filter presentations based on search
  const filteredPresentations = presentations.filter(
    (presentation) =>
      presentation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      presentation.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const handleCreateMutate = (data: any) => {
    createPresentationMutation.mutate(data, {
      onSuccess: (resData) => {
        sessionStorage.setItem("qworship_current_presentation_id", resData.presentation.id.toString());
        sessionStorage.setItem("qworship_current_presentation_name", resData.presentation.name);
        toast({
          title: "New Presentation Created",
          description: `"${resData.presentation.name}" is ready for content.`,
        });
        setLocation("/live-console");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to create presentation", variant: "destructive" });
      }
    });
  };

  const handleLoadMutate = (id: any) => {
    toast({
      title: "Loading Project...",
      description: "Preparing your workspace, please wait.",
    });

    loadPresentationMutation.mutate(id, {
      onSuccess: (resData) => {
        sessionStorage.setItem("qworship_current_presentation_id", resData.presentation.id.toString());
        sessionStorage.setItem("qworship_current_presentation_name", resData.presentation.name);
        
        if (resData.presentation.serviceData) {
          const dataStringToUse = typeof resData.presentation.serviceData === 'string' 
              ? resData.presentation.serviceData 
              : JSON.stringify(resData.presentation);
              
          sessionStorage.setItem("qworship_presentation_to_load", dataStringToUse);
        }
        toast({
          title: "Project Opened",
          description: `"${resData.presentation.name}" has been loaded successfully.`,
        });
        setLocation("/live-console");
      },
      onError: (err: any) => {
        toast({ title: "Load Error", description: err.message || "Failed to load presentation", variant: "destructive" });
      }
    });
  };

  // Handle creating new presentation
  const handleCreateNewPresentation = () => {
    if (!newPresentationName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your new presentation.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    handleCreateMutate({
      name: newPresentationName.trim(),
      presentationDate: newPresentationDate || now.toISOString().split("T")[0],
      description: `New presentation created on ${now.toLocaleDateString()}`,
    });
  };

  // Handle opening existing presentation
  const handleOpenPresentation = (presentation: Presentation) => {
    console.log("🔄 OPENING PROJECT FROM SELECTION PAGE:", presentation.name);
    handleLoadMutate(presentation.id);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calendar helper functions
  const formatCalendarDate = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSunday = (date: Date) => {
    return date.getDay() === 0;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    setSelectedDate(newDate);
    setNewPresentationDate(newDate.toISOString().split("T")[0]);
    setIsCalendarOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Create array of days
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const isSelected = isSameDay(date, selectedDate);
      const isSundayDate = isSunday(date);

      days.push(
        <button
          key={day}
          onClick={() => selectDate(day)}
          className={`w-8 h-8 text-sm rounded-full flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-[#8356F3] text-white font-semibold"
              : isSundayDate
                ? "text-[#8356F3] font-semibold hover:bg-[#8356F3]/20"
                : "text-gray-300 hover:bg-white/10"
          }`}>
          {day}
        </button>,
      );
    }

    return (
      <div className="absolute top-full left-0 mt-2 z-50 p-4 bg-gradient-to-b from-[#2a1f3d] to-[#1a0f2e] border border-[#8356F3]/30 rounded-xl shadow-2xl min-w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-1 text-gray-300 hover:text-white transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-white font-semibold">{monthName}</h3>
          <button
            onClick={() => navigateMonth("next")}
            className="p-1 text-gray-300 hover:text-white transition-colors">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day, index) => (
              <div
                key={`${day}-${index}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-400">
                {day[0]}
              </div>
            ),
          )}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Selected date display */}
        <div className="mt-4 pt-3 border-t border-gray-600">
          <div className="text-center text-sm text-gray-300">
            Selected:{" "}
            <span className="text-white font-medium">
              {formatCalendarDate(selectedDate)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (authLoading || presentationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0920] via-[#1a0f2e] to-[#2d1b4e] flex items-center justify-center">
        <div className="text-white text-xl">Loading your workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0920] via-[#1a0f2e] to-[#2d1b4e] relative">
      {/* Glassmorphic background overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-3xl"></div>

      {/* Header */}
      <div className="border-b border-gray-700/50 backdrop-blur-xl bg-white/5 relative z-10">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center space-x-4">
            <img src={qworshipLogo} alt="Q-worship" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                {presentations.length === 0 
                  ? `Welcome, ${user?.firstName || "User"}!` 
                  : `Welcome back, ${user?.firstName || "User"}`}
              </h1>
              <p className="text-gray-400">
                {presentations.length === 0
                  ? "Create your first project to get started"
                  : "Choose a project to continue or create a new one"}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-8 mt-[91px] mb-[91px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Section */}
          <div className="bg-[#1a0f2e]/80 backdrop-blur-xl border border-gray-600/50 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[#8356F3] rounded-lg">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Create New Project
                </h2>
                <p className="text-gray-400 text-sm">
                  Start a fresh presentation for your service
                </p>
              </div>
            </div>

            {!isCreatingNew ? (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="w-full py-4 bg-[#8356F3] hover:bg-[#7045d3] text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                <PlusIcon className="w-5 h-5" />
                <span>Create New Presentation</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Presentation Name
                  </label>
                  <input
                    type="text"
                    value={newPresentationName}
                    onChange={(e) => setNewPresentationName(e.target.value)}
                    placeholder="e.g., Sunday Morning Service"
                    className="w-full px-4 py-3 bg-[#0f0920]/80 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-[#8356F3] focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service Date
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="w-full px-4 py-3 bg-[#0f0920]/80 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-[#8356F3] focus:border-[#8356F3] transition-all duration-200 flex items-center justify-between">
                      <span className="text-white">
                        {formatCalendarDate(selectedDate)}
                      </span>
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    {isCalendarOpen && renderCalendar()}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateNewPresentation}
                    disabled={createPresentationMutation.isPending}
                    className="flex-1 py-3 bg-[#8356F3] hover:bg-[#7045d3] disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                    {createPresentationMutation.isPending
                      ? "Creating..."
                      : "Create Project"}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPresentationName("");
                    }}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Open Existing Section */}
          <div className="bg-[#1a0f2e]/80 backdrop-blur-xl border border-gray-600/50 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-cyan-500 rounded-lg">
                <FolderIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Open Existing Project
                </h2>
                <p className="text-gray-400 text-sm">
                  Continue working on a previous presentation
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your presentations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#0f0920]/80 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Projects List */}
            <div className="space-y-3 max-h-96 overflow-y-auto project-list-scroll">
              {filteredPresentations.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No presentations match your search"
                      : "No presentations yet"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {!searchQuery &&
                      "Create your first presentation to get started"}
                  </p>
                </div>
              ) : (
                filteredPresentations.map((presentation) => (
                  <button
                    key={presentation.id}
                    onClick={() => handleOpenPresentation(presentation)}
                    className="w-full p-4 bg-[#0f0920]/80 backdrop-blur-sm hover:bg-[#1a1a2e]/80 border border-gray-600/50 rounded-lg text-left transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {presentation.name}
                        </h3>
                        {presentation.description && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {presentation.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>
                              {formatDate(presentation.presentationDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>
                              Modified {formatDate(presentation.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{presentation.slideCount || 0} slides</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
