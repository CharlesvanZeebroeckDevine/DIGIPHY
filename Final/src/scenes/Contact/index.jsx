import "./contact.css";
import VariableText from '../../Components/VariableText'
import PrimaryButton from '../../Components/UI/PrimaryButton'

const Contact = () => {
    return (
        <>
            <div className="contact_container">
                <div className="contact_intro">
                    <h2 className="visibility-hidden">Contact</h2>
                    <VariableText
                        className="contact_title"
                        baseSettings={{ wght: 300, slnt: 100, CNTR: 100, letterSpacing: -5 }}
                        hoverSettings={{ wght: 700, slnt: 0, CNTR: 0, letterSpacing: 5 }}
                        radius={400}>
                        Now you've <br /> 
                        seen what <br /> 
                        DigiPHY can do...
                    </VariableText>
                    <p>Want to know more about how DigiPHY can support your work? Get in touch and let’s explore the possibilities together.</p>
                </div>
                <div className="form_container">
                    <form action="POST">
                        <div className="form_item form_item--name">
                            <label className="form_item--label" htmlFor="name">Hi, my name is:</label>
                            <input type="text" id="name" placeholder="Bami Schijf" required />
                        </div>
                        <div className="form_item form_item--email">
                            <label className="form_item--label" htmlFor="email">my email is:</label>
                            <input type="email" id="email" placeholder="john.deere@outlook.com" required />
                        </div>
                        <div className="form_item form_item--work">
                            <label className="form_item--label" htmlFor="work">I work at:</label>
                            <input type="text" id="work" placeholder="Bacobit enterprise" required />
                        </div>
                        <div className="form_item form_item--workoption">
                            <label className="form_item--label" htmlFor="workoption">i would like to:</label>
                            <div className="radio_container">
                                <div className="radio_container--item">
                                    <label htmlFor="sub">Subscribe to the newsletter</label>
                                    <input type="radio" id="sub" name="sub__option" value="sub" />
                                </div>

                                <div className="radio_container--item">
                                    <label htmlFor="book">Book a workshop</label>
                                    <input type="radio" id="book" name="book__option" value="book" />
                                </div>

                                <div className="radio_container--item">
                                    <label htmlFor="rent">Rent the DigiPHY model</label>
                                    <input type="radio" id="rent" name="rent__option" value="rent" />
                                </div>

                                <div className="radio_container--item">
                                    <label htmlFor="buy">Buy the DigiPHY model</label>
                                    <input type="radio" id="buy" name="buy__option" value="buy" />
                                </div>

                                <div className="radio_container--item">
                                    <label htmlFor="other">Other</label>
                                    <input type="radio" id="other" name="buy__option" value="other" />
                                </div>
                            </div>
                        </div>
                        <PrimaryButton text="Submit" value="Submit" onClick={() => console.log('Submit')} />
                    </form>
                </div>
            </div>
        </>
    );
};

export default Contact;