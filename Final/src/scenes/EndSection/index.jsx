import "./EndSection.css"
import Contact from '../Contact'
import Footer from '../Footer'
import { LiquidFooterLine } from '../Footer/LiquidFooterLine'

const EndSection = ({ scrollToSection }) => {

    return (
        <div className="endsection_container">
            <LiquidFooterLine />
            <Contact />
            <Footer scrollToSection={scrollToSection} />
        </div>
    )
}

export default EndSection