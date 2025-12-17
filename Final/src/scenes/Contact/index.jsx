import "./contact.css";
import VariableText from '../../Components/VariableText'
import PrimaryButton from '../../Components/UI/PrimaryButton'
import { useRef, useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Contact = () => {
    const [errors, setErrors] = useState({});

    const submitForm = () => {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;

        const newErrors = {};
        if (!name.trim()) newErrors.name = true;
        if (!email.trim()) newErrors.email = true;

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            alert('submitted');
        }
    }

    const clearError = (field) => {
        if (errors[field]) {
            setErrors({ ...errors, [field]: false });
        }
    }

    const introRef = useRef(null)
    const formRef = useRef(null)
    const containerRef = useRef(null)

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set([introRef.current, formRef.current], {
                opacity: 0,
                y: 100,
            });
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    scrub: 1,
                    pin: true,
                }
            });

            tl.to({}, { duration: 0.1 })
                .to([introRef.current, formRef.current], {
                    opacity: 1,
                    y: 0,
                    ease: "power3.out"
                })
                .to({}, { duration: 0.4 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <>
            <div id="contact" ref={containerRef} className="contact_container">
                <div ref={introRef} className="contact_intro">
                    <h2 className="visibility-hidden">Contact</h2>
                    <VariableText
                        className="contact_title"
                        baseSettings={{ wght: 700, slnt: 100, CNTR: 100, letterSpacing: 2 }}
                        hoverSettings={{ wght: 300, slnt: 0, CNTR: 0, letterSpacing: -5 }}
                        radius={200}
                        fullEffectRadius={50}
                    >
                        LET'S GET <span className="bold">DIGIPHY</span> <br />
                        INTO YOUR STUDIO
                    </VariableText>
                    <p>Want to know more about how DigiPHY can support your work? Get in touch and let's explore the possibilities together.</p>
                </div>
                <div ref={formRef} className="form_container">
                    <form action="POST">
                        <div className="form_item form_item--name">
                            <label className="form_item--label" htmlFor="name">Hi, my name is:</label>
                            <input
                                type="text"
                                id="name"
                                placeholder="First Name"
                                className={errors.name ? 'input-error' : ''}
                                onChange={() => clearError('name')}
                                required
                            />
                        </div>
                        <div className="form_item form_item--email">
                            <label className="form_item--label" htmlFor="email">my email is:</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Email address"
                                className={errors.email ? 'input-error' : ''}
                                onChange={() => clearError('email')}
                                required
                            />
                        </div>
                        <div className="form_item form_item--work">
                            <label className="form_item--label" htmlFor="work">I work at:</label>
                            <input type="text" id="work" placeholder="Company Name" />
                        </div>
                        <div className="form_item form_item--workoption">
                            <label className="form_item--label" htmlFor="workoption">i would like to:</label>
                            <div className="radio_container">
                                <div className="radio_container--item">
                                    <input type="radio" id="sub" name="inquiry_type" value="sub" />
                                    <label htmlFor="sub">Subscribe to the newsletter</label>
                                </div>

                                <div className="radio_container--item">
                                    <input type="radio" id="book" name="inquiry_type" value="book" />
                                    <label htmlFor="book">Book a workshop</label>
                                </div>

                                <div className="radio_container--item">
                                    <input type="radio" id="quote" name="inquiry_type" value="quote" />
                                    <label htmlFor="quote">Request a quote</label>
                                </div>
                            </div>
                        </div>
                        <PrimaryButton text="Submit" value="Submit" onClick={() => submitForm()} />
                    </form>
                </div>
            </div>
        </>
    );
};

export default Contact;