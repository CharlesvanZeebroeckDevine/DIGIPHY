import "./contact.css";

const Contact = () => {
    return (
        <>
            <div className="contact__container">
                <div className="contact__intro">
                    <h2 className="visibility-hidden">Contact</h2>
                    <p className="contact__intro-title">You’ve seen what <br /> <span className="contact__span">DigiPHY</span> can do...</p>
                    <p className="contact__intro-subtitle">Want to know more about how DigiPHY can support your work? <br /> Get in touch and let’s explore the possibilities together.</p>
                </div>
                <div className="contact__form-wrapper">
                    <form action="POST" className="contact__form">
                        <div className="contact__form-item">
                            <p className="contact__form-label">Hi, my name is:</p>
                            <input type="text" placeholder="Bami Schijf" className="contact__form-input" />
                        </div>
                        <div className="contact__form-item">
                            <p className="contact__form-label">my email is:</p>
                            <input type="email" placeholder="john.deere@outlook.com" className="contact__form-input" />
                        </div>
                        <div className="contact__form-item">
                            <p className="contact__form-label">I work at:</p>
                            <input type="text" placeholder="Bacobit enterprise" className="contact__form-input" />
                        </div>
                        <div className="contact__form-item">
                            <p className="contact__form-label">i would like to:</p>
                            <input type="radio" id="sub" name="sub__option" value="sub" className="radiobox" />
                            <label for="sub" className="radio__label">Subscribe to the newsletter</label><br/>

                            <input type="radio" id="book" name="book__option" value="book" className="radiobox" />
                            <label for="book" className="radio__label">Book a workshop</label><br />

                            <input type="radio" id="rent" name="rent__option" value="rent" className="radiobox" />
                            <label for="rent" className="radio__label">Rent the DigiPHY model</label><br />

                            <input type="radio" id="buy" name="buy__option" value="buy" className="radiobox" />
                            <label for="buy" className="radio__label">Buy the DigiPHY model</label><br />
                        </div>
                            <input type="submit" value="Submit" className="contact__submit"/>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Contact;