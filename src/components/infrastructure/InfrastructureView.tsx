import React from 'react';
import {
  DoorClosed,
  DoorOpen,
  Building2,
  ArrowUpDown,
  Lock,
  Layers,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useFms } from '../../context/FmsContext';

export const InfrastructureView: React.FC = () => {
  const {
    buildingMap,
    doorStates,
    liftStates,
    workcells,
    mutexGroups,
    toggleDoor,
    callLift,
    settings,
  } = useFms();

  const mapDoors = buildingMap.levels.flatMap((lvl) => lvl.doors);
  const allDoors = Array.from(new Set([...mapDoors.map((door) => door.name), ...Object.keys(doorStates)]))
    .map((name) => mapDoors.find((door) => door.name === name) || {
      name,
      door_type: 1,
      motion_range: 0,
      motion_direction: 1,
      level_name: 'L1',
    });
  const lifts = Array.from(new Set([...buildingMap.lifts.map((lift) => lift.name), ...Object.keys(liftStates)]))
    .map((name) => buildingMap.lifts.find((lift) => lift.name === name) || {
      name,
      levels: liftStates[name]?.available_floors || [],
      doors: [],
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
          Smart Infrastructure & Facility IoT
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Automated Fire/Airlock Doors, Multi-Level Elevators & Workcell Dispensers
        </span>
      </div>

      {/* Grid: Doors Panel & Elevators Panel */}
      <div className="infra-grid">
        {/* Automated Doors Section */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DoorClosed size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Automated Doors & AirLocks
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {allDoors.length} Connected Units
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allDoors.map((door) => {
              const state = doorStates[door.name];
              const isOpen = state?.mode_string === 'open';
              return (
                <div
                  key={door.name}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isOpen ? '#10B981' : '#EF4444',
                      }}
                    >
                      {isOpen ? <DoorOpen size={20} /> : <DoorClosed size={20} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
                        {door.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Level: {door.level_name} • Type:{' '}
                        {door.door_type === 1
                          ? 'Single Sliding'
                          : door.door_type === 2
                          ? 'Double Sliding'
                          : 'Swing AirLock'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: isOpen
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                        color: isOpen ? '#10B981' : '#F87171',
                        border: `1px solid ${
                          isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                        }`,
                      }}
                    >
                      {isOpen ? 'OPEN' : 'CLOSED'}
                    </span>

                    <button
                      onClick={() => toggleDoor(door.name)}
                      className={`btn btn-sm ${isOpen ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {isOpen ? 'Close Door' : 'Open Door'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Elevators & Lifts Section */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowUpDown size={20} color="var(--accent-violet)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Multi-Level Elevators
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {lifts.length} Connected Lifts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lifts.map((lift) => {
              const state = liftStates[lift.name];
              const currentFloor = state?.current_floor || 'L1';
              const motion = state?.motion_state || 'stopped';
              return (
                <div
                  key={lift.name}
                  style={{
                    padding: '18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                        {lift.name}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Status: {motion.toUpperCase()} • Doors: {state?.door_state?.toUpperCase() || 'CLOSED'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#A78BFA',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        fontSize: '16px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {currentFloor}
                    </div>
                  </div>

                  {/* Lift control is only simulated until the backend exposes a command endpoint. */}
                  {settings.simulationMode ? <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Dispatch / Call Lift to Floor
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {lift.levels.map((lvl) => {
                        const isCurrent = currentFloor === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => callLift(lift.name, lvl)}
                            disabled={isCurrent}
                            className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, padding: '8px' }}
                          >
                            Floor {lvl} {isCurrent && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div> : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Live status from RMF · Lift command API is not available
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workcells & Mutex Arbitrators Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Dispensers & Ingestors */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sparkles size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Workcell Dispensers & Ingestors
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {workcells.map((wc) => (
              <div
                key={wc.guid}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                    {wc.guid}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Type: {wc.category.toUpperCase()} • Level: {wc.location_level}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent-emerald)',
                      fontWeight: 600,
                    }}
                  >
                    READY (IDLE)
                  </span>
                  {wc.current_payload && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Payload: {wc.current_payload}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spatial Mutex Arbitration */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Lock size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Corridor Mutex Locking Groups
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mutexGroups.map((mg) => {
              const isLocked = mg.locked_by !== null;
              return (
                <div
                  key={mg.name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: isLocked ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${
                      isLocked ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-subtle)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                      {mg.name}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Exclusive Passageway
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: isLocked ? '#F59E0B' : 'var(--accent-emerald)',
                      }}
                    >
                      {isLocked ? `Locked by [${mg.locked_by}]` : 'Free / Available'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
