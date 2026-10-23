import React, { useState } from 'react';
import { Sliders, Server, Wifi, Volume2, Shield, RefreshCw, CheckCircle2, Save } from 'lucide-react';
import { useFms } from '../../context/FmsContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, isBackendConnected } = useFms();

  const [apiUrl, setApiUrl] = useState(settings.apiServerUrl);
  const [trajectoryUrl, setTrajectoryUrl] = useState(settings.trajectoryServerUrl);
  const [simulationMode, setSimulationMode] = useState(settings.simulationMode);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      apiServerUrl: apiUrl,
      trajectoryServerUrl: trajectoryUrl,
      simulationMode,
      soundEnabled,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
          System Configuration & RMF Endpoints
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Manage backend server connections, simulation runtime, and sensory preferences
        </span>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Backend Connectivity */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Server size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              RMF Backend & Trajectory Endpoints
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                RMF API SERVER URL (REST + SOCKET.IO)
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Default Open-RMF API server endpoint configured at port 8000.
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                RMF TRAJECTORY SERVER WEBSOCKET
              </label>
              <input
                type="text"
                value={trajectoryUrl}
                onChange={(e) => setTrajectoryUrl(e.target.value)}
                placeholder="ws://localhost:8006"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                WebSocket stream providing time-indexed conflict-free robot trajectories.
              </span>
            </div>

            {/* Connection Status indicator */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: isBackendConnected
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${
                  isBackendConnected
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wifi
                  size={18}
                  color={isBackendConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
                />
                <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 500 }}>
                  Connection Status:{' '}
                  <strong>
                    {isBackendConnected
                      ? 'CONNECTED TO BACKEND'
                      : simulationMode
                      ? 'RUNNING LOCAL SIMULATION ENGINE'
                      : 'OFFLINE / WAITING FOR RMF SERVER'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Runtime & Simulation Preferences */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} color="var(--accent-violet)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Runtime & Sensory Engine
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                  Enable Realistic Simulation Engine
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Simulates robot movements, battery dynamics, and task execution when ROS2 / RMF
                  server is offline.
                </span>
              </div>
              <input
                type="checkbox"
                checked={simulationMode}
                onChange={(e) => setSimulationMode(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                  Auditory Alert Chimes
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Play audio tones on critical events and E-stop triggers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          {savedMessage && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--accent-emerald)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              Configuration saved successfully!
            </span>
          )}

          <button type="submit" className="btn btn-primary">
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
