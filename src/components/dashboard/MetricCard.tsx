import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendColor = 'var(--accent-emerald)',
  accentColor = 'var(--accent-cyan)',
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top subtle highlight glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {title}
          </span>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              marginTop: '4px',
            }}
          >
            {value}
          </div>
        </div>
        <div
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px',
          }}
        >
          {subtitle && <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
          {trend && (
            <span style={{ color: trendColor, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
