import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { describeApiError, rmfClient } from '../../services/rmf-client';
import { FleetConfigRecord, RobotRecord } from '../../types/fmsApi';
import { errorBoxStyle, hintStyle, inputStyle, labelStyle } from './formStyles';

interface Props {
  robot?: RobotRecord;
  fleets: FleetConfigRecord[];
  defaultFleet?: string;
  onClose: () => void;
  onSaved: (text: string) => void;
}

export const RobotModal: React.FC<Props> = ({ robot, fleets, defaultFleet, onClose, onSaved }) => {
  const isEdit = Boolean(robot);
  const [fleetName, setFleetName] = useState<string>(robot?.fleet_name ?? defaultFleet ?? fleets[0]?.name ?? '');
  const [name, setName] = useState<string>(robot?.name ?? '');
  const [charger, setCharger] = useState<string>(robot?.charger ?? '');
  const [baseUrl, setBaseUrl] = useState<string>(String(robot?.robot_api.base_url ?? ''));
  const [secret, setSecret] = useState<string>(String(robot?.robot_api.secret ?? ''));
  const [chargers, setChargers] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [probe, setProbe] = useState<{ reachable: boolean; detail: string } | null>(null);
  const [probing, setProbing] = useState<boolean>(false);

  const navGraph = fleets.find((item) => item.name === fleetName)?.config.nav_graph ?? '';

  useEffect(() => {
    if (!navGraph) {
      setChargers([]);
      return;
    }
    let cancelled = false;
    rmfClient
      .getNavGraph(navGraph)
      .then((graph) => {
        if (!cancelled) setChargers(graph.chargers);
      })
      .catch((e) => {
        if (!cancelled) setError(describeApiError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [navGraph]);

  const testConnection = async () => {
    setProbe(null);
    setProbing(true);
    try {
      setProbe(await rmfClient.testRobot({ base_url: baseUrl.trim(), secret }));
    } catch (e) {
      setProbe({ reachable: false, detail: describeApiError(e) });
    } finally {
      setProbing(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!fleetName) {
      setError('Pick a fleet first.');
      return;
    }
    if (!name.trim() || !charger || !baseUrl.trim() || !secret) {
      setError('Name, charger, base URL and secret are all required.');
      return;
    }
    const body = {
      charger,
      robot_api: { ...(robot?.robot_api ?? {}), base_url: baseUrl.trim(), secret },
    };

    setSubmitting(true);
    try {
      if (isEdit && robot) {
        await rmfClient.updateRobot(robot.fleet_name, robot.name, body);
        onSaved(`Robot ${robot.name} updated. The adapter of fleet ${robot.fleet_name} restarts to apply it.`);
      } else {
        await rmfClient.createRobot(fleetName, name.trim(), body);
        onSaved(`Robot ${name.trim()} added to fleet ${fleetName}. It shows in Fleets once the robot reports pose and battery.`);
      }
      onClose();
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

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
        className="modal-card"
        style={{
          maxWidth: '540px',
          width: '100%',
          background: 'linear-gradient(180deg, #0F172A 0%, #0B1120 100%)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.1), 0 25px 60px rgba(0, 0, 0, 0.85)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.05) 0%, rgba(13, 18, 29, 0.6) 100%)',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.03em' }}>
            {isEdit ? `EDIT ROBOT: ${robot?.name}` : 'ADD NEW ROBOT'}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={labelStyle}>
            Target Fleet
            <select
              style={inputStyle}
              value={fleetName}
              onChange={(e) => {
                setFleetName(e.target.value);
                setCharger('');
              }}
              disabled={isEdit}
            >
              {fleets.length === 0 && <option value="">No fleet available - create one first</option>}
              {fleets.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Robot Identifier
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
              placeholder="e.g. sim1 or axbot1"
            />
          </label>

          <label style={labelStyle}>
            Home Charger Waypoint
            <select style={inputStyle} value={charger} onChange={(e) => setCharger(e.target.value)}>
              <option value="">Select designated charger waypoint...</option>
              {chargers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              {charger && !chargers.includes(charger) && <option value={charger}>{charger}</option>}
            </select>
            <span style={hintStyle}>Charger locations parsed from {navGraph || 'assigned nav graph'}</span>
          </label>

          <label style={labelStyle}>
            Robot REST API Base URL
            <input
              style={inputStyle}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://192.168.25.25:8090"
            />
          </label>

          <label style={labelStyle}>
            Robot Secret Key
            <input
              style={inputStyle}
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
            />
            <span style={hintStyle}>Stored securely in FMS backend database.</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void testConnection()}
              disabled={probing || !baseUrl.trim()}
            >
              {probing ? 'Testing Connection...' : 'Test Connection'}
            </button>
            {probe && (
              <span style={{ fontSize: '12px', color: probe.reachable ? '#34D399' : '#F87171' }}>
                {probe.detail}
              </span>
            )}
          </div>

          {error && <div style={errorBoxStyle}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Robot'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
