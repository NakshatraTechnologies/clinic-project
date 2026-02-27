const AvailabilityBadge = ({ slotCount, nextAvailableDate }) => {
  if (slotCount > 0) {
    return (
      <span className="d-flex align-items-center gap-1" style={{
        fontSize: '0.6875rem', fontWeight: 600, color: '#16a34a',
        background: '#dcfce7', padding: '2px 8px', borderRadius: '12px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
        {slotCount} slots today
      </span>
    );
  }

  if (nextAvailableDate) {
    const d = new Date(nextAvailableDate);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return (
      <span className="d-flex align-items-center gap-1" style={{
        fontSize: '0.6875rem', fontWeight: 600, color: '#92400e',
        background: '#fef3c7', padding: '2px 8px', borderRadius: '12px'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>event</span>
        Next: {label}
      </span>
    );
  }

  return (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
      background: '#f0f2f4', padding: '2px 8px', borderRadius: '12px'
    }}>
      Check availability
    </span>
  );
};

export default AvailabilityBadge;
