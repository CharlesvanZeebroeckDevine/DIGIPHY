function NavigationDots({ activeIndex, onDotClick }) {
  return (
    <div className="navigation-dots">
      <div
        className={`nav-dot ${activeIndex === 0 ? 'active' : ''}`}
        onClick={() => onDotClick(0)}
      ></div>
      <div
        className={`nav-dot ${activeIndex === 1 ? 'active' : ''}`}
        onClick={() => onDotClick(1)}
      ></div>
      <div
        className={`nav-dot ${activeIndex === 2 ? 'active' : ''}`}
        onClick={() => onDotClick(2)}
      ></div>
    </div>
  )
}

export default NavigationDots
