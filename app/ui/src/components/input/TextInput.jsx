import React from "react";

const TextInput = ({
    id,
    value,
    onValueChange,
    placeholderText,
    onKeyDown,
    type = "text",
    className = "",
    ...rest
}) => {
    return (
        <input
            className={`premium-input ${className}`.trim()}
            type={type}
            placeholder={placeholderText ? placeholderText : "Placeholder Text...."}
            id={id}
            value={value}
            onChange={onValueChange}
            onKeyDown={onKeyDown}
            {...rest}
        />
    );
};

export default TextInput;
