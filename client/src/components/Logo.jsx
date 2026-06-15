// Official Trot brand mark (from Light Icon.svg). `rounded` shows the white tile background.
export default function Logo({ size = 40, rounded = true, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Trot"
    >
      {rounded && <rect width="1000" height="1000" rx="100" fill="white" />}
      <path
        d="M341.522 800C341.522 350.131 593.294 200 800 200V502.063C608.177 502.063 607.4 599.326 607.4 799.923L341.522 800Z"
        fill="#FF8462"
      />
      <path
        d="M363.861 800C363.861 501.987 486.757 225.828 799.583 225.828"
        stroke="white"
      />
      <rect x="200" y="200" width="286.757" height="301.987" rx="10" fill="#FF8462" fillOpacity="0.8" />
      <path d="M270.758 299.338H304.275" stroke="white" strokeWidth="6" />
      <path d="M229.793 243.708L267.034 263.576L229.793 283.444" stroke="white" strokeWidth="6" />
      <ellipse cx="733.1" cy="732.965" rx="66.9" ry="66.9584" fill="black" />
    </svg>
  );
}
