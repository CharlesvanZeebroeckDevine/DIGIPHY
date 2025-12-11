import "./contact.css";

const Contact = () => {
    return (
        <>
            <div className="contact__container">
                <div className="contact__intro o">
                    <h2 className="visibility-hidden">Contact</h2>
                    <p className="contact__intro-title">You’ve seen what <br /> <span className="contact__span">DigiPHY</span> can do...</p>
                    <p className="contact__intro-subtitle">Want to know more about how DigiPHY can support your work? <br /> Get in touch and let’s explore the possibilities together.</p>
                </div>
                <div className="contact__form-wrapper">
                    <form action="POST">
                        <div>
                            <p>Hi, my name is:</p>
                            <input type="text" placeholder="Bami Schijf" />
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
                            <input type="radio" id="sub" name="sub__option" value="sub" />
                            <label htmlFor="sub">Subscribe to the newsletter</label><br />

                            <input type="radio" id="book" name="book__option" value="book" />
                            <label htmlFor="book">Book a workshop</label><br />

                            <input type="radio" id="rent" name="rent__option" value="rent" />
                            <label htmlFor="rent">Rent the DigiPHY model</label><br />

                            <input type="radio" id="buy" name="buy__option" value="buy" />
                            <label htmlFor="buy">Buy the DigiPHY model</label><br />
                        </div>
                        <input type="submit" value="Submit" className="contact__submit" />
                    </form>
                </div>
            </div>
        </>
    );
};

export default Contact;