import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';

const appWindow = getCurrentWindow();

export default function Titlebar() {
  return (
    <div data-tauri-drag-region className="titlebar">
      <div className="titlebar-title" data-tauri-drag-region>
        Memories
      </div>
      <div className="titlebar-controls">
        <div 
          className="titlebar-button" 
          onClick={() => appWindow.minimize()}
          title="Minimize"
        >
          <Minus size={16} />
        </div>
        <div 
          className="titlebar-button" 
          onClick={() => appWindow.toggleMaximize()}
          title="Maximize"
        >
          <Square size={14} />
        </div>
        <div 
          className="titlebar-button close" 
          onClick={() => appWindow.close()}
          title="Close"
        >
          <X size={16} />
        </div>
      </div>
    </div>
  );
}
