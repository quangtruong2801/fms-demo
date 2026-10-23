import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Clock,
  Bell,
  Cpu,
  Layers,
  Activity,
  RotateCcw,
  Menu,
} from 'lucide-react';
import { useFms } from '../../context/FmsContext';

interface HeaderProps {
  onOpenEStopModal: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenEStopModal, onToggleSidebar }) => {
  const {
    fleets,
    tasks,
    alerts,
    settings,
    updateSettings,
    isBackendConnected,
    isEStopActive,
    resetEStop,
    setActiveTab,
  } = useFms();

  const [timeStr, setTimeStr] = useState<string>('');
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalRobots = fleets.reduce((acc, f) => acc + f.robots.length, 0);
  const activeRobots = fleets.reduce(
    (acc, f) => acc + f.robots.filter((r) => r.commissioned && r.mode !== 'emergency').length,
    0,
  );
  const underwayTasks = tasks.filter((t) => t.status === 'underway').length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const isCompact = windowWidth <= 1180;
  const isMobile = windowWidth <= 768;

  return (
    <header
      style={{
        height: '60px',
        background: 'rgba(13, 18, 29, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        zIndex: 50,
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Brand & System Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {onToggleSidebar && isMobile && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px' }}
          >
            <Menu size={18} />
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)',
            flexShrink: 0,
          }}
        >
          <Cpu size={20} color="var(--accent-cyan)" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}
            >
              VNTT <span style={{ color: 'var(--accent-cyan)' }}>FMS</span>
            </span>
            {!isMobile && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                }}
              >
                OPEN-RMF v2.0
              </span>
            )}
          </div>
          {!isCompact && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Autonomous Fleet & Traffic Orchestration
            </span>
          )}
        </div>
      </div>

      {/* Real-time System Telemetry Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCompact ? '8px' : '14px',
          flexShrink: 1,
          justifyContent: 'flex-end',
        }}
      >
        {/* Mode / Server status */}
        <div
          onClick={() => updateSettings({ simulationMode: !settings.simulationMode })}
          title="Click to toggle Simulation Mode / Real RMF Backend connection"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: settings.simulationMode
              ? 'rgba(245, 158, 11, 0.12)'
              : isBackendConnected
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              settings.simulationMode
                ? 'rgba(245, 158, 11, 0.3)'
                : isBackendConnected
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Radio
            size={12}
            color={
              settings.simulationMode
                ? 'var(--accent-amber)'
                : isBackendConnected
                ? 'var(--accent-emerald)'
                : 'var(--accent-crimson)'
            }
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              color: settings.simulationMode
                ? 'var(--accent-amber)'
                : isBackendConnected
                ? 'var(--accent-emerald)'
                : 'var(--accent-crimson)',
            }}
          >
            {isCompact
              ? settings.simulationMode
                ? 'SIM'
                : isBackendConnected
                ? 'RMF LIVE'
                : 'OFFLINE'
              : settings.simulationMode
              ? 'SIMULATION'
              : isBackendConnected
              ? 'RMF BACKEND ONLINE'
              : 'OFFLINE'}
          </span>
        </div>

        {/* Robot Health Pill */}
        <div
          title={`${activeRobots} active out of ${totalRobots} total robots`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Activity size={14} color="var(--accent-cyan)" />
          <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            {activeRobots}/{totalRobots}
          </strong>
        </div>

        {/* Tasks Pill */}
        {!isMobile && (
          <div
            title={`${underwayTasks} active missions underway`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Layers size={14} color="var(--accent-emerald)" />
            <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {underwayTasks}
            </strong>
          </div>
        )}

        {/* Master E-Stop Button */}
        {isEStopActive ? (
          <button
            onClick={resetEStop}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>
        ) : (
          <button
            onClick={onOpenEStopModal}
            className="btn btn-danger btn-sm"
            style={{
              fontWeight: 700,
              letterSpacing: '0.5px',
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={14} />
            <span>{isCompact ? 'E-STOP' : 'EMERGENCY STOP'}</span>
          </button>
        )}

        {/* Notifications */}
        <div
          onClick={() => setActiveTab('alerts')}
          title="View Alerts & Incident Center"
          style={{
            position: 'relative',
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell size={16} color="var(--text-secondary)" />
          {unacknowledgedAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--accent-crimson)',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-primary)',
              }}
            >
              {unacknowledgedAlerts}
            </span>
          )}
        </div>

        {/* Time sync (hidden on small screens) */}
        {!isCompact && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              paddingLeft: '6px',
              borderLeft: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Clock size={13} />
            <span>{timeStr}</span>
          </div>
        )}
      </div>
    </header>
  );
};
