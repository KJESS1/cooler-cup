interface Props { line: string; loading?: boolean; }

export default function FrostQuote({ line, loading }: Props) {
  return (
    <div className="frost-bubble">
      <div className="frost-avatar">❄️</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginBottom: 4 }}>FROST</p>
        {loading ? (
          <div style={{ height: 14, borderRadius: 6, width: '80%' }} className="shimmer" />
        ) : (
          <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.5 }}>{line}</p>
        )}
      </div>
    </div>
  );
}
