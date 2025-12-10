function NavigationDots({ activeIndex, onDotClick }) {
  return (
    <div className="navigation_dots">
      <div
        className={`nav_dot ${activeIndex === 0 ? 'active' : ''}`}
        onClick={() => onDotClick(0)}
      ></div>
      <div
        className={`nav_dot ${activeIndex === 1 ? 'active' : ''}`}
        onClick={() => onDotClick(1)}
      ></div>
      <div
        className={`nav_dot ${activeIndex === 2 ? 'active' : ''}`}
        onClick={() => onDotClick(2)}
      ></div>
    </div>
  )
}

export default NavigationDots
