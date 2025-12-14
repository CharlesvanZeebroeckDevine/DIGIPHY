import './footer.css'
import VariableText from '../../Components/VariableText'
import { LiquidFooterLine } from './LiquidFooterLine'
import PrimaryButton from '../../Components/UI/PrimaryButton'
import FooterSocialButton from '../../Components/UI/FooterSocialButton'

const Footer = ({ scrollToSection }) => {
    return (
        <div className="footer_container--wrapper">
            <LiquidFooterLine />
            <div className="footer_container">
                <div className="footer_top">
                    <div style={{ pointerEvents: 'none' }}>
                        <VariableText
                            className="footer_title"
                            baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                            hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                            radius={400}
                        >
                            DigiPHY
                        </VariableText>
                        <VariableText
                            className="footer_title"
                            baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                            hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                            radius={400}
                        >
                            <a href="https://granstudio.com/" target="_blank" rel="noopener noreferrer">
                                by GranStudio
                            </a>
                        </VariableText>
                    </div>
                    <p className="footer_subtitle">The ultimate <span>XR</span> seating buck.</p>
                </div>
                <div className="footer_bottom">
                    <div className="socials">
                        <FooterSocialButton href="https://www.linkedin.com/company/granstudio/">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1025 1024"><path fill="#F9F9F9" d="M896.428 1024h-768q-53 0-90.5-37.5T.428 896V128q0-53 37.5-90.5t90.5-37.5h768q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5zm-640-864q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v64q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5v-64zm0 192q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v512q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V352zm640 160q0-80-56-136t-136-56q-44 0-96.5 14t-95.5 39v-21q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v512q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V576q0-53 37.5-90.5t90.5-37.5t90.5 37.5t37.5 90.5v288q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V512z" /></svg>
                        </FooterSocialButton>
                        <FooterSocialButton href="https://www.instagram.com/granstudio_official">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><path fill="#F9F9F9" d="M8 5.67C6.71 5.67 5.67 6.72 5.67 8S6.72 10.33 8 10.33S10.33 9.28 10.33 8S9.28 5.67 8 5.67ZM15 8c0-.97 0-1.92-.05-2.89c-.05-1.12-.31-2.12-1.13-2.93c-.82-.82-1.81-1.08-2.93-1.13C9.92 1 8.97 1 8 1s-1.92 0-2.89.05c-1.12.05-2.12.31-2.93 1.13C1.36 3 1.1 3.99 1.05 5.11C1 6.08 1 7.03 1 8s0 1.92.05 2.89c.05 1.12.31 2.12 1.13 2.93c.82.82 1.81 1.08 2.93 1.13C6.08 15 7.03 15 8 15s1.92 0 2.89-.05c1.12-.05 2.12-.31 2.93-1.13c.82-.82 1.08-1.81 1.13-2.93c.06-.96.05-1.92.05-2.89Zm-7 3.59c-1.99 0-3.59-1.6-3.59-3.59S6.01 4.41 8 4.41s3.59 1.6 3.59 3.59s-1.6 3.59-3.59 3.59Zm3.74-6.49c-.46 0-.84-.37-.84-.84s.37-.84.84-.84s.84.37.84.84a.8.8 0 0 1-.24.59a.8.8 0 0 1-.59.24Z" /></svg>
                        </FooterSocialButton>
                        <FooterSocialButton href="https://www.youtube.com/channel/UC_vVPB_G4Lz3lKI-pK11v1w">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#F9F9F9" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </FooterSocialButton>
                        <FooterSocialButton href="https://vimeo.com/granstudiosrl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 432 384"><path fill="#F9F9F9" d="M276 100q-15 0-32 7Q276 4 364 6q66 2 62 86q-2 63-87 172q-87 114-147 114q-37 0-63-70q-18-66-34-127q-19-69-41-69q-5 0-34 20L0 106q33-29 62-56q42-36 63-38q50-5 62 68q12 80 17 99q14 65 32 65q13 0 40-42.5t29-64.5q3-37-29-37z" /></svg>
                        </FooterSocialButton>
                    </div>
                    <div className="credentials">
                        <p>© 2025 DigiPHY. Project made by Wander, Febe and Charles</p>
                    </div>
                    <div className="links">
                        <PrimaryButton
                            text="Use Cases"
                            onClick={() => scrollToSection('car-usecases', '-100vh')}
                        />
                        <PrimaryButton
                            text="Contact"
                            onClick={() => scrollToSection('contact')}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer