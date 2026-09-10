export default function DigiLockerMark({ size = 40, mono = false }: { size?: number; mono?: boolean }) {
  const main = mono ? '#ffffff' : '#5558A6';
  const fold = mono ? 'rgba(255,255,255,0.65)' : '#8386C4';
  const h = (size * 3) / 4;
  return (
    <svg width={size} height={h} viewBox="0 0 64 48" fill="none" aria-hidden="true">
      <path d="M22 3h22l12 12v27a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" fill={main} />
      <path d="M44 3l12 12H46a2 2 0 0 1-2-2V3z" fill={fold} />
      <path
        d="M14 20a7 7 0 0 1 1.6-13.8A10 10 0 0 1 35 8a8 8 0 0 1 6.5 12.6c.3 4.5-3.3 8.4-7.9 8.4H21a7 7 0 0 1-7-9z"
        fill={mono ? '#5558A6' : '#ffffff'}
      />
      <circle cx="23" cy="20" r="2.6" fill={main} />
      <path d="M21.8 21.5h2.4l.9 5h-4.2l.9-5z" fill={main} />
    </svg>
  );
}
