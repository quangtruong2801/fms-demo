import React from 'react';
import { X, CheckCircle, Clock, AlertCircle, Ban, Layers, Terminal } from 'lucide-react';
import { TaskState } from '../../types/rmf';
import { useFms } from '../../context/FmsContext';
import { SAMPLE_TASK_LOGS } from '../../services/mock-data';
import { TaskLogTerminal } from './TaskLogTerminal';

interface TaskInspectorModalProps {
  taskId: string | null;
  onClose: () => void;
}

export const TaskInspectorModal: React.FC<TaskInspectorModalProps> = ({ taskId, onClose }) => {
  const { tasks, cancelTask } = useFms();

  if (!taskId) return null;

  const task = tasks.find((t) => t.booking.id === taskId);
  if (!task) return null;

  const logs = SAMPLE_TASK_LOGS[taskId] || [
    {
      seq: 1,
      timestamp: task.unix_millis_start_time || Date.now() - 60000,
      tier: 'info',
      text: `Task ${taskId} registered with dispatcher. Category: ${task.category}`,
    },
    {
      seq: 2,
      timestamp: task.unix_millis_start_time ? task.unix_millis_start_time + 5000 : Date.now(),
      tier: 'info',
      text: `Assigned execution to robot ${task.assigned_to?.name || 'Unassigned'}`,
    },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '750px', maxHeight: '90vh' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={22} color="var(--accent-cyan)" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                  Mission Inspector: {task.booking.id}
                </h3>
                <span className={`status-badge status-${task.status}`}>{task.status}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Category: <strong>{task.category.toUpperCase()}</strong> • Requester:{' '}
                {task.booking.requester || 'Operator'}
              </span>
            </div>
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

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Metadata Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Agent</span>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  marginTop: '4px',
                }}
              >
                {task.assigned_to?.name || 'Unassigned / Queued'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Progress</span>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '4px',
                }}
              >
                {task.progress || 0}%
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Started At</span>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                }}
              >
                {task.unix_millis_start_time
                  ? new Date(task.unix_millis_start_time).toLocaleTimeString()
                  : 'Pending dispatch'}
              </div>
            </div>
          </div>

          {/* Phase Breakdown Timeline */}
          {task.phases && task.phases.length > 0 && (
            <div>
              <h4
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                Task Execution Phases & Milestones
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.phases.map((phase, idx) => {
                  const isCompleted = phase.status === 'completed';
                  const isUnderway = phase.status === 'underway';
                  return (
                    <div
                      key={phase.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: isUnderway
                          ? 'rgba(0, 240, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${
                          isUnderway ? 'rgba(0, 240, 255, 0.3)' : 'var(--border-subtle)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isCompleted
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isUnderway
                              ? 'rgba(0, 240, 255, 0.2)'
                              : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCompleted
                              ? '#10B981'
                              : isUnderway
                              ? '#00F0FF'
                              : 'var(--text-muted)',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle size={15} />
                          ) : isUnderway ? (
                            <Clock size={15} />
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 700 }}>{idx + 1}</span>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                            {phase.detail}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Phase ID: {phase.category}
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: isCompleted
                            ? '#10B981'
                            : isUnderway
                            ? '#00F0FF'
                            : 'var(--text-muted)',
                        }}
                      >
                        {phase.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Task STDOUT Terminal */}
          <TaskLogTerminal logs={logs} taskId={task.booking.id} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {task.status === 'underway' ? (
            <button
              onClick={() => {
                cancelTask(task.booking.id);
                onClose();
              }}
              className="btn btn-danger"
            >
              <Ban size={15} />
              <span>Abort & Cancel Task</span>
            </button>
          ) : (
            <div />
          )}

          <button onClick={onClose} className="btn btn-secondary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
