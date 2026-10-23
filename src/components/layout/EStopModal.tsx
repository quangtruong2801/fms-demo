import React from 'react';
import { AlertOctagon, X, ShieldAlert } from 'lucide-react';
import { useFms } from '../../context/FmsContext';

interface EStopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EStopModal: React.FC<EStopModalProps> = ({ isOpen, onClose }) => {
  const { triggerEStop } = useFms();

  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerEStop();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{
          border: '1px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={24} color="#EF4444" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444' }}>
              CONFIRM EMERGENCY STOP
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '13px',
              color: '#FECACA',
              lineHeight: 1.6,
            }}
          >
            <strong>Warning:</strong> Initiating a Master Emergency Stop will broadcast an immediate
            halt command to all robots across all fleet adapters. Active tasks will be suspended, and
            automated doors/locks may engage lockdown state.
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Are you sure you want to proceed with triggering the site-wide Emergency Stop?
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '12px',
            }}
          >
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn btn-danger"
              style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
              }}
            >
              <ShieldAlert size={16} />
              CONFIRM E-STOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
