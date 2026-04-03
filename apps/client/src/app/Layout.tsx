import React from "react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-muted/20">
        <div className="flex-1 relative">{children}</div>
      </main>
    </div>
  );
};
