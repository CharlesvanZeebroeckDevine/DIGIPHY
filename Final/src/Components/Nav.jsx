import PrimaryButton from "./UI/PrimaryButton"
import './Nav.css'

const Nav = ({ scrollToSection }) => {
    return (
        <div className="nav_container">
            <div className="logo">
                <span>DIGI<span className="bold">PHY</span> 2.0</span>
            </div>
            <div className="nav_buttons">
                <PrimaryButton
                    text="Use Cases"
                    onClick={() => scrollToSection('car-usecases', '+210vh')}
                />
                <PrimaryButton
                    text="Contact"
                    onClick={() => scrollToSection('contact')}
                />
            </div>
        </div>
    )
}

export default Nav
