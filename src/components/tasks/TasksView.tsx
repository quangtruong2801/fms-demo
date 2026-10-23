import React, { useState, useMemo } from 'react';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  Layers,
  Clock,
  CheckCircle,
  Ban,
  Activity,
  ChevronRight,
  Eye,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { useFms } from '../../context/FmsContext';
import { TaskStatus, TaskCategory } from '../../types/rmf';
import { TaskDispatcherModal } from './TaskDispatcherModal';
import { TaskInspectorModal } from './TaskInspectorModal';

export const TasksView: React.FC = () => {
  const { tasks, selectedTaskId, setSelectedTaskId, cancelTask } = useFms();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [sortField, setSortField] = useState<'created' | 'id' | 'status' | 'progress'>('created');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.booking.id.toLowerCase().includes(search.toLowerCase()) ||
      (task.booking.requester || '').toLowerCase().includes(search.toLowerCase()) ||
      (task.assigned_to?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort tasks - Default: Newest Created First (descending)
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let result = 0;
      if (sortField === 'created') {
        const timeA = a.booking.unix_millis_request_time || a.unix_millis_start_time || 0;
        const timeB = b.booking.unix_millis_request_time || b.unix_millis_start_time || 0;
        result = timeA - timeB;
      } else if (sortField === 'id') {
        result = a.booking.id.localeCompare(b.booking.id);
      } else if (sortField === 'status') {
        result = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'progress') {
        result = (a.progress || 0) - (b.progress || 0);
      }

      return sortOrder === 'desc' ? -result : result;
    });
  }, [filteredTasks, sortField, sortOrder]);

  const handleSort = (field: 'created' | 'id' | 'status' | 'progress') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const underwayCount = tasks.filter((t) => t.status === 'underway').length;
  const queuedCount = tasks.filter((t) => t.status === 'queued').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Metrics Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
            Mission & Task Orchestrator
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time RMF Task Dispatch, Lifecycle Monitor & Telemetry
          </span>
        </div>

        <button onClick={() => setIsDispatcherOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Dispatch New Mission</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '360px',
            }}
          >
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Task ID, Requester, or Robot..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="all">All Categories</option>
            <option value="delivery">Delivery</option>
            <option value="patrol">Patrol</option>
            <option value="clean">Clean</option>
            <option value="move">Direct Move</option>
          </select>
        </div>

        {/* Status Pill Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--bg-surface-elevated)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {[
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'underway', label: `Underway (${underwayCount})` },
            { id: 'queued', label: `Queued (${queuedCount})` },
            { id: 'completed', label: `Done (${completedCount})` },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-cyan)' : 'transparent',
                  color: isSelected ? '#07090E' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="glass-panel table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <th
                onClick={() => handleSort('id')}
                style={{ padding: '14px 20px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: sortField === 'id' ? 'var(--accent-cyan)' : 'inherit' }}>Task ID</span>
                  {sortField === 'id' ? (
                    sortOrder === 'desc' ? <ArrowDown size={13} color="var(--accent-cyan)" /> : <ArrowUp size={13} color="var(--accent-cyan)" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th style={{ padding: '14px 16px' }}>Category</th>
              <th
                onClick={() => handleSort('status')}
                style={{ padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: sortField === 'status' ? 'var(--accent-cyan)' : 'inherit' }}>Status</span>
                  {sortField === 'status' ? (
                    sortOrder === 'desc' ? <ArrowDown size={13} color="var(--accent-cyan)" /> : <ArrowUp size={13} color="var(--accent-cyan)" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th style={{ padding: '14px 16px' }}>Assigned Robot</th>
              <th
                onClick={() => handleSort('progress')}
                style={{ padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: sortField === 'progress' ? 'var(--accent-cyan)' : 'inherit' }}>Progress</span>
                  {sortField === 'progress' ? (
                    sortOrder === 'desc' ? <ArrowDown size={13} color="var(--accent-cyan)" /> : <ArrowUp size={13} color="var(--accent-cyan)" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th style={{ padding: '14px 16px' }}>Requester</th>
              <th
                onClick={() => handleSort('created')}
                style={{ padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: sortField === 'created' ? 'var(--accent-cyan)' : 'inherit' }}>Created</span>
                  {sortField === 'created' ? (
                    sortOrder === 'desc' ? <ArrowDown size={13} color="var(--accent-cyan)" /> : <ArrowUp size={13} color="var(--accent-cyan)" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                  {sortField === 'created' && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(0, 240, 255, 0.1)',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </span>
                  )}
                </div>
              </th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  No tasks found matching your filter criteria.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const isUnderway = task.status === 'underway';
                return (
                  <tr
                    key={task.booking.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Task ID */}
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        className="mono-telemetry"
                        style={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => setSelectedTaskId(task.booking.id)}
                      >
                        {task.booking.id}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#A78BFA',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                        }}
                      >
                        {task.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status}
                      </span>
                    </td>

                    {/* Assigned Robot */}
                    <td style={{ padding: '14px 16px' }}>
                      {task.assigned_to ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {task.assigned_to.name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            ({task.assigned_to.group})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Unassigned (In Dispatch Pool)
                        </span>
                      )}
                    </td>

                    {/* Progress Bar */}
                    <td style={{ padding: '14px 16px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '5px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${task.progress || 0}%`,
                              background:
                                task.status === 'completed'
                                  ? '#10B981'
                                  : 'linear-gradient(90deg, #00F0FF, #3B82F6)',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                            width: '32px',
                          }}
                        >
                          {task.progress || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Requester */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {task.booking.requester || 'System'}
                    </td>

                    {/* Created */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {task.booking.unix_millis_request_time
                        ? new Date(task.booking.unix_millis_request_time).toLocaleTimeString()
                        : task.unix_millis_start_time
                        ? new Date(task.unix_millis_start_time).toLocaleTimeString()
                        : '--'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedTaskId(task.booking.id)}
                          className="btn btn-secondary btn-sm"
                          title="Inspect phases and live logs"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>

                        {isUnderway && (
                          <button
                            onClick={() => cancelTask(task.booking.id)}
                            className="btn btn-danger btn-sm"
                            title="Abort task"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Task Dispatcher Modal */}
      <TaskDispatcherModal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
      />

      {/* Task Inspector Modal */}
      <TaskInspectorModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
};
