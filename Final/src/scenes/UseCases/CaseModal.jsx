import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PrimaryButton from "../../Components/UI/PrimaryButton";
import VariableText from "../../Components/VariableText";


const CaseModal = ({ usecase, onClose }) => {
    const dialogRef = useRef(null);
    const [activeAccordion, setActiveAccordion] = useState(0);


    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (usecase) {
            if (!dialog.open) dialog.showModal();
        } else {
            if (dialog.open) dialog.close();
        }
    }, [usecase]);

    const handleOutsideClick = (e) => {
        const dialog = dialogRef.current;
        const rect = dialog.getBoundingClientRect();

        const clickedOutside =
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom;

        if (clickedOutside) onClose();
    };

    if (!usecase) return null;

    const handleAccordionClick = (index) => {
        setActiveAccordion(index);
    };


    return createPortal(
        <dialog ref={dialogRef} className="caseModal" onClick={handleOutsideClick} data-lenis-prevent>
            <button className="caseModal__close" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 256 256"><path fill="var(--doctor)" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z" /></svg>
            </button>

            <div className="caseModal__content">
                <div
                    className="caseModal__hero"
                    style={{
                        backgroundImage: `url(${usecase.heroImage})`,
                    }}
                >
                    <VariableText
                        className="usecase__title"
                        baseSettings={{ wght: 300, slnt: 100, CNTR: 100 }}
                        hoverSettings={{ wght: 700, slnt: 0, CNTR: 0 }}
                    >
                        <h1>{usecase.title}</h1>
                    </VariableText>

                    <div className="caseModal__heroButtons">
                        {usecase.buttons.map((btn, i) => (
                            <a
                                key={i}
                                href={btn.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-reset" // helper class if needed, or inline style to remove default a styles
                                style={{ textDecoration: 'none' }}
                            >
                                <PrimaryButton text={btn.label} />
                            </a>
                        ))}
                    </div>

                </div>

                <p className="usecase__subtitle">{usecase.subtitle}</p>

                <section className="caseModal__overview">
                    <div className="overview__text">
                        <h2 className="overview__title">{usecase.overview.title}</h2>
                        <p className="overview__body">{usecase.overview.body}</p>
                    </div>
                    <img src={usecase.overview.image} alt={usecase.overview.title} className="overview__img" />
                </section>

                <section className="caseModal__accordion">
                    {usecase.accordion.map((item, index) => (
                        <div
                            key={item.number}
                            className={`accordion__item ${activeAccordion === index ? "is-active" : ""}`}
                        >
                            <div className="accordion__content--wrapper">
                                <div
                                    className="accordion__visible"
                                    onClick={() => handleAccordionClick(index)}
                                >
                                    <h3 className="accordion__title">
                                        {item.number}. {item.title}
                                    </h3>
                                </div>

                                {activeAccordion === index && (
                                    <div className="accordion__detail">
                                        <p className="accordion__body">{item.body}</p>
                                    </div>
                                )}
                            </div>

                            <div className="accordion__divider" />
                        </div>
                    ))}
                </section>

                <section className="caseModal__ending">
                    <img src={usecase.ending.image} alt={usecase.ending.quoteBy} className="quote__img" />
                    <div className="quote__wrapper">
                        <blockquote className="quote">{usecase.ending.quote}</blockquote>
                        <p className="quote__person">{usecase.ending.quoteBy}</p>

                        <a
                            href={usecase.ending.button.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="quote__button"
                            style={{ textDecoration: 'none', border: 'none', padding: 0 }}
                        >
                            <PrimaryButton text={usecase.ending.button.label} />
                        </a>
                    </div>
                </section>
            </div>

        </dialog>,
        document.body
    );
};

export default CaseModal;
