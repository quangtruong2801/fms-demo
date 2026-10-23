import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Compass,
  Package,
  Sparkles,
  Navigation,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useFms } from '../../context/FmsContext';
import { DispatchTaskFormData } from '../../types/fms';

interface TaskDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_WAYPOINTS = [
  'pantry',
  'lounge',
  'patrol_D1',
  'patrol_D2',
  'patrol_A1',
  'patrol_A2',
  'patrol_B',
  'patrol_C',
  'supplies',
  'presupplies',
  'coe',
  'hardware_2',
  'tinyRobot1_charger',
  'tinyRobot2_charger',
];

export const TaskDispatcherModal: React.FC<TaskDispatcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { fleets, buildingMap, workcells, dispatchNewTask } = useFms();

  const [category, setCategory] = useState<'patrol' | 'delivery' | 'clean' | 'move'>('delivery');
  const [targetAssignment, setTargetAssignment] = useState<string>('');
  const [priority, setPriority] = useState<number>(0);

  // Extract individual robots across all fleets
  const allRobots = useMemo(() => {
    return fleets.flatMap((f) =>
      f.robots.map((r) => ({
        ...r,
        fleetName: f.name,
      }))
    );
  }, [fleets]);

  // Extract all valid waypoint names from nav graph
  const allWaypoints = useMemo(() => {
    const currentLevel = buildingMap.levels?.[0];
    const extracted =
      currentLevel?.nav_graphs?.flatMap((g) => g.vertices.map((v) => v.name).filter(Boolean)) || [];
    return extracted.length > 0 ? Array.from(new Set(extracted)) : FALLBACK_WAYPOINTS;
  }, [buildingMap]);

  // Extract dispensers and ingestors
  const availableDispensers = useMemo(() => {
    const list = workcells.filter((w) => w.category === 'dispenser').map((w) => w.guid);
    return list.length > 0 ? list : ['coke_dispenser', 'coke_dispenser_2'];
  }, [workcells]);

  const availableIngestors = useMemo(() => {
    const list = workcells.filter((w) => w.category === 'ingestor').map((w) => w.guid);
    return list.length > 0 ? list : ['coke_ingestor', 'coke_ingestor_2'];
  }, [workcells]);

  // Form states with default real Open-RMF values
  const [patrolWaypoints, setPatrolWaypoints] = useState<string[]>(['patrol_D1', 'patrol_D2']);
  const [rounds, setRounds] = useState<number>(1);

  // Delivery
  const [pickupPlace, setPickupPlace] = useState<string>('pantry');
  const [pickupDispenser, setPickupDispenser] = useState<string>('coke_dispenser');
  const [dropoffPlace, setDropoffPlace] = useState<string>('hardware_2');
  const [dropoffIngestor, setDropoffIngestor] = useState<string>('coke_ingestor');
  const [sku, setSku] = useState<string>('coke');
  const [quantity, setQuantity] = useState<number>(1);

  // Clean
  const [cleanZone, setCleanZone] = useState<string>('clean_zone');

  // Move
  const [destinationWaypoint, setDestinationWaypoint] = useState<string>('pantry');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset or initialize defaults when modal opens or waypoints change
  useEffect(() => {
    if (isOpen && allWaypoints.length > 0) {
      setErrorMessage(null);
      setSuccessMessage(null);
      const firstWp = allWaypoints[0] || 'pantry';
      const secondWp = allWaypoints[1] || firstWp;
      if (!allWaypoints.includes(pickupPlace)) {
        setPickupPlace(allWaypoints.includes('pantry') ? 'pantry' : firstWp);
      }
      if (!allWaypoints.includes(dropoffPlace)) {
        setDropoffPlace(allWaypoints.includes('hardware_2') ? 'hardware_2' : secondWp);
      }
      if (!allWaypoints.includes(destinationWaypoint)) {
        setDestinationWaypoint(allWaypoints.includes('pantry') ? 'pantry' : firstWp);
      }
    }
  }, [isOpen, allWaypoints]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let targetFleet: string | undefined = undefined;
      let targetRobot: string | undefined = undefined;

      if (targetAssignment.startsWith('robot:')) {
        const parts = targetAssignment.split(':');
        targetFleet = parts[1];
        targetRobot = parts[2];
      } else if (targetAssignment.startsWith('fleet:')) {
        targetFleet = targetAssignment.replace('fleet:', '');
      }

      const payload: DispatchTaskFormData = {
        category,
        targetFleet,
        targetRobot,
        priority,
        patrolWaypoints,
        rounds,
        pickupPlace,
        pickupDispenser,
        dropoffPlace,
        dropoffIngestor,
        sku,
        quantity,
        cleanZone,
        destinationWaypoint,
      };

      await dispatchNewTask(payload);
      setSuccessMessage('Task dispatched successfully to Open-RMF fleet!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Task dispatch failed:', err);
      const msg = err?.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
        : err?.message || 'Failed to dispatch task to server';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              DISPATCH NEW ROBOT MISSION
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

        {/* Mission Type Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            padding: '12px 24px 0',
            gap: '8px',
          }}
        >
          {[
            { id: 'delivery', label: 'Delivery', icon: <Package size={16} /> },
            { id: 'patrol', label: 'Patrol', icon: <Compass size={16} /> },
            { id: 'clean', label: 'Clean', icon: <Sparkles size={16} /> },
            { id: 'move', label: 'Go-To', icon: <Navigation size={16} /> },
          ].map((tab) => {
            const isSelected = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategory(tab.id as any);
                  setErrorMessage(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected
                    ? '1px solid var(--accent-cyan)'
                    : '1px solid var(--border-subtle)',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback message banners */}
        {errorMessage && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Dispatch Failed: </strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
          }}
        >
          {/* Target Fleet Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Target Robot / Fleet Pool
              </label>
              <select
                value={targetAssignment}
                onChange={(e) => setTargetAssignment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">⚡ Auto-Assign (Open Bidding - Any Available)</option>

                {allRobots.length > 0 && (
                  <optgroup label="🤖 Specific Robots (Direct Assignment)" style={{ background: '#10141E', color: '#00F0FF' }}>
                    {allRobots.map((r) => {
                      const modeLabel = r.mode ? r.mode.toUpperCase() : 'IDLE';
                      const batteryLabel =
                        r.battery !== undefined
                          ? `${Math.round(r.battery * (r.battery <= 1 ? 100 : 1))}%`
                          : '';
                      return (
                        <option
                          key={`${r.fleetName}:${r.name}`}
                          value={`robot:${r.fleetName}:${r.name}`}
                          style={{ color: '#FFFFFF', background: '#0D111A' }}
                        >
                          {r.name} ({r.fleetName} • {modeLabel} {batteryLabel ? `• ${batteryLabel}` : ''})
                        </option>
                      );
                    })}
                  </optgroup>
                )}

                {fleets.length > 0 && (
                  <optgroup label="🏭 Fleet Pools (Fleet-Wide Bidding)" style={{ background: '#10141E', color: '#A78BFA' }}>
                    {fleets.map((f) => (
                      <option
                        key={f.name}
                        value={`fleet:${f.name}`}
                        style={{ color: '#FFFFFF', background: '#0D111A' }}
                      >
                        Fleet Pool: {f.name} ({f.robots.length} robots)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Priority Rank
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value={0}>Standard Priority (Queue 0)</option>
                <option value={1}>High Priority (Preempt Idle)</option>
                <option value={2}>Emergency Priority (Preempt Active)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Inputs based on Category */}
          {category === 'delivery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pickup Place & Dispenser */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    PICKUP WAYPOINT
                  </label>
                  <select
                    value={pickupPlace}
                    onChange={(e) => setPickupPlace(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {allWaypoints.map((wp) => (
                      <option key={wp} value={wp}>
                        {wp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    DISPENSER HANDLER
                  </label>
                  <select
                    value={pickupDispenser}
                    onChange={(e) => setPickupDispenser(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {availableDispensers.map((disp) => (
                      <option key={disp} value={disp}>
                        {disp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropoff Place & Ingestor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    DROPOFF WAYPOINT
                  </label>
                  <select
                    value={dropoffPlace}
                    onChange={(e) => setDropoffPlace(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {allWaypoints.map((wp) => (
                      <option key={wp} value={wp}>
                        {wp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    INGESTOR HANDLER
                  </label>
                  <select
                    value={dropoffIngestor}
                    onChange={(e) => setDropoffIngestor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {availableIngestors.map((ing) => (
                      <option key={ing} value={ing}>
                        {ing}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payload SKU & Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    PAYLOAD SKU / ITEM
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. coke, snack_box, pallet_batch"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    QUANTITY
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'patrol' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  PATROL WAYPOINT SEQUENCE
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patrolWaypoints.map((wp, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={wp}
                        onChange={(e) => {
                          const updated = [...patrolWaypoints];
                          updated[index] = e.target.value;
                          setPatrolWaypoints(updated);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        {allWaypoints.map((w) => (
                          <option key={w} value={w}>
                            Step {index + 1}: {w}
                          </option>
                        ))}
                      </select>
                      {patrolWaypoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPatrolWaypoints(patrolWaypoints.filter((_, i) => i !== index))
                          }
                          className="btn btn-secondary btn-sm"
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const nextWp = allWaypoints[patrolWaypoints.length % allWaypoints.length] || 'pantry';
                      setPatrolWaypoints([...patrolWaypoints, nextWp]);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                  >
                    <Plus size={14} />
                    <span>Add Waypoint</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  PATROL ROUNDS: {rounds}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>
            </div>
          )}

          {category === 'clean' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                TARGET SANITIZATION ZONE
              </label>
              <select
                value={cleanZone}
                onChange={(e) => setCleanZone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="clean_zone">clean_zone (Main Hall Sanitization Zone)</option>
                <option value="zone_1">zone_1 (Corridor Area)</option>
                <option value="zone_2">zone_2 (Lounge & Dining Area)</option>
              </select>
            </div>
          )}

          {category === 'move' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                DESTINATION WAYPOINT
              </label>
              <select
                value={destinationWaypoint}
                onChange={(e) => setDestinationWaypoint(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {allWaypoints.map((wp) => (
                  <option key={wp} value={wp}>
                    {wp}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              <Send size={15} />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Mission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
