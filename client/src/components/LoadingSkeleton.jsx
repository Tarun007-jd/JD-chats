import React from "react";

function LoadingSkeleton({ count = 3, type = "conversations" }) {
  const items = Array.from({ length: count });

  if (type === "messages") {
    return (
      <div style={{ padding: "20px 0" }}>
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              display: i % 2 === 0 ? "flex" : "flex",
              justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
              marginBottom: 12,
            }}
          >
            <div
              className="skeleton skeleton-bubble"
              style={{
                width: `${150 + Math.random() * 120}px`,
                height: `${30 + Math.random() * 20}px`,
                borderRadius: "var(--radius-xl)",
                borderBottomRightRadius: i % 2 === 0 ? 4 : "var(--radius-xl)",
                borderBottomLeftRadius: i % 2 !== 0 ? 4 : "var(--radius-xl)",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      {items.map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
          }}
        >
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton skeleton-line" style={{ width: "70%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
