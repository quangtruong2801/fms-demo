import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCcw,
  Gauge,
  BatteryCharging,
  Zap,
  Code,
  Crosshair,
  MapPin,
  Save,
  Check,
  Compass,
} from 'lucide-react';
import { describeApiError, rmfClient } from '../../services/rmf-client';
import { FleetConfigBody, FleetConfigRecord, NavGraphDetail, NavGraphFile } from '../../types/fmsApi';

const DEFAULT_RMF_FLEET = {
  limits: { linear: [0.8, 0.5], angular: [1.0, 1.0] },
  profile: { footprint: 0.3, vicinity: 0.5 },
  reversible: false,
  battery_system: { voltage: 24.0, capacity: 40.0, charging_current: 10.0 },
  mechanical_system: { mass: 60.0, moment_of_inertia: 10.0, friction_coefficient: 0.22 },
  ambient_system: { power: 20.0 },
  tool_system: { power: 0.0 },
  recharge_threshold: 0.15,
  recharge_soc: 1.0,
  publish_fleet_state: 10.0,
  account_for_battery_drain: true,
  task_capabilities: { loop: true, delivery: true, patrol: true },
  actions: ['jack_up', 'jack_down'],
  finishing_request: 'charge',
  responsive_wait: false,
  robot_state_update_frequency: 10.0,
};

const IDENTITY_REFERENCE = { rmf: [[0, 0], [10, 0]], robot: [[0, 0], [10, 0]] };

type Reference = FleetConfigBody['reference_coordinates'];
type RmfFleet = Record<string, any>;

const TASK_CAPABILITIES = ['loop', 'delivery', 'patrol', 'clean'];
const ACTIONS = ['jack_up', 'jack_down'];
const FINISHING_REQUESTS = ['charge', 'park', 'nothing'];

type ModalTab = 'general' | 'calibration' | 'kinematics' | 'tasks' | 'json';

const customInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: '#070D1A',
  color: '#F8FAFC',
  fontSize: '13px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const customLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#94A3B8',
};

const cardBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '18px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(15, 23, 42, 0.55)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#FFFFFF',
  letterSpacing: '0.02em',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
};

const NumberField: React.FC<{
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
}> = ({ label, value, onChange, step = 0.1, unit }) => (
  <label style={customLabelStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{label}</span>
      {unit && (
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            background: 'rgba(0, 240, 255, 0.1)',
            padding: '1px 6px',
            borderRadius: '4px',
          }}
        >
          {unit}
        </span>
      )}
    </div>
    <input
      style={{
        ...customInputStyle,
        fontFamily: 'var(--font-mono)',
      }}
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

const CheckField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => (
  <label
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '9px',
      fontSize: '12px',
      color: checked ? '#F8FAFC' : '#94A3B8',
      cursor: 'pointer',
      userSelect: 'none',
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{
        accentColor: 'var(--accent-cyan)',
        width: '16px',
        height: '16px',
        cursor: 'pointer',
      }}
    />
    <span>{label}</span>
  </label>
);

