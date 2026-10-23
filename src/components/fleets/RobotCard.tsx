import React from 'react';
import {
  Bot,
  Battery,
  BatteryCharging,
  Navigation,
  Lock,
  Pause,
  Play,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { RobotState } from '../../types/rmf';
import { useFms } from '../../context/FmsContext';

interface RobotCardProps {
  robot: RobotState;
  fleetName: string;
}

export const RobotCard: React.FC<RobotCardProps> = ({ robot, fleetName }) => {
  const { setRobotCommission, setSelectedRobot, setActiveTab } = useFms();

  const batteryPercent = Math.round(robot.battery * 100);
  const isLowBattery = batteryPercent < 20;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:
                  robot.mode === 'emergency'
                    ? '#EF4444'
                    : robot.mode === 'charging'
                    ? '#F59E0B'
                    : 'var(--accent-cyan)',
              }}
            >
              <Bot size={22} />
            </div>

            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{robot.name}</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {fleetName} • {robot.model || 'Autonomous Mobile Unit'}
              </span>
            </div>
          </div>

          <span className={`status-badge status-${robot.mode}`}>{robot.mode}</span>
        </div>

        {/* Battery & Health Row */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              {robot.mode === 'charging' ? (
                <BatteryCharging size={16} color="var(--accent-amber)" />
              ) : (
                <Battery
                  size={16}
                  color={
                    isLowBattery
                      ? '#EF4444'
                      : batteryPercent < 50
                      ? '#F59E0B'
                      : '#10B981'
                  }
                />
              )}
              <span style={{ color: 'var(--text-secondary)' }}>
                {robot.mode === 'charging' ? 'Docked Charging' : 'Battery Level'}
              </span>
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: '#FFFFFF',
              }}
            >
              {batteryPercent}%
            </span>
          </div>

          <div
            style={{
              height: '5px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${batteryPercent}%`,
                background:
                  isLowBattery
                    ? '#EF4444'
                    : batteryPercent < 50
                    ? '#F59E0B'
                    : '#10B981',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Spatial Pose Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            fontSize: '11px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Location (Floor {robot.location.level_name})</span>
            <div className="mono-telemetry" style={{ marginTop: '2px' }}>
              X: {robot.location.x.toFixed(0)}, Y: {robot.location.y.toFixed(0)}
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Heading & Velocity</span>
            <div className="mono-telemetry" style={{ marginTop: '2px' }}>
              {(robot.location.yaw * (180 / Math.PI)).toFixed(0)}° • {robot.location.speed || 0} m/s
            </div>
          </div>
        </div>

        {/* Task Assignment */}
        {robot.task_id && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(0, 240, 255, 0.06)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              marginBottom: '16px',
              fontSize: '11px',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Assigned:</span>
            <span className="mono-telemetry" style={{ fontWeight: 700 }}>
              {robot.task_id}
            </span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => {
            setSelectedRobot(robot);
            setActiveTab('map');
          }}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          <Navigation size={13} />
          <span>Locate on Map</span>
        </button>

        <button
          onClick={() => setRobotCommission(fleetName, robot.name, !robot.commissioned)}
          className={`btn btn-sm ${robot.commissioned ? 'btn-danger' : 'btn-primary'}`}
          title={robot.commissioned ? 'Decommission Robot' : 'Commission Robot'}
        >
          {robot.commissioned ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  );
};
