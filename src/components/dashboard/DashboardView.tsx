import React from 'react';
import {
  Bot,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Lock,
  DoorClosed,
  ChevronRight,
  Battery,
} from 'lucide-react';
import { useFms } from '../../context/FmsContext';
import { MetricCard } from './MetricCard';

export const DashboardView: React.FC = () => {
  const {
    fleets,
    tasks,
    alerts,
    doorStates,
    liftStates,
    mutexGroups,
    setActiveTab,
    setSelectedRobot,
    setSelectedTaskId,
  } = useFms();

  const allRobots = fleets.flatMap((f) => f.robots);
  const totalRobots = allRobots.length;
  const movingRobots = allRobots.filter((r) => r.mode === 'moving').length;
  const chargingRobots = allRobots.filter((r) => r.mode === 'charging').length;
  const idleRobots = allRobots.filter((r) => r.mode === 'idle' || r.mode === 'waiting').length;
  const errorRobots = allRobots.filter((r) => r.mode === 'emergency' || r.mode === 'error').length;

  const underwayTasks = tasks.filter((t) => t.status === 'underway');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const queuedTasks = tasks.filter((t) => t.status === 'queued');

  const doorsList = Object.values(doorStates);
  const openDoors = doorsList.filter((d) => d.mode_string === 'open').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Top Row */}
      <div className="kpi-grid">
        <MetricCard
          title="FLEET READINESS"
          value={`${Math.round(((totalRobots - errorRobots) / (totalRobots || 1)) * 100)}%`}
          subtitle={`${movingRobots} active, ${chargingRobots} charging, ${idleRobots} standby`}
          icon={<Bot size={24} />}
          trend="NOMINAL"
          trendColor="var(--accent-emerald)"
          accentColor="var(--accent-cyan)"
        />
        <MetricCard
          title="ACTIVE MISSIONS"
          value={underwayTasks.length}
          subtitle={`${queuedTasks.length} queued in dispatcher pool`}
          icon={<Layers size={24} />}
          trend={`+${completedTasks.length} completed`}
          trendColor="var(--accent-cyan)"
          accentColor="var(--accent-violet)"
        />
        <MetricCard
          title="INFRASTRUCTURE"
          value={`${openDoors}/${doorsList.length} Doors`}
          subtitle="All Lifts Synced & Calibrated"
          icon={<DoorClosed size={24} />}
          trend="ONLINE"
          trendColor="var(--accent-emerald)"
          accentColor="var(--accent-emerald)"
        />
        <MetricCard
          title="SYSTEM INCIDENTS"
          value={alerts.filter((a) => !a.acknowledged).length}
          subtitle={`${alerts.filter((a) => a.severity === 'critical').length} critical warnings`}
          icon={<ShieldCheck size={24} />}
          trend={alerts.some((a) => a.severity === 'critical') ? 'CRITICAL' : 'STABLE'}
          trendColor={
            alerts.some((a) => a.severity === 'critical')
              ? 'var(--accent-crimson)'
              : 'var(--accent-emerald)'
          }
          accentColor="var(--accent-amber)"
        />
      </div>

      {/* Main Grid: Live Missions Stream + Robot Telemetry Stack */}
      <div className="cockpit-grid">
        {/* Active Missions Stream */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Active Task Dispatcher Stream
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <span>View All Tasks</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {underwayTasks.length === 0 ? (
              <div
                style={{
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                No active tasks underway. Dispatch a new mission from the Task Center.
              </div>
            ) : (
              underwayTasks.map((task) => (
                <div
                  key={task.booking.id}
                  onClick={() => {
                    setSelectedTaskId(task.booking.id);
                    setActiveTab('tasks');
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className="mono-telemetry"
                        style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}
                      >
                        {task.booking.id}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#A78BFA',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        {task.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Assigned:{' '}
                        <strong style={{ color: 'var(--accent-cyan)' }}>
                          {task.assigned_to?.name || 'Pending'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        marginBottom: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>
                        Phase{' '}
                        {(task.active_phase_index ?? 0) + 1} of {task.phases?.length || 1}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {task.progress || 0}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${task.progress || 0}%`,
                          background: 'linear-gradient(90deg, #00F0FF 0%, #3B82F6 100%)',
                          boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Robot Telemetry Stack */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Robotic Fleet Live Telemetry
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('fleets')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <span>Manage Fleets</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allRobots.map((robot) => {
              const batteryPercent = Math.round(robot.battery * 100);
              return (
                <div
                  key={robot.name}
                  onClick={() => {
                    setSelectedRobot(robot);
                    setActiveTab('map');
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
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
                            : '#00F0FF',
                      }}
                    >
                      <Bot size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                        }}
                      >
                        {robot.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Level: {robot.location.level_name} • ({robot.location.x.toFixed(0)},{' '}
                        {robot.location.y.toFixed(0)})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Battery */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Battery
                        size={15}
                        color={
                          batteryPercent < 20
                            ? '#EF4444'
                            : batteryPercent < 50
                            ? '#F59E0B'
                            : '#10B981'
                        }
                      />
                      <span
                        style={{
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: '#FFFFFF',
                        }}
                      >
                        {batteryPercent}%
                      </span>
                    </div>

                    <span className={`status-badge status-${robot.mode}`}>
                      {robot.mode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mutex Groups & Critical Zones Strip */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="var(--accent-amber)" />
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
              Spatial Deadlock & Mutex Exclusion Monitor
            </h4>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Real-time RMF Traffic Lock Arbitrator
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {mutexGroups.map((mg) => {
            const isLocked = mg.locked_by !== null;
            return (
              <div
                key={mg.name}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: isLocked ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    isLocked ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{mg.name}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: isLocked ? '#F59E0B' : 'var(--accent-emerald)',
                    fontWeight: 600,
                  }}
                >
                  {isLocked ? `LOCKED by [${mg.locked_by}]` : 'AVAILABLE'}
                </span>
                {mg.waiting_queue.length > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#F87171',
                    }}
                  >
                    Queue: {mg.waiting_queue.join(', ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
