'use client';

export function CardSkel({ height = 140 }) {
  return (
    <div className="skeleton" style={{ height, borderRadius: 14, width: '100%' }} />
  );
}

export function ChartSkel({ height = 280 }) {
  return (
    <div className="chart-container" style={{ height }}>
      <div className="skeleton" style={{ height: 16, width: 140, borderRadius: 6, marginBottom: 18 }} />
      <div className="skeleton" style={{ height: height - 60, borderRadius: 10 }} />
    </div>
  );
}

export function TextSkel({ lines = 3, gap = 10 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: 14,
            borderRadius: 6,
            width: i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '85%',
          }}
        />
      ))}
    </div>
  );
}

export function TableSkel({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div className="skeleton" style={{ height: 36, borderRadius: '10px 10px 0 0' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 52, borderRadius: 0, opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

export function AvatarSkel({ size = 36 }) {
  return <div className="skeleton" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />;
}