const JsonField: React.FC<{ label: string; value: unknown; onChange: (value: any) => void }> = ({
  label,
  value,
  onChange,
}) => {
  const [text, setText] = useState<string>(() => JSON.stringify(value, null, 2));
  const [invalid, setInvalid] = useState<boolean>(false);

  useEffect(() => {
    setText((current) => {
      try {
        return JSON.stringify(JSON.parse(current)) === JSON.stringify(value) ? current : JSON.stringify(value, null, 2);
      } catch {
        return JSON.stringify(value, null, 2);
      }
    });
  }, [value]);

  return (
    <label style={customLabelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>{label}</span>
        {invalid && <span style={{ color: '#EF4444', fontSize: '11px' }}>Invalid JSON syntax</span>}
      </div>
      <textarea
        style={{
          ...customInputStyle,
          minHeight: '160px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          borderColor: invalid ? '#EF4444' : undefined,
          background: '#050811',
          lineHeight: 1.5,
        }}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
      />
    </label>
  );
};

interface LevelMap {
  map_id: string;
  map_name: string;
}

interface Props {
  fleet?: FleetConfigRecord;
  onClose: () => void;
  onSaved: (text: string) => void;
}

export const FleetConfigModal: React.FC<Props> = ({ fleet, onClose, onSaved }) => {
  const isEdit = Boolean(fleet);
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [name, setName] = useState<string>(fleet?.name ?? '');
  const [navGraphs, setNavGraphs] = useState<NavGraphFile[]>([]);
  const [navGraph, setNavGraph] = useState<string>(fleet?.config.nav_graph ?? '');
  const [detail, setDetail] = useState<NavGraphDetail | null>(null);
  const [levelMaps, setLevelMaps] = useState<Record<string, LevelMap>>(() => {
    const maps = fleet?.config.robot_api.maps ?? {};
    return Object.fromEntries(
      Object.entries(maps).map(([level, value]) => [
        level,
        { map_id: String(value.map_id ?? ''), map_name: String(value.map_name ?? '') },
      ]),
    );
  });
  const [rmfFleet, setRmfFleet] = useState<RmfFleet>(fleet?.config.rmf_fleet ?? DEFAULT_RMF_FLEET);
  const [reference, setReference] = useState<Reference>(fleet?.config.reference_coordinates ?? {});
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedCalibrationLevel, setSelectedCalibrationLevel] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    rmfClient
      .listNavGraphs()
      .then((files) => setNavGraphs([...files].sort((a, b) => b.modified_at.localeCompare(a.modified_at))))
      .catch((e) => setError(describeApiError(e)));
  }, []);

  useEffect(() => {
    if (!navGraph) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    rmfClient
      .getNavGraph(navGraph)
      .then((graph) => {
        if (cancelled) return;
        setDetail(graph);
        setLevelMaps((current) => {
          const next: Record<string, LevelMap> = {};
          graph.levels.forEach((level, index) => {
            next[level] = current[level] ?? { map_id: String(index + 1), map_name: level };
          });
          return next;
        });
        setReference((current) => {
          const next: Reference = {};
          graph.levels.forEach((level) => {
            next[level] = current[level] ?? IDENTITY_REFERENCE;
          });
          return next;
        });
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null);
          setError(describeApiError(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navGraph]);

  const levelsAvailable =
    detail?.levels && detail.levels.length > 0
      ? detail.levels
      : Object.keys(reference).length > 0
        ? Object.keys(reference)
        : ['L1'];

  useEffect(() => {
    if (!selectedCalibrationLevel || !levelsAvailable.includes(selectedCalibrationLevel)) {
      setSelectedCalibrationLevel(levelsAvailable[0] ?? 'L1');
    }
  }, [levelsAvailable, selectedCalibrationLevel]);

  const setField = (path: (string | number)[], value: unknown) => {
    setRmfFleet((current) => {
      const next = JSON.parse(JSON.stringify(current));
      let target = next;
      path.slice(0, -1).forEach((key, index) => {
        if (target[key] === undefined || target[key] === null) target[key] = typeof path[index + 1] === 'number' ? [] : {};
        target = target[key];
      });
      target[path[path.length - 1]] = value;
      return next;
    });
  };

  const toggleListItem = (key: string, item: string, checked: boolean) => {
    const list: string[] = rmfFleet[key] ?? [];
    setField([key], checked ? [...list, item] : list.filter((entry) => entry !== item));
  };

  const setPoint = (level: string, row: number, field: 'rmf' | 'robot', axis: number, value: number) => {
    setReference((current) => {
      const entry = current[level] ?? IDENTITY_REFERENCE;
      const points = entry[field].map((point) => [...point]);
      points[row][axis] = value;
      return { ...current, [level]: { ...entry, [field]: points } };
    });
  };

  const addPoint = (level: string) => {
    setReference((current) => {
      const entry = current[level] ?? IDENTITY_REFERENCE;
      return { ...current, [level]: { rmf: [...entry.rmf, [0, 0]], robot: [...entry.robot, [0, 0]] } };
    });
  };

  const removePoint = (level: string, row: number) => {
    setReference((current) => {
      const entry = current[level] ?? IDENTITY_REFERENCE;
      return {
        ...current,
        [level]: { rmf: entry.rmf.filter((_, i) => i !== row), robot: entry.robot.filter((_, i) => i !== row) },
      };
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!isEdit && !/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      setError('Name must start with a letter and contain only letters, digits and underscores.');
      return;
    }
    if (!navGraph || !detail) {
      setError('Please select a valid nav graph first.');
      return;
    }
    for (const level of detail.levels) {
      const points = reference[level]?.rmf ?? [];
      const distinct = new Set(points.map((point) => point.join(','))).size;
      if (points.length < 2 || distinct < 2) {
        setError(`Level ${level}: reference_coordinates needs at least two different points.`);
        return;
      }
    }
    const maps: Record<string, Record<string, unknown>> = {};
    for (const level of detail.levels) {
      const entry = levelMaps[level];
      if (!entry || !/^\d+$/.test(entry.map_id) || !entry.map_name) {
        setError(`Level ${level}: map_id must be an integer and map_name is required.`);
        return;
      }
      maps[level] = { map_id: Number(entry.map_id), map_name: entry.map_name };
    }
    const body: FleetConfigBody = {
      nav_graph: navGraph,
      rmf_fleet: rmfFleet,
      robot_api: {
        type: 'axbot',
        creator: 'fms',
        timeout: 5.0,
        dock_at_charger: true,
        ...(fleet?.config.robot_api ?? {}),
        maps,
      },
      reference_coordinates: reference,
    };

    setSubmitting(true);
    try {
      if (isEdit && fleet) {
        await rmfClient.updateFleetConfig(fleet.name, body);
        onSaved(`Fleet ${fleet.name} updated. Its adapter restarts to apply the change.`);
      } else {
        await rmfClient.createFleetConfig(name, body);
        onSaved(`Fleet ${name} created.`);
      }
      onClose();
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const currentLevelEntry = reference[selectedCalibrationLevel] ?? IDENTITY_REFERENCE;
  const currentRmfPoints = currentLevelEntry?.rmf ?? [[0, 0], [10, 0]];
  const currentRobotPoints = currentLevelEntry?.robot ?? [[0, 0], [10, 0]];

  // Use Portal so the modal is completely detached from parent DOM and never trapped by backdrop-filter
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          maxWidth: '920px',
          width: '100%',
          height: '86vh',
          maxHeight: '820px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'linear-gradient(180deg, #0F172A 0%, #0B1120 100%)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          boxShadow: '0 0 60px rgba(0, 240, 255, 0.12), 0 25px 65px rgba(0, 0, 0, 0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.05) 0%, rgba(13, 18, 29, 0.6) 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
              }}
            >
              <Cpu size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.03em' }}>
                  {isEdit ? 'EDIT FLEET CONFIGURATION' : 'CREATE NEW FLEET'}
                </h3>
                {isEdit && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      padding: '2px 10px',
                      borderRadius: '4px',
                      background: 'rgba(0, 240, 255, 0.15)',
                      border: '1px solid rgba(0, 240, 255, 0.4)',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    {fleet?.name}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                Kinematics limits, spatial coordinates calibration & RMF adapter profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(7, 11, 20, 0.75)',
            gap: '6px',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'general', label: 'Overview & Maps', icon: <Layers size={14} /> },
            { id: 'calibration', label: 'Calibration', icon: <Crosshair size={14} /> },
            { id: 'kinematics', label: 'Motion & Power', icon: <Gauge size={14} /> },
            { id: 'tasks', label: 'Tasks & Behavior', icon: <Zap size={14} /> },
            { id: 'json', label: 'Raw JSON', icon: <Code size={14} /> },
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ModalTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: isCurrent ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  background: 'transparent',
                  color: isCurrent ? 'var(--accent-cyan)' : '#94A3B8',
                  fontWeight: isCurrent ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body + Footer */}
        <form
          onSubmit={submit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Scrollable Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* TAB 1: GENERAL & MAPS */}
            {activeTab === 'general' && (
              <>
                <div style={cardBoxStyle}>
                  <div style={cardTitleStyle}>
                    <Layers size={16} color="var(--accent-cyan)" />
                    <span>Fleet Identification & Traffic Graph</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <label style={customLabelStyle}>
                      Fleet Name
                      <input
                        style={{
                          ...customInputStyle,
                          opacity: isEdit ? 0.65 : 1,
                          cursor: isEdit ? 'not-allowed' : 'text',
                        }}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isEdit}
                        placeholder="e.g. office, warehouse"
                      />
                      {isEdit && (
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          Fleet identifier is permanently registered and immutable.
                        </span>
                      )}
                    </label>

                    <label style={customLabelStyle}>
                      Navigation Graph (.yaml)
                      <select
                        style={customInputStyle}
                        value={navGraph}
                        onChange={(e) => setNavGraph(e.target.value)}
                      >
                        <option value="">Select a navigation graph...</option>
                        {navGraphs.map((file) => (
                          <option key={file.name} value={file.name}>
                            {file.name}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Defines waypoints, routing lanes, and physical charging stations.
                      </span>
                    </label>
                  </div>

                  {detail && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: detail.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${detail.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {detail.valid ? (
                          <CheckCircle2 size={16} color="#10B981" />
                        ) : (
                          <AlertTriangle size={16} color="#EF4444" />
                        )}
                        <span style={{ fontWeight: 600, color: detail.valid ? '#34D399' : '#F87171' }}>
                          {detail.valid ? 'Validated Graph' : `Invalid Graph: ${detail.error ?? 'Validation failed'}`}
                        </span>
                      </div>
                      <div style={{ height: '14px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                      <span style={{ color: '#94A3B8' }}>
                        Levels: <strong style={{ color: '#FFFFFF' }}>{detail.levels.join(', ') || 'none'}</strong>
                      </span>
                      <span style={{ color: '#94A3B8' }}>
                        Waypoints: <strong style={{ color: 'var(--accent-cyan)' }}>{detail.waypoints.length}</strong>
                      </span>
                      <span style={{ color: '#94A3B8' }}>
                        Lanes: <strong style={{ color: 'var(--accent-cyan)' }}>{detail.lanes}</strong>
                      </span>
                      <span style={{ color: '#94A3B8' }}>
                        Chargers: <strong style={{ color: '#FCD34D' }}>{detail.chargers.join(', ') || 'none'}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {detail && detail.levels.length > 0 && (
                  <div style={cardBoxStyle}>
                    <div style={cardTitleStyle}>
                      <MapPin size={16} color="var(--accent-cyan)" />
                      <span>Robot Internal Level Mapping</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Configure the internal map ID (integer) and map name recognized by the robot's onboard navigation engine.
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '90px 150px 1fr',
                          gap: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#64748B',
                          padding: '0 4px',
                        }}
                      >
                        <div>BUILDING LEVEL</div>
                        <div>ROBOT MAP ID</div>
                        <div>ROBOT MAP NAME</div>
                      </div>
                      {detail.levels.map((level) => (
                        <div
                          key={level}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '90px 150px 1fr',
                            gap: '12px',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '4px',
                                background: 'rgba(0, 240, 255, 0.12)',
                                border: '1px solid rgba(0, 240, 255, 0.35)',
                                color: 'var(--accent-cyan)',
                              }}
                            >
                              Floor {level}
                            </span>
                          </div>
                          <input
                            style={{ ...customInputStyle, fontFamily: 'var(--font-mono)' }}
                            placeholder="e.g. 1"
                            value={levelMaps[level]?.map_id ?? ''}
                            onChange={(e) =>
                              setLevelMaps((current) => ({
                                ...current,
                                [level]: { ...current[level], map_id: e.target.value },
                              }))
                            }
                          />
                          <input
                            style={customInputStyle}
                            placeholder="e.g. office_L1"
                            value={levelMaps[level]?.map_name ?? ''}
                            onChange={(e) =>
                              setLevelMaps((current) => ({
                                ...current,
                                [level]: { ...current[level], map_name: e.target.value },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: CALIBRATION */}
            {activeTab === 'calibration' && (
              <div style={cardBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={cardTitleStyle}>
                    <Crosshair size={16} color="var(--accent-cyan)" />
                    <span>Coordinate Calibration Matrix</span>
                  </div>

                  {/* Floor selector if multiple */}
                  {levelsAvailable.length > 1 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {levelsAvailable.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSelectedCalibrationLevel(lvl)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor:
                              selectedCalibrationLevel === lvl ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                            background:
                              selectedCalibrationLevel === lvl ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            color: selectedCalibrationLevel === lvl ? 'var(--accent-cyan)' : '#94A3B8',
                            cursor: 'pointer',
                          }}
                        >
                          Floor {lvl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Maps physical points between RMF world meters and the robot map frame. Minimum two distinct reference points required for affine transform.
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(0, 240, 255, 0.15)',
                        border: '1px solid rgba(0, 240, 255, 0.35)',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      Floor {selectedCalibrationLevel}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {currentRmfPoints.length} reference points defined
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => addPoint(selectedCalibrationLevel)}
                    >
                      <Plus size={13} /> Add Point
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() =>
                        setReference((current) => ({ ...current, [selectedCalibrationLevel]: IDENTITY_REFERENCE }))
                      }
                      title="Reset to 1:1 Identity Transform"
                    >
                      <RotateCcw size={13} /> Identity (1:1)
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr) 36px',
                    gap: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#64748B',
                    padding: '0 4px',
                  }}
                >
                  <div>RMF X (meters)</div>
                  <div>RMF Y (meters)</div>
                  <div>ROBOT MAP X</div>
                  <div>ROBOT MAP Y</div>
                  <div style={{ textAlign: 'center' }}>DEL</div>
                </div>

                {/* Calibration Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentRmfPoints.map((rmfPoint, row) => (
                    <div
                      key={row}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr) 36px',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        style={{ ...customInputStyle, fontFamily: 'var(--font-mono)' }}
                        type="number"
                        step={0.01}
                        value={Number.isFinite(rmfPoint[0]) ? rmfPoint[0] : 0}
                        onChange={(e) => setPoint(selectedCalibrationLevel, row, 'rmf', 0, Number(e.target.value))}
                      />
                      <input
                        style={{ ...customInputStyle, fontFamily: 'var(--font-mono)' }}
                        type="number"
                        step={0.01}
                        value={Number.isFinite(rmfPoint[1]) ? rmfPoint[1] : 0}
                        onChange={(e) => setPoint(selectedCalibrationLevel, row, 'rmf', 1, Number(e.target.value))}
                      />
                      <input
                        style={{ ...customInputStyle, fontFamily: 'var(--font-mono)' }}
                        type="number"
                        step={0.01}
                        value={Number.isFinite(currentRobotPoints[row]?.[0]) ? currentRobotPoints[row][0] : 0}
                        onChange={(e) => setPoint(selectedCalibrationLevel, row, 'robot', 0, Number(e.target.value))}
                      />
                      <input
                        style={{ ...customInputStyle, fontFamily: 'var(--font-mono)' }}
                        type="number"
                        step={0.01}
                        value={Number.isFinite(currentRobotPoints[row]?.[1]) ? currentRobotPoints[row][1] : 0}
                        onChange={(e) => setPoint(selectedCalibrationLevel, row, 'robot', 1, Number(e.target.value))}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: currentRmfPoints.length <= 2 ? '#475569' : '#EF4444',
                          opacity: currentRmfPoints.length <= 2 ? 0.35 : 1,
                          cursor: currentRmfPoints.length <= 2 ? 'not-allowed' : 'pointer',
                        }}
                        disabled={currentRmfPoints.length <= 2}
                        title={
                          currentRmfPoints.length <= 2
                            ? 'At least 2 points are required for calibration'
                            : 'Remove point'
                        }
                        onClick={() => removePoint(selectedCalibrationLevel, row)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: KINEMATICS & POWER */}
            {activeTab === 'kinematics' && (
              <>
                <div style={cardBoxStyle}>
                  <div style={cardTitleStyle}>
                    <Gauge size={16} color="var(--accent-cyan)" />
                    <span>Kinematic Limits & Spatial Footprint</span>
                  </div>
                  <div style={gridStyle}>
                    <NumberField
                      label="Max Linear Speed"
                      unit="m/s"
                      value={rmfFleet.limits?.linear?.[0]}
                      onChange={(v) => setField(['limits', 'linear', 0], v)}
                    />
                    <NumberField
                      label="Linear Acceleration"
                      unit="m/s²"
                      value={rmfFleet.limits?.linear?.[1]}
                      onChange={(v) => setField(['limits', 'linear', 1], v)}
                    />
                    <NumberField
                      label="Max Angular Speed"
                      unit="rad/s"
                      value={rmfFleet.limits?.angular?.[0]}
                      onChange={(v) => setField(['limits', 'angular', 0], v)}
                    />
                    <NumberField
                      label="Angular Acceleration"
                      unit="rad/s²"
                      value={rmfFleet.limits?.angular?.[1]}
                      onChange={(v) => setField(['limits', 'angular', 1], v)}
                    />
                    <NumberField
                      label="Footprint Radius"
                      unit="m"
                      value={rmfFleet.profile?.footprint}
                      onChange={(v) => setField(['profile', 'footprint'], v)}
                    />
                    <NumberField
                      label="Vicinity Radius"
                      unit="m"
                      value={rmfFleet.profile?.vicinity}
                      onChange={(v) => setField(['profile', 'vicinity'], v)}
                    />
                  </div>
                  <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <CheckField
                      label="Robot supports bi-directional motion (can drive in reverse)"
                      checked={Boolean(rmfFleet.reversible)}
                      onChange={(v) => setField(['reversible'], v)}
                    />
                  </div>
                </div>

                <div style={cardBoxStyle}>
                  <div style={cardTitleStyle}>
                    <BatteryCharging size={16} color="var(--accent-cyan)" />
                    <span>Battery & Mechanical Parameters</span>
                  </div>
                  <div style={gridStyle}>
                    <NumberField
                      label="Operating Voltage"
                      unit="V"
                      value={rmfFleet.battery_system?.voltage}
                      step={1}
                      onChange={(v) => setField(['battery_system', 'voltage'], v)}
                    />
                    <NumberField
                      label="Battery Capacity"
                      unit="Ah"
                      value={rmfFleet.battery_system?.capacity}
                      step={1}
                      onChange={(v) => setField(['battery_system', 'capacity'], v)}
                    />
                    <NumberField
                      label="Charging Current"
                      unit="A"
                      value={rmfFleet.battery_system?.charging_current}
                      step={1}
                      onChange={(v) => setField(['battery_system', 'charging_current'], v)}
                    />
                    <NumberField
                      label="Robot Mass"
                      unit="kg"
                      value={rmfFleet.mechanical_system?.mass}
                      step={1}
                      onChange={(v) => setField(['mechanical_system', 'mass'], v)}
                    />
                    <NumberField
                      label="Moment of Inertia"
                      value={rmfFleet.mechanical_system?.moment_of_inertia}
                      step={1}
                      onChange={(v) => setField(['mechanical_system', 'moment_of_inertia'], v)}
                    />
                    <NumberField
                      label="Friction Coefficient"
                      value={rmfFleet.mechanical_system?.friction_coefficient}
                      step={0.01}
                      onChange={(v) => setField(['mechanical_system', 'friction_coefficient'], v)}
                    />
                    <NumberField
                      label="Ambient Power"
                      unit="W"
                      value={rmfFleet.ambient_system?.power}
                      step={1}
                      onChange={(v) => setField(['ambient_system', 'power'], v)}
                    />
                    <NumberField
                      label="Tool System Power"
                      unit="W"
                      value={rmfFleet.tool_system?.power}
                      step={1}
                      onChange={(v) => setField(['tool_system', 'power'], v)}
                    />
                    <NumberField
                      label="Recharge Threshold"
                      unit="0-1"
                      value={rmfFleet.recharge_threshold}
                      step={0.01}
                      onChange={(v) => setField(['recharge_threshold'], v)}
                    />
                    <NumberField
                      label="Target Recharge SoC"
                      unit="0-1"
                      value={rmfFleet.recharge_soc}
                      step={0.01}
                      onChange={(v) => setField(['recharge_soc'], v)}
                    />
                  </div>
                  <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <CheckField
                      label="Account for battery energy drain when computing multi-robot task schedules"
                      checked={Boolean(rmfFleet.account_for_battery_drain)}
                      onChange={(v) => setField(['account_for_battery_drain'], v)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: TASKS & BEHAVIOR */}
            {activeTab === 'tasks' && (
              <div style={cardBoxStyle}>
                <div style={cardTitleStyle}>
                  <Zap size={16} color="var(--accent-cyan)" />
                  <span>Task Dispatching Capabilities & Behavior</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
                    AUTHORIZED MISSION TYPES
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {TASK_CAPABILITIES.map((taskName) => {
                      const active = Boolean(rmfFleet.task_capabilities?.[taskName]);
                      return (
                        <button
                          key={taskName}
                          type="button"
                          onClick={() => setField(['task_capabilities', taskName], !active)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: active ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: active ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: active ? 'var(--accent-cyan)' : '#94A3B8',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: active ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.25)',
                              boxShadow: active ? '0 0 8px var(--accent-cyan)' : 'none',
                            }}
                          />
                          {taskName.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
                    CUSTOM ROBOT ACTIONS
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {ACTIONS.map((actionName) => {
                      const active = (rmfFleet.actions ?? []).includes(actionName);
                      return (
                        <button
                          key={actionName}
                          type="button"
                          onClick={() => toggleListItem('actions', actionName, !active)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: active ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: active ? '#34D399' : '#94A3B8',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: active ? '#34D399' : 'rgba(255, 255, 255, 0.25)',
                              boxShadow: active ? '0 0 8px #34D399' : 'none',
                            }}
                          />
                          {actionName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...gridStyle, marginTop: '8px' }}>
                  <label style={customLabelStyle}>
                    When mission completes
                    <select
                      style={customInputStyle}
                      value={rmfFleet.finishing_request ?? 'nothing'}
                      onChange={(e) => setField(['finishing_request'], e.target.value)}
                    >
                      {FINISHING_REQUESTS.map((req) => (
                        <option key={req} value={req}>
                          {req}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberField
                    label="Fleet State Publish Rate"
                    unit="Hz"
                    value={rmfFleet.publish_fleet_state}
                    step={1}
                    onChange={(v) => setField(['publish_fleet_state'], v)}
                  />
                  <NumberField
                    label="Robot State Update Rate"
                    unit="Hz"
                    value={rmfFleet.robot_state_update_frequency}
                    step={1}
                    onChange={(v) => setField(['robot_state_update_frequency'], v)}
                  />
                </div>

                <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <CheckField
                    label="Responsive wait mode (permits instant preemption and re-dispatching during waits)"
                    checked={Boolean(rmfFleet.responsive_wait)}
                    onChange={(v) => setField(['responsive_wait'], v)}
                  />
                </div>
              </div>
            )}

            {/* TAB 5: RAW JSON */}
            {activeTab === 'json' && (
              <div style={cardBoxStyle}>
                <div style={cardTitleStyle}>
                  <Code size={16} color="var(--accent-cyan)" />
                  <span>Direct JSON Schema Configurations</span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Live editable configuration payloads sent directly to RMF adapter endpoints.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <JsonField label="rmf_fleet configuration" value={rmfFleet} onChange={setRmfFleet} />
                  <JsonField label="reference_coordinates" value={reference} onChange={setReference} />
                </div>
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(7, 11, 20, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              {isEdit ? (
                <span>
                  ⚡ Adapter for <strong style={{ color: 'var(--accent-cyan)' }}>{fleet?.name}</strong> will auto-reload when saved.
                </span>
              ) : (
                <span>Registers a new robotic fleet cluster with RMF Traffic core.</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ minWidth: '140px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save size={15} />
                    <span>{isEdit ? 'Save Changes' : 'Create Fleet'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
