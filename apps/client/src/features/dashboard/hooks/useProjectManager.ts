import { Presentation } from "@/shared/types";
import { useState, useRef } from "react";

export interface UseProjectManagerProps {
  currentPresentationId: string | number | null;
  currentPresentationName: string;
  savedProjects: Presentation[];
  updatePresentationName: (presentationId: string | number, name: string) => void;
}

export const useProjectManager = ({
  currentPresentationId,
  currentPresentationName,
  savedProjects,
  updatePresentationName,
}: UseProjectManagerProps) => {
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState("");
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  const [editingModalProjectId, setEditingModalProjectId] = useState<
    number | null
  >(null);
  const [editingModalProjectName, setEditingModalProjectName] = useState("");
  const modalProjectNameInputRef = useRef<HTMLInputElement>(null);

  const startEditingProjectName = () => {
    setEditingProjectName(currentPresentationName);
    setIsEditingProjectName(true);
    setTimeout(() => {
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    }, 0);
  };

  const saveProjectName = () => {
    if (!currentPresentationId || !editingProjectName.trim()) {
      setIsEditingProjectName(false);
      return;
    }

    const trimmedName = editingProjectName.trim();
    if (trimmedName === currentPresentationName) {
      setIsEditingProjectName(false);
      return;
    }

    updatePresentationName(currentPresentationId, trimmedName);
    setIsEditingProjectName(false);
  };

  const cancelEditingProjectName = () => {
    setEditingProjectName(currentPresentationName);
    setIsEditingProjectName(false);
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveProjectName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditingProjectName();
    }
  };

  const startEditingModalProjectName = (project: Presentation) => {
    setEditingModalProjectId(project.id);
    setEditingModalProjectName(project.name);
    setTimeout(() => {
      modalProjectNameInputRef.current?.focus();
      modalProjectNameInputRef.current?.select();
    }, 0);
  };

  const saveModalProjectName = () => {
    if (!editingModalProjectId || !editingModalProjectName.trim()) {
      setEditingModalProjectId(null);
      return;
    }

    const trimmedName = editingModalProjectName.trim();
    const currentProject = savedProjects.find(
      (p) => p.id === editingModalProjectId,
    );
    if (!currentProject || trimmedName === currentProject.name) {
      setEditingModalProjectId(null);
      return;
    }

    updatePresentationName(editingModalProjectId, trimmedName);
    setEditingModalProjectId(null);
  };

  const cancelEditingModalProjectName = () => {
    setEditingModalProjectId(null);
    setEditingModalProjectName("");
  };

  const handleModalProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveModalProjectName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditingModalProjectName();
    }
  };

  return {
    isEditingProjectName,
    setIsEditingProjectName,
    editingProjectName,
    setEditingProjectName,
    projectNameInputRef,
    editingModalProjectId,
    setEditingModalProjectId,
    editingModalProjectName,
    setEditingModalProjectName,
    modalProjectNameInputRef,
    startEditingProjectName,
    saveProjectName,
    cancelEditingProjectName,
    handleProjectNameKeyDown,
    startEditingModalProjectName,
    saveModalProjectName,
    cancelEditingModalProjectName,
    handleModalProjectNameKeyDown,
  };
};
