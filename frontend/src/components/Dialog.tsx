import React, { useRef, useEffect } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, actions }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    if (isOpen) {
      if (!dialogNode.open) {
        dialogNode.showModal();
      }
    } else {
      if (dialogNode.open) {
        dialogNode.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    const handleClose = () => {
      onClose();
    };

    dialogNode.addEventListener('close', handleClose);
    return () => {
      dialogNode.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // Click outside to close helper
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;
    
    const rect = dialogNode.getBoundingClientRect();
    const isClickOutside = (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
    if (isClickOutside) {
      dialogNode.close();
    }
  };

  return (
    <dialog ref={dialogRef} onClick={handleBackdropClick} aria-labelledby="dialog-title">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <h2 id="dialog-title" style={{ fontSize: '1.25rem' }}>{title}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '6px 10px', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          {children}
        </div>
        
        {actions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            {actions}
          </div>
        )}
      </div>
    </dialog>
  );
};
