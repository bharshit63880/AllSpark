import React from "react";

const EmailInput = ({ id, value, onValueChange, placeholderText, className = "", ...rest }) => {
    return (
        <input
            className={`premium-input ${className}`.trim()}
            type="email"
            placeholder={placeholderText ? placeholderText : "Placeholder email...."}
            id={id}
            value={value}
            onChange={onValueChange}
            {...rest}
        />
    );
};

export default EmailInput;
