import "./contact.css";

const Contact = () => {
    return (
        <>
            <div className="contact__container">
                <div className="contact__intro">
                    <h2 className="visibility-hidden">Contact</h2>
                    <p>You’ve seen what <span>DigiPHY</span> can do...</p>
                    <p>Want to know more about how DigiPHY can support your work? <br /> Get in touch and let’s explore the possibilities together.</p>
                </div>
                <div className="contact__form-wrapper">
                    <form action="POST">
                        <div>
                            <p>Hi, my name is:</p>
                            <input type="text" placeholder="Bami Schijf"/>
                        </div>
                        <div>
                            <p>my email is:</p>
                            <input type="email" placeholder="john.deere@outlook.com" />
                        </div>
                        <div>
                            <p>I work at:</p>
                            <input type="text" placeholder="Bacobit enterprise" />
                        </div>
                        <div>
                            <p>i would like to:</p>
                            <input type="radio" id="sub" name="sub__option" value="sub"/>
                            <label for="sub">Subscribe to the newsletter</label><br/>

                            <input type="radio" id="book" name="book__option" value="book" />
                            <label for="book">Book a workshop</label><br />

                            <input type="radio" id="rent" name="rent__option" value="rent" />
                            <label for="rent">Rent the DigiPHY model</label><br />

                            <input type="radio" id="buy" name="buy__option" value="buy" />
                            <label for="buy">Buy the DigiPHY model</label><br />
                        </div>
                            <input type="submit" value="Submit"/>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Contact;