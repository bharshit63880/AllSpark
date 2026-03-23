import React from "react";

const MobileNumberInput = ({ id, value, onValueChange, placeholderText, className = "", ...rest }) => {
    return (
        <input
            className={`premium-input ${className}`.trim()}
            type="tel"
            placeholder={placeholderText ? placeholderText : "Placeholder phone no...."}
            id={id}
            value={value}
            onChange={onValueChange}
            {...rest}
        />
    );
};

export default MobileNumberInput;
