// Recreates the "trot." wordmark mark from the sample invoice.
export default function Logo({ size = 40, light = false }) {
  return (
    <div
      className="flex items-center justify-center rounded-md font-extrabold"
      style={{
        width: size,
        height: size,
        background: light ? '#ffffff' : '#111111',
        color: light ? '#111111' : '#ffffff',
        fontSize: size * 0.42,
        letterSpacing: '-0.02em',
      }}
    >
      trot.
    </div>
  );
}
