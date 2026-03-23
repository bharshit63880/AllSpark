import React from "react";

const FeatureBox = ({ imageInfo, name, description }) => {
    return (
        <div className="ambient-glow-box group relative w-full max-w-[20rem] overflow-hidden rounded-[2rem] border border-[#0a173214] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,255,0.82))] p-6 shadow-[0_22px_60px_rgba(9,19,39,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-[#135BEB]/20 hover:shadow-[0_28px_70px_rgba(19,91,235,0.12)]">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#135BEB]/10 blur-3xl transition-transform duration-300 group-hover:scale-125" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#9D29FF]/10 blur-3xl transition-transform duration-300 group-hover:scale-125" />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-[0_12px_30px_rgba(9,19,39,0.08)]">
                    <img className="h-9 w-9 object-contain" src={imageInfo.url} alt={imageInfo.altText} />
                </div>

                <div className="space-y-3">
                    <p className="text-2xl poppins-semibold text-[#091327]">
                        {name}
                    </p>
                    <p className="text-sm leading-7 poppins-regular text-[#091327]/65">
                        {description}
                    </p>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#135BEB]/65 poppins-semibold">
                    <span className="h-[2px] w-8 rounded-full bg-[#135BEB]/20"></span>
                    Premium capability
                </div>
            </div>
        </div>
    );
};

export default FeatureBox;
