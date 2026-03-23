import React from "react";

const Heading = ({
    text,
    kicker = "AllSpark Experience",
    description = "",
    align = "center",
    className = "",
}) => {
    const alignmentClass = align === "left" ? "items-start text-left" : "items-center text-center";
    const descriptionClass = align === "left" ? "max-w-2xl text-left" : "mx-auto max-w-3xl text-center";

    return (
        <div className={`signature-heading mb-10 flex flex-col gap-4 ${alignmentClass} ${className}`.trim()}>
            <span className="signature-heading__kicker premium-kicker">{kicker}</span>
            <div className="signature-heading__title-wrap">
                <span className="signature-heading__glow"></span>
                <h2 className="signature-heading__title">
                    {text}
                </h2>
            </div>
            <div className="signature-heading__divider flex items-center gap-2">
                <span className="signature-heading__line signature-heading__line--short"></span>
                <span className="signature-heading__dot"></span>
                <span className="signature-heading__line signature-heading__line--long"></span>
            </div>
            {description ? (
                <p className={`signature-heading__description ${descriptionClass}`.trim()}>
                    {description}
                </p>
            ) : null}
        </div>
    );
};

export default Heading;
