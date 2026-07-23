import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectionContextType {
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  return (
    <SelectionContext.Provider value={{ selectedIds, toggleSelection, clearSelection, selectAll, isSelected }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
