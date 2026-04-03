import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface UseCalendarHelpersProps {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  setIsCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalCurrentMonth: Date;
  setModalCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  modalSelectedDate: Date;
  setModalSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  setIsModalCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCalendarHelpers({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  setIsCalendarOpen,
  modalCurrentMonth,
  setModalCurrentMonth,
  modalSelectedDate,
  setModalSelectedDate,
  setIsModalCalendarOpen,
}: UseCalendarHelpersProps) {
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const MONTHS = [
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

  const formatDate = (date: Date) => {
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
    setIsCalendarOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

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
                ? "bg-cyan-400 text-cyan-900 font-medium hover:bg-cyan-300"
                : "text-white hover:bg-gray-700"
          }`}>
          {day}
        </button>,
      );
    }

    return (
      <div className="p-4 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth("prev")}
            className="text-gray-400 hover:text-white p-1">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-white font-medium">{monthName}</h3>
          <button
            onClick={() => navigateMonth("next")}
            className="text-gray-400 hover:text-white p-1">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={day + index}
              className={`text-center text-xs font-medium p-1 ${
                index === 0 ? "text-cyan-400" : "text-gray-400"
              }`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-cyan-400 rounded-full" />
              <span className="text-gray-300">Sundays</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#8356F3] rounded-full" />
              <span className="text-gray-300">Selected</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal calendar helpers
  const formatModalDate = (date: Date) => {
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const navigateModalMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(modalCurrentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setModalCurrentMonth(newMonth);
  };

  const selectModalDate = (day: number) => {
    const newDate = new Date(
      modalCurrentMonth.getFullYear(),
      modalCurrentMonth.getMonth(),
      day,
    );
    setModalSelectedDate(newDate);
    setSelectedDate(newDate);
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    setIsModalCalendarOpen(false);
  };

  const renderModalCalendar = () => {
    const daysInMonth = getDaysInMonth(modalCurrentMonth);
    const firstDay = getFirstDayOfMonth(modalCurrentMonth);
    const monthName = modalCurrentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        modalCurrentMonth.getFullYear(),
        modalCurrentMonth.getMonth(),
        day,
      );
      const isSelected = isSameDay(date, modalSelectedDate);
      const isSundayDate = isSunday(date);

      days.push(
        <button
          key={day}
          onClick={() => selectModalDate(day)}
          className={`w-8 h-8 text-sm rounded-full flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-[#8356F3] text-white font-semibold"
              : isSundayDate
                ? "bg-cyan-400 text-cyan-900 font-medium hover:bg-cyan-300"
                : "text-white hover:bg-gray-700"
          }`}>
          {day}
        </button>,
      );
    }

    return (
      <div className="modal-calendar-dropdown absolute bottom-full left-0 mb-2 p-4 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg z-50">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateModalMonth("prev")}
            className="text-gray-400 hover:text-white p-1">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-white font-medium">{monthName}</h3>
          <button
            onClick={() => navigateModalMonth("next")}
            className="text-gray-400 hover:text-white p-1">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={day + index}
              className={`text-center text-xs font-medium p-1 ${
                index === 0 ? "text-cyan-400" : "text-gray-400"
              }`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-cyan-400 rounded-full" />
              <span className="text-gray-300">Sundays</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#8356F3] rounded-full" />
              <span className="text-gray-300">Selected</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    formatDate,
    formatModalDate,
    getDaysInMonth,
    getFirstDayOfMonth,
    isSunday,
    isSameDay,
    navigateMonth,
    selectDate,
    renderCalendar,
    navigateModalMonth,
    selectModalDate,
    renderModalCalendar,
  };
}
