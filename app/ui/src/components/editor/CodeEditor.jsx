import { useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({
    onCodeLanguageChange,
    onCodeStringChange,
    initialLanguageId,
    initialCode,
    editorHeight = "70vh",
    emitInitialState = true,
}) => {
    const languageStringToIdMappingObject = useMemo(() => ({
        cpp: 52,
        java: 62,
        javascript: 63,
        python: 71,
    }), []);

    const languageIdToStringMappingObject = useMemo(() => ({
        52: "cpp",
        62: "java",
        63: "javascript",
        71: "python",
    }), []);

    const boilerPlateCodeForLanguages = useMemo(() => ([
        {
            language: "cpp",
            boilerPlateCode: "// Please Note \n\n// You Have to Write Full Code Here \n// Including the Input Taking From The Terminal or Console \n// You May Choose To Remove These Lines or Keep Them \n\n// Start Coding :)",
        },
        {
            language: "java",
            boilerPlateCode: "// Please Note \n\n// You Have to Write Full Code Here \n// Including the Input Taking From The Terminal or Console \n// You May Choose To Remove These Lines or Keep Them \n\n// Start Coding :)",
        },
        {
            language: "javascript",
            boilerPlateCode: "// Please Note \n\n// You Have to Write Full Code Here \n// Including the Input Taking From The Terminal or Console \n// You May Choose To Remove These Lines or Keep Them \n\n// Start Coding :)",
        },
        {
            language: "python",
            boilerPlateCode: "# Please Note \n\n# You Have to Write Full Code Here \n# Including the Input Taking From The Terminal or Console \n# You May Choose To Remove These Lines or Keep Them \n\n# Start Coding :)",
        },
    ]), []);

    const getBoilerPlateCode = (language) => {
        return boilerPlateCodeForLanguages.find((element) => element.language === language)?.boilerPlateCode
            || boilerPlateCodeForLanguages[0].boilerPlateCode;
    };

    const getLanguageString = (languageId) => {
        return languageIdToStringMappingObject[Number(languageId)] || "cpp";
    };

    const resolvedInitialLanguage = getLanguageString(initialLanguageId);
    const [codeLanguage, setCodeLanguage] = useState(resolvedInitialLanguage);
    const [codeString, setCodeString] = useState(initialCode || getBoilerPlateCode(resolvedInitialLanguage));

    const handleEditorChange = (value) => {
        setCodeString(value);
        onCodeStringChange?.(value);
    };

    const handleLanguageSelectionChange = (e) => {
        const languageValue = e.target.value;
        setCodeLanguage(languageValue);
        const newCodeString = getBoilerPlateCode(languageValue);
        setCodeString(newCodeString);
        onCodeLanguageChange?.(languageStringToIdMappingObject[languageValue]);
        onCodeStringChange?.(newCodeString);
    };

    useEffect(() => {
        if (!emitInitialState) {
            return;
        }
        onCodeLanguageChange?.(languageStringToIdMappingObject[codeLanguage]);
        onCodeStringChange?.(codeString);
    }, []);

    useEffect(() => {
        const nextLanguage = getLanguageString(initialLanguageId);
        const nextCode = initialCode || getBoilerPlateCode(nextLanguage);
        setCodeLanguage(nextLanguage);
        setCodeString(nextCode);
    }, [initialLanguageId, initialCode]);

    return (
        <div className="w-full premium-panel-dark overflow-hidden border border-white/10">
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
                <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Workspace</p>
                    <h3 className="mt-2 text-lg poppins-semibold text-white">Editor</h3>
                </div>

                <div className="flex items-center gap-3">
                    <span className="premium-chip-dark">Live coding</span>
                    <select onChange={handleLanguageSelectionChange} name="language" id="language" value={codeLanguage} className="premium-select min-w-[8rem] border-white/10 bg-white/10 text-white">
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="javascript">Js</option>
                        <option value="python">Python</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-b-[1.75rem] border-t border-white/5">
                <Editor
                    height={editorHeight}
                    theme="vs-dark"
                    language={codeLanguage}
                    value={codeString}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        smoothScrolling: true,
                        fontSize: 15,
                        padding: { top: 18 },
                        scrollBeyondLastLine: false,
                        roundedSelection: true,
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
