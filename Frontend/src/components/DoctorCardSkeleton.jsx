const DoctorCardSkeleton = () => {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    borderRadius: '8px',
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card mb-3" style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="d-flex flex-column flex-md-row">
            <div className="p-3 p-md-4 flex-grow-1">
              <div className="d-flex gap-3">
                {/* Avatar skeleton */}
                <div style={{ ...shimmerStyle, width: '60px', height: '60px', borderRadius: '14px', flexShrink: 0 }}></div>
                <div className="flex-grow-1">
                  {/* Name */}
                  <div style={{ ...shimmerStyle, width: '55%', height: '18px', marginBottom: '8px' }}></div>
                  {/* Specialization chips */}
                  <div className="d-flex gap-2 mb-2">
                    <div style={{ ...shimmerStyle, width: '70px', height: '20px', borderRadius: '12px' }}></div>
                    <div style={{ ...shimmerStyle, width: '90px', height: '20px', borderRadius: '12px' }}></div>
                  </div>
                  {/* Info row */}
                  <div className="d-flex gap-3">
                    <div style={{ ...shimmerStyle, width: '60px', height: '14px' }}></div>
                    <div style={{ ...shimmerStyle, width: '80px', height: '14px' }}></div>
                    <div style={{ ...shimmerStyle, width: '100px', height: '14px' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex flex-row flex-md-column align-items-center justify-content-between p-3 p-md-4" style={{ background: '#fafbfc', minWidth: '180px' }}>
              <div>
                <div style={{ ...shimmerStyle, width: '30px', height: '12px', margin: '0 auto 4px' }}></div>
                <div style={{ ...shimmerStyle, width: '60px', height: '24px', margin: '0 auto' }}></div>
              </div>
              <div className="w-100" style={{ maxWidth: '160px' }}>
                <div style={{ ...shimmerStyle, width: '100%', height: '36px', marginBottom: '8px', borderRadius: '10px' }}></div>
                <div style={{ ...shimmerStyle, width: '100%', height: '30px', borderRadius: '10px' }}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default DoctorCardSkeleton;
