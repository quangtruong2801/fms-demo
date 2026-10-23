import React from 'react';
import {
  X,
  Battery,
  BatteryCharging,
  Zap,
  Navigation,
  Activity,
  Layers,
  Lock,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { RobotState } from '../../types/rmf';
import { useFms } from '../../context/FmsContext';

interface RobotDetailDrawerProps {
  robot: RobotState;
  onClose: () => void;
  onFollowRobot: (robotName: string) => void;
  isFollowing: boolean;
}

export const RobotDetailDrawer: React.FC<RobotDetailDrawerProps> = ({
  robot,
  onClose,
  onFollowRobot,
  isFollowing,
}) => {
  const { fleets, setRobotCommission, cancelTask, setSelectedTaskId, setActiveTab } = useFms();

  const fleet = fleets.find((f) => f.robots.some((r) => r.name === robot.name));
  const fleetName = fleet?.name || 'UnknownFleet';

  const batteryPercent = Math.round(robot.battery * 100);
  const isBatteryLow = batteryPercent < 20;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        bottom: '16px',
        right: '16px',
        width: '360px',
        maxWidth: 'calc(100% - 32px)',
        background: 'rgba(19, 26, 41, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>{robot.name}</h3>
            <span className={`status-badge status-${robot.mode}`}>{robot.mode}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Fleet: {fleetName} • Model: {robot.model || 'Standard AGV'}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Battery Telemetry Card */}
        <div
          className="glass-panel"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isBatteryLow
                  ? 'rgba(239, 68, 68, 0.15)'
                  : robot.mode === 'charging'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isBatteryLow
                  ? '#EF4444'
                  : robot.mode === 'charging'
                  ? '#F59E0B'
                  : '#10B981',
              }}
            >
              {robot.mode === 'charging' ? (
                <BatteryCharging size={24} />
              ) : (
                <Battery size={24} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Battery Status</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {batteryPercent}%
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: robot.mode === 'charging' ? '#F59E0B' : '#94A3B8',
              fontWeight: 600,
            }}
          >
            {robot.mode === 'charging' ? 'CHARGING DOCKED' : 'DISCHARGING'}
          </div>
        </div>

        {/* Spatial Coordinates & Telemetry */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            Spatial Telemetry (2D Pose)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Position (X, Y)</span>
              <div className="mono-telemetry" style={{ marginTop: '2px', fontSize: '13px' }}>
                X: {robot.location.x.toFixed(1)}m, Y: {robot.location.y.toFixed(1)}m
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Heading (Yaw)</span>
              <div className="mono-telemetry" style={{ marginTop: '2px', fontSize: '13px' }}>
                {(robot.location.yaw * (180 / Math.PI)).toFixed(1)}°
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Speed</span>
              <div className="mono-telemetry" style={{ marginTop: '2px', fontSize: '13px' }}>
                {robot.location.speed ? `${robot.location.speed.toFixed(2)} m/s` : '0.00 m/s'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Floor Level</span>
              <div className="mono-telemetry" style={{ marginTop: '2px', fontSize: '13px' }}>
                {robot.location.level_name}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Task Info */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            Current Assignment
          </div>

          {robot.task_id ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono-telemetry" style={{ fontWeight: 600 }}>
                  {robot.task_id}
                </span>
                <button
                  onClick={() => {
                    setSelectedTaskId(robot.task_id);
                    setActiveTab('tasks');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Inspect Task
                </button>
              </div>

              {robot.path && robot.path.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Waypoints queued: <strong>{robot.path.length}</strong>
                </div>
              )}

              <button
                onClick={() => cancelTask(robot.task_id!)}
                className="btn btn-danger btn-sm"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Abort & Cancel Task
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No active task assigned. Robot is available in pool.
            </div>
          )}
        </div>

        {/* Mutex Groups */}
        {robot.mutex_groups && robot.mutex_groups.length > 0 && (
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Lock size={13} color="var(--accent-amber)" />
              <span>Acquired Mutex Zones</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {robot.mutex_groups.map((mg) => (
                <span
                  key={mg}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#F59E0B',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {mg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reported Issues */}
        {robot.issues && robot.issues.length > 0 && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#EF4444',
                marginBottom: '4px',
              }}
            >
              <AlertTriangle size={14} />
              <span>Active Diagnostics</span>
            </div>
            {robot.issues.map((issue, idx) => (
              <div key={idx} style={{ fontSize: '11px', color: '#FECACA' }}>
                • {issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={() => onFollowRobot(robot.name)}
          className={`btn ${isFollowing ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          <Navigation size={14} />
          <span>{isFollowing ? 'Tracking' : 'Follow Cam'}</span>
        </button>

        <button
          onClick={() => setRobotCommission(fleetName, robot.name, !robot.commissioned)}
          className={`btn ${robot.commissioned ? 'btn-danger' : 'btn-primary'}`}
          style={{ flex: 1 }}
        >
          {robot.commissioned ? <Pause size={14} /> : <Play size={14} />}
          <span>{robot.commissioned ? 'Decommission' : 'Commission'}</span>
        </button>
      </div>
    </div>
  );
};
