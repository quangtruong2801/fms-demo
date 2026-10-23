import React from 'react';
import { Terminal } from 'lucide-react';
import { TaskLogEntry } from '../../types/rmf';

interface TaskLogTerminalProps {
  logs: TaskLogEntry[];
  taskId: string;
}

export const TaskLogTerminal: React.FC<TaskLogTerminalProps> = ({ logs, taskId }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          background: '#0D1117',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--accent-cyan)" />
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            TASK STDOUT & RMF LOG STREAM // {taskId}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
          ● LIVE LOGGING
        </span>
      </div>

      <div className="terminal-window" style={{ height: '180px' }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No logs reported for this task yet. Listening for RMF ROS2 log messages...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.seq} style={{ marginBottom: '6px', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span
                style={{
                  fontWeight: 600,
                  marginRight: '8px',
                  color:
                    log.tier === 'error'
                      ? '#EF4444'
                      : log.tier === 'warn'
                      ? '#F59E0B'
                      : '#38BDF8',
                }}
              >
                [{log.tier.toUpperCase()}]
              </span>
              <span style={{ color: '#E2E8F0' }}>{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
