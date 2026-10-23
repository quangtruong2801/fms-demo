import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  Trash2,
  Volume2,
  ShieldCheck,
} from 'lucide-react';
import { useFms } from '../../context/FmsContext';

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert, dismissAlert } = useFms();
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(
    (a) => severityFilter === 'all' || a.severity === severityFilter,
  );

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported yet');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
            Alerts, Incidents & Safety Center
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time Delivery Alerts, Obstacle Flags & Robot Safety Exceptions
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={playChime} className="btn btn-secondary btn-sm">
            <Volume2 size={14} />
            <span>Test Audio Chime</span>
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: `All Alerts (${alerts.length})` },
            {
              id: 'critical',
              label: `Critical (${alerts.filter((a) => a.severity === 'critical').length})`,
            },
            {
              id: 'warning',
              label: `Warnings (${alerts.filter((a) => a.severity === 'warning').length})`,
            },
            {
              id: 'info',
              label: `Advisory (${alerts.filter((a) => a.severity === 'info').length})`,
            },
          ].map((tab) => {
            const isSelected = severityFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-cyan)' : 'transparent',
                  color: isSelected ? '#07090E' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <ShieldCheck size={48} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '16px', color: '#FFFFFF' }}>All Systems Nominal</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No unresolved safety incidents or notifications recorded.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            return (
              <div
                key={alert.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${
                    isCritical ? '#EF4444' : isWarning ? '#F59E0B' : 'var(--accent-cyan)'
                  }`,
                  background: isCritical
                    ? 'rgba(239, 68, 68, 0.05)'
                    : isWarning
                    ? 'rgba(245, 158, 11, 0.04)'
                    : 'var(--bg-glass)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: isCritical
                        ? 'rgba(239, 68, 68, 0.15)'
                        : isWarning
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(0, 240, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCritical
                        ? '#EF4444'
                        : isWarning
                        ? '#F59E0B'
                        : 'var(--accent-cyan)',
                      flexShrink: 0,
                    }}
                  >
                    {isCritical ? (
                      <AlertOctagon size={20} />
                    ) : isWarning ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Info size={20} />
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                        {alert.title}
                      </h4>
                      {alert.acknowledged && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10B981',
                            fontWeight: 600,
                          }}
                        >
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {alert.message}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Logged: {new Date(alert.timestamp).toLocaleTimeString()}</span>
                      {alert.entity_type && (
                        <span>
                          Target: {alert.entity_type.toUpperCase()} ({alert.entity_id || 'System'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Check size={14} />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="btn btn-secondary btn-sm"
                    title="Dismiss alert"
                  >
                    <Trash2 size={14} color="#94A3B8" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
