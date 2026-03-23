import React, { useState } from "react";

const PasswordInput = ({
    id,
    value,
    onValueChange,
    placeholderText,
    className = "",
    ...rest
}) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative">
            <input
                className={`premium-input pr-16 ${className}`.trim()}
                type={isVisible ? "text" : "password"}
                placeholder={placeholderText ? placeholderText : "Enter your AllSpark password"}
                id={id}
                value={value}
                onChange={onValueChange}
                {...rest}
            />
            <button
                type="button"
                onClick={() => setIsVisible((prev) => !prev)}
                className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#135BEB]/15 bg-white/80 text-[#135BEB] shadow-[0_12px_24px_rgba(19,91,235,0.08)] backdrop-blur-sm hover:-translate-y-[52%] hover:border-[#135BEB]/25 hover:bg-[#135BEB]/6"
                aria-label={isVisible ? "Hide password" : "Show password"}
                title={isVisible ? "Hide password" : "Show password"}
            >
                <span className="sr-only">{isVisible ? "Hide password" : "Show password"}</span>
                {isVisible ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3l18 18M10.58 10.58A2 2 0 0012 16a2 2 0 001.42-.58M9.88 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 8-1 2.84-3.04 5.11-5.65 6.42M6.61 6.61C4.62 7.94 3.1 9.8 2 12c.69 1.95 1.82 3.67 3.27 5.03"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7S2 12 2 12z"
                        />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default PasswordInput;
