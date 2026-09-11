export default function AppCard({ app }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #eaeaea",
        borderRadius: "10px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div>
        {/* Card top: logo & category badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            height: "44px",
          }}
        >
          <div
            style={{
              height: "40px",
              maxWidth: "140px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={app.image}
              alt={app.title}
              style={{
                maxHeight: "36px",
                maxWidth: "130px",
                objectFit: "contain",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: `${app.badgeColor}25`,
              color: app.badgeColor,
              fontWeight: 600,
            }}
          >
            {app.tag}
          </span>
        </div>

        {/* Title & Description */}
        <h4
          style={{
            margin: "0 0 8px 0",
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "#111",
          }}
        >
          {app.title}
        </h4>
        <p
          style={{
            color: "#666",
            fontSize: "0.86rem",
            lineHeight: "1.55",
            margin: 0,
          }}
        >
          {app.desc}
        </p>
      </div>

      {/* Card footer: external link */}
      <div
        style={{
          marginTop: "22px",
          paddingTop: "14px",
          borderTop: "1px solid #eee",
        }}
      >
        <a
          href={app.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            textDecoration: "none",
            textAlign: "center",
            width: "100%",
            padding: "9px 0",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            color: "#3b82f6",
            fontSize: "0.85rem",
            fontWeight: 600,
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        >
          Open {app.title}
        </a>
      </div>
    </div>
  );
}
