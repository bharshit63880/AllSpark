import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CodeEditor from "../../components/editor/CodeEditor";
import { useAuthContext } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import axios from "axios";
import { useSocketListener } from "../../hooks/useSocketListener";

const ProblemEditor = () => {

    const sleep = async (milliSeconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliSeconds));
    };

    const sortByCreationTimeCompareFunction = (a, b) => {
        if (b.createdAt > a.createdAt) {
            return 1;
        }
        else if (a.createdAt > b.createdAt) {
            return -1;
        }
        else {
            return 0;
        }
    };


    const getLocalDateTimeStringFromISOString = (ISOString) => {

        const ISOStringDate = new Date(ISOString);
        let localDateTimeString = ISOStringDate.toDateString() + " " + ISOStringDate.toLocaleTimeString();

        return localDateTimeString;

    };

    const getLanguageLabelFromId = (languageId) => {
        const languageLabels = {
            52: "C++",
            62: "Java",
            63: "JavaScript",
            71: "Python",
        };

        return languageLabels[Number(languageId)] || `Language ${languageId}`;
    };


    const navigate = useNavigate();

    const { token, user } = useAuthContext();

    const [isLoggedIn, setIsLoggedIn] = useState(false); // boolean

    const { slug } = useParams();


    const [visiblePart, setVisiblePart] = useState({
        // Only Field's Value is To be Changed in this Object and Adding or Removing Should be Done With Caution As That May Break the Other UI Components
        problemDescription: true,
        problemSubmissions: false,
    });

    const [problemDetails, setProblemDetails] = useState(null); // null or Object

    const [submissionDetails, setSubmissionDetails] = useState(null); // null or Object

    const [submissionFilter, setSubmissionFilter] = useState("private"); // "all" or "public" or "private"

    const [allSubmissionsToThisProblem, setAllSubmissionsToThisProblem] = useState([]); // Array

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

    const { isConnected, clientId } = useWebSocketContext();

    const selectedLanguageId = submissionDetails?.language_id;
    const publicTestCaseGroups = problemDetails?.test_cases || [];
    const activePublicTestCaseGroup =
        publicTestCaseGroups.find((testCaseGroup) => Number(testCaseGroup.language_id) === Number(selectedLanguageId))
        || publicTestCaseGroups[0]
        || null;
    const activePublicTestCases = activePublicTestCaseGroup?.public_test_cases || [];




    // This Marks Visibility of All the Content As False on the First Half of the Page
    const hideAllContent = () => {
        setVisiblePart((prev) => {
            const newVisiblePart = {};
            for (let part in prev) {
                newVisiblePart[part] = false;
            }
            return newVisiblePart;
        })
    }


    const handleClickOnVisiblePartControls = (visiblePart) => {
        hideAllContent();
        setVisiblePart((prev) => {
            const newVisiblePart = { ...prev, [visiblePart]: true };
            return newVisiblePart;
        })
    };


    const handleClickOnSubmissionsFilterButton = (e) => {
        setSubmissionFilter(e.target.id);
    };


    const enableRunAndSubmitButtons = () => {
        const runButton = document.getElementById("run-button");
        const submitButton = document.getElementById("submit-button");
        if (runButton) runButton.disabled = false;
        if (submitButton) submitButton.disabled = false;
    };


    const disableRunAndSubmitButtons = () => {
        const runButton = document.getElementById("run-button");
        const submitButton = document.getElementById("submit-button");
        if (runButton) runButton.disabled = true;
        if (submitButton) submitButton.disabled = true;
    };



    const handleClickOnRunButton = async (e) => {
        console.log("Run Button Is Clicked....");
        console.log(e.target);

        // Disable Run & Submit Buttons Until Function Doesn't Exits
        disableRunAndSubmitButtons();

        try {
            // If Token is Not Present Might be User Logged Out or Deleted Token Thus redirect to Login Page
            if (!token) {
                toast.error("Login Required....");
                await sleep(1000);
                toast.loading("Redirecting you to Login Page....",);
                await sleep(1000);

                // Dismiss All Toasts
                toast.dismiss();

                navigate("/login");
            }
            // else if problemDetails or submissionDetails are not there then say Try Again after Some time
            else if (!problemDetails || !submissionDetails) {
                console.log("Either the problemDetails or submissionDetails is missing: ");
                console.log(problemDetails);
                console.log(submissionDetails);
                toast.error("Loading! Please Try Again After Some Time....");
            }
            // else if User Is Logged in Then Run Code against Public Test cases Via API Call
            else {
                console.log("Bhai Run Button is Clicked & User Logged In: ");
                console.log(submissionDetails);
                console.log("Ready to Make API Call ");


                const payload = {
                    problem_id: problemDetails._id,
                    language_id: submissionDetails.language_id,
                    source_code: submissionDetails.source_code,
                    is_for_public_test_cases: true,
                };

                console.log("Payload For the API Call: ");
                console.log(payload);

                const response = await axios.post(`${API_BASE}/submissions/practice/create`, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                        "authorization": token,
                    }
                })

                // console.log("Response From the SUBMISSIONS' API Call: ");
                // console.log(response);
                toast.success(response.data.message);


            }
        } catch (error) {
            console.log(error);
            console.log("Something Went Wrong While Making the SUBMISSIONS' API Call....", error);
            toast.error("Something went Wrong....");
        }

        // When Public Test Cases Submission Request is Made Then Show the Public Submissions
        setSubmissionFilter("public");
        hideAllContent();
        setVisiblePart((prev) => {
            return {
                ...prev,
                "problemSubmissions": true,
            }
        });

        // Add Delay of 7 Second and Then Enable Run And Submit Buttons for Limiting Users to Rapidly make Submissions and Getting Their Submission Status in the Meantime
        await sleep(7000);
        enableRunAndSubmitButtons();
    };


    const handleClickOnSubmitButton = async (e) => {
        console.log("Submit Button Is Clicked....");
        console.log(e.target);

        // Disable Run & Submit Buttons Until Function Doesn't Exits
        disableRunAndSubmitButtons();

        try {
            // If Token is Not Present Might be User Logged Out or Deleted Token Thus redirect to Login Page
            if (!token) {
                toast.error("Login Required....");
                await sleep(1000);
                toast.loading("Redirecting you to Login Page....");
                await sleep(1000);

                // Dismiss All Toasts
                toast.dismiss();

                navigate("/login");
            }
            // else if problemDetails or submissionDetails are not there then say Try Again after Some time
            else if (!problemDetails || !submissionDetails) {
                console.log("Either the problemDetails or submissionDetails is missing: ");
                console.log(problemDetails);
                console.log(submissionDetails);
                toast.error("Loading! Please Try Again After Some Time....");
            }
            // else if User Is Logged in Then Submit Code against Private Test cases Via API Call
            else {
                console.log("Bhai Submit Button is Clicked & User Logged In: ");
                console.log(submissionDetails);
                console.log("Ready to Make API Call ");


                const payload = {
                    problem_id: problemDetails._id,
                    language_id: submissionDetails.language_id,
                    source_code: submissionDetails.source_code,
                    is_for_public_test_cases: false,
                };

                console.log("Payload For the API Call: ");
                console.log(payload);

                const response = await axios.post(`${API_BASE}/submissions/practice/create`, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "client-id": clientId,
                        "authorization": token,
                    }
                })

                // console.log("Response From the SUBMISSIONS' API Call: ");
                // console.log(response);
                toast.success(response.data.message);


            }
        } catch (error) {
            console.log(error);
            console.log("Something Went Wrong While Making the SUBMISSIONS' API Call....", error);
            toast.error("Something went Wrong....");
        }

        // When Private Test Cases Submission Request is Made Then Show the Private Submissions
        setSubmissionFilter("private");
        hideAllContent();
        setVisiblePart((prev) => {
            return {
                ...prev,
                "problemSubmissions": true,
            }
        });

        // Add Delay of 7 Second and Then Enable Run And Submit Buttons for Limiting Users to Rapidly make Submissions and Getting Their Submission Status in the Meantime
        await sleep(7000);
        enableRunAndSubmitButtons();
    };


    const handleCodeLanguageChange = (language_id) => {
        console.log("Inside Parent i.e. ProblemEditor Component in handleCodeLanguageChange(): ");
        console.log(language_id);
        setSubmissionDetails((prev) => {
            return {
                ...prev,
                ["language_id"]: language_id,
            };
        });
        console.log("Submission Details Now: ");
        console.log(submissionDetails);
    };


    const handleCodeStringChange = (source_code) => {
        console.log("Inside Parent i.e. ProblemEditor Component in handleCodeStringChange(): ");
        console.log(source_code);
        setSubmissionDetails((prev) => {
            return {
                ...prev,
                ["source_code"]: source_code,
            };
        });
        console.log("Submission Details Now: ");
        console.log(submissionDetails);
    };




    // If token or User is Changed then Update the Info Who is Logged in User's Information onto the Header
    useEffect(() => {
        setIsLoggedIn((token && user) ? true : false);
        console.log("Yo Bro We Got User: ");
        console.log(user);
    }, [token, user]);


    // If the Problem Slug or WebSocket Connection Changes then Please Fetch the Problem Details Again
    useEffect(() => {
        const fetchProblemDetails = async () => {
            try {
                const response = await axios.get(`${API_BASE}/problems/${slug}`, {
                    headers: {
                        "client-id": clientId
                    }
                })

                // console.log("Response From the PROBLEMS' API Call: ");
                // console.log(response);
                toast.success(response.data.message);


            } catch (error) {
                console.log(error);
                console.log("Something Went Wrong While Making the PROBLEMS' API Call....", error);
                toast.error("Something went Wrong....");
            }
        };

        if (clientId) {
            fetchProblemDetails();
        }


    }, [slug, isConnected, clientId]);

    // Got Problem Details and Client Is Connected then Fetch All Submissions Made By This User To This Problem
    useEffect(() => {
        const fetchAllSubmissionsByUserToThisProblem = async () => {
            try {
                const response = await axios.get(`${API_BASE}/submissions/all/${problemDetails._id}`, {
                    headers: {
                        "client-id": clientId,
                        "authorization": token,
                    },
                });

                // console.log("Response From the PROBLEMS' API Call: ");
                // console.log(response);
                toast.success(response.data.message);


            } catch (error) {
                console.log(error);
                console.log("Something Went Wrong While Making the PROBLEMS' API Call....", error);
                toast.error("Something went Wrong....");
            }
        };

        // Got Problem Details and Client Is Connected & Logged In then Fetch All Submissions Made By This User To This Problem
        if (clientId && token && (problemDetails && problemDetails._id)) {
            fetchAllSubmissionsByUserToThisProblem();
        }
    }, [clientId, token, problemDetails]);



    // Websocket Event Listening Logic - Starts Here
    // Listener 1: Handle Valid Get Specfic Problem's Details' Response
    useSocketListener(
        // Selector: "Is this message for me?"
        (msg) => msg.type?.includes('response') && msg.metadata.operation?.includes("problems.getProblem"),

        // Handler: "What do I do with it?"
        async (msg) => {
            const { data, metadata } = msg;

            // If Request Processing was Success then Save The Problem's Details For further Accesses 
            if (metadata?.success === true) {
                // alert("Signed up Successfully....");
                console.log(data);
                console.log(metadata);

                // Setting Problem's Details From Event Data
                const problemDetailsFromEventData = data.result;

                setProblemDetails(problemDetailsFromEventData);

                // Show Toast Notification that Successfully Got Problem's Details
                toast.success(metadata.message);

                // Sleep for 1s to show Toast Notification
                await sleep(1000);


            }
            // Else Request Processing is not done then Tell User What May Went Wrong
            else {
                console.log(data);
                console.log(metadata);

                toast.error(metadata.message);
                await sleep(1000);
                toast.error("Seems Like Problem Doesn't Exists Now....");
                await sleep(1000);

            }
        }
    );

    // Listener 2: Handle Valid Get All Submissions Made By User Response 
    useSocketListener(
        // Selector: "Is this message for me?"
        (msg) => msg.type?.includes('response') && msg.metadata.operation?.includes("submissions.getAllSubmissionsForProblem"),

        // Handler: "What do I do with it?"
        async (msg) => {
            const { data, metadata } = msg;

            // If Request Processing was Success then Save The Submissions' Details For further Accesses 
            if (metadata?.success === true) {
                // alert("Signed up Successfully....");
                console.log(data);
                console.log(metadata);

                // Setting Submissions' Details From Event Data
                const allSubmissionForThisProblemMadeByUserDetailsFromEventData = Array.isArray(data.result) ? data.result : [];



                setAllSubmissionsToThisProblem(() => {
                    const newAllSubmissionsToThisProblem = allSubmissionForThisProblemMadeByUserDetailsFromEventData.map((submissionDetails) => {
                        const newSubmissionDetails = { ...submissionDetails };

                        if ((submissionDetails.is_cpu_executed) === true) {
                            let passedTestCases = 0;
                            const submissionTestCases = submissionDetails.test_cases;
                            console.log("For Submission id: ", submissionDetails._id, "length of submissionTestCases is: ", submissionTestCases.length, "\n\n");
                            for (let index = 0; index < submissionTestCases.length; index++) {
                                const testCase = submissionTestCases[index];
                                console.log("Processing Test Case: ", index);
                                console.log(testCase);
                                if (testCase.status.id === 3) {
                                    console.log("This Test Case Is Accepted Thus Incrementing: ", passedTestCases);
                                    passedTestCases++;
                                }
                                else {
                                    newSubmissionDetails.status = testCase.status.description;
                                    console.log("Breaking Here for Test Case: ", index);
                                    break;
                                }
                            }

                            // Check If Passed All Test Cases
                            if (passedTestCases === submissionTestCases.length) {
                                newSubmissionDetails.status = "Accepted";
                            }
                        }
                        else {
                            newSubmissionDetails.status = "Pending";
                        }



                        return newSubmissionDetails;
                    });


                    // Sort the Array By the Creation Time
                    newAllSubmissionsToThisProblem.sort(sortByCreationTimeCompareFunction);

                    console.log("Final Processed Submission's Array: ");
                    console.log(newAllSubmissionsToThisProblem);

                    return newAllSubmissionsToThisProblem;
                });

                // Show Toast Notification that Successfully Got Submissions
                toast.success(metadata.message);

                // Sleep for 1s to show Toast Notification
                await sleep(1000);


            }
            // Else Request Processing is not done then Tell User What May Went Wrong
            else {
                console.log(data);
                console.log(metadata);

                toast.error(metadata.message);
                await sleep(1000);
                toast.error("Seems Like Something Wrong while getting your Submissions....");
                await sleep(1000);

            }
        }
    );


    // Listener 3: Handle Valid Create Submission Response 
    useSocketListener(
        // Selector: "Is this message for me?"
        // Please Note: When Submission will be Created Then "test_cases" will be empty Array and when it will have some length then It Means It is Executed Thus Update Status Accordingly
        (msg) => msg.type?.includes('response') && msg.metadata.operation?.includes("submissions.practice.create") && (msg.data.result.test_cases)?.length === 0,

        // Handler: "What do I do with it?"
        async (msg) => {
            const { data, metadata } = msg;

            // If Request Processing was Success then Save The Submission's Details For further Accesses 
            if (metadata?.success === true) {
                console.log(data);
                console.log(metadata);

                // Setting Submission's Details From Event Data
                const submissionForThisProblemMadeByUserDetailsFromEventData = data.result;


                setAllSubmissionsToThisProblem((prev) => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    const newAllSubmissionsToThisProblem = [
                        {
                            ...submissionForThisProblemMadeByUserDetailsFromEventData,
                            status: "Pending",
                        },
                        ...prevArray,
                    ];

                    console.log("Final Processed Submission's Array: ");
                    console.log(newAllSubmissionsToThisProblem);

                    return newAllSubmissionsToThisProblem;
                });

                // Show Toast Notification that Successfully Got Submissions
                toast.success(metadata.message);

                // Sleep for 1s to show Toast Notification
                await sleep(1000);


            }
            // Else Request Processing is not done then Tell User What May Went Wrong
            else {
                console.log(data);
                console.log(metadata);

                toast.error(metadata.message);
                await sleep(1000);
                toast.error("Seems Like Something Wrong while Creating your Submission....");
                await sleep(1000);

            }
        }
    );

    // Listener 4: Handle Valid Got Update of Submission Response 
    useSocketListener(
        // Selector: "Is this message for me?"
        // Please Note: When Submission will be Updated Then "test_cases" will not be empty Array and when it will have no length then It Means It is yet to Executed Thus Update Status Accordingly
        (msg) => msg.type?.includes('response') && msg.metadata.operation?.includes("submissions.practice.create") && (msg.data.result.test_cases)?.length !== 0,

        // Handler: "What do I do with it?"
        async (msg) => {
            const { data, metadata } = msg;

            // If Request Processing was Success then Save The Submission's Details For further Accesses 
            if (metadata?.success === true) {
                console.log(data);
                console.log(metadata);

                // Setting Submission's Details From Event Data
                const submissionForThisProblemMadeByUserDetailsFromEventData = data.result;


                setAllSubmissionsToThisProblem((prev) => {

                    const prevArray = Array.isArray(prev) ? prev : [];
                    const newAllSubmissionsToThisProblem = prevArray.map((submissionDetails) => {
                        const newSubmissionDetails = { ...submissionDetails };
                        // If The Updated Submission is Present then Update Status of It else Return the Same Submission
                        if (newSubmissionDetails._id === submissionForThisProblemMadeByUserDetailsFromEventData._id) {

                            if ((submissionForThisProblemMadeByUserDetailsFromEventData.is_cpu_executed) === true) {
                                let passedTestCases = 0;
                                const submissionTestCases = submissionForThisProblemMadeByUserDetailsFromEventData.test_cases;

                                console.log("For Submission id: ", submissionForThisProblemMadeByUserDetailsFromEventData._id, "length of submissionTestCases is: ", submissionTestCases.length, "\n\n");

                                for (let index = 0; index < submissionTestCases.length; index++) {
                                    const testCase = submissionTestCases[index];
                                    console.log("Processing Test Case: ", index);
                                    console.log(testCase);
                                    if (testCase.status.id === 3) {
                                        console.log("This Test Case Is Accepted Thus Incrementing: ", passedTestCases);
                                        passedTestCases++;
                                    }
                                    else {
                                        newSubmissionDetails.status = testCase.status.description;
                                        console.log("Breaking Here for Test Case: ", index);
                                        break;
                                    }
                                }

                                // Check If Passed All Test Cases
                                if (passedTestCases === submissionTestCases.length) {
                                    newSubmissionDetails.status = "Accepted";
                                }
                            }
                            else {
                                newSubmissionDetails.status = "Pending";
                            }

                        }

                        return newSubmissionDetails;
                    })

                    console.log("Final Processed Submission's Array: ");
                    console.log(newAllSubmissionsToThisProblem);

                    return newAllSubmissionsToThisProblem;
                });

                // Show Toast Notification that Successfully Got Submissions
                toast.success(metadata.message);

                // Sleep for 1s to show Toast Notification
                await sleep(1000);


            }
            // Else Request Processing is not done then Tell User What May Went Wrong
            else {
                console.log(data);
                console.log(metadata);

                toast.error(metadata.message);
                await sleep(1000);
                toast.error("Seems Like Something Wrong while Executing your Submission....");
                await sleep(1000);

            }
        }
    );

    // Websocket Event Listening Logic - Ends Here



    return <>
        <div className="premium-page min-h-screen text-[#10203a]">
            <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/82 px-4 py-3 backdrop-blur-xl lg:px-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link to={"/problems"} className="text-slate-900 poppins-semibold">
                        Problem List
                    </Link>
                    <span className="text-slate-300">/</span>
                    <p className="text-sm text-slate-500 truncate max-w-56">{problemDetails?.name || slug}</p>
                </div>

                <div className="flex items-center gap-2 lg:gap-3">
                    <button id="run-button" onClick={handleClickOnRunButton} className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-40">
                        Run
                    </button>
                    <button id="submit-button" onClick={handleClickOnSubmitButton} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-40">
                        Submit
                    </button>

                    {(isLoggedIn === true) ? (
                        <Link to={"/users/dashboard"} className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center text-sm text-white poppins-semibold shadow-[0_10px_25px_rgba(37,99,235,0.24)]">
                            {user && (user.name).substr(0, 1)}
                        </Link>
                    ) : (
                        <div className="flex gap-2">
                            <Link to={"/signup"} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm">Sign Up</Link>
                            <Link to={"/login"} className="rounded-xl bg-[#2563eb] px-3 py-1.5 text-xs text-white shadow-sm">Login</Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="premium-container grid grid-cols-1 gap-4 px-3 py-4 lg:grid-cols-2 lg:px-6">
                <div className="premium-panel overflow-hidden">
                    <div className="border-b border-slate-200 px-3 py-2 flex flex-wrap gap-2 text-sm">
                        <button
                            onClick={() => handleClickOnVisiblePartControls("problemDescription")}
                            className={`rounded-full px-3 py-1.5 transition ${visiblePart.problemDescription ? "bg-[#2563eb] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => toast.info("Editorial tab will be enabled in next iteration.")}
                            className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
                        >
                            Editorial
                        </button>
                        <button
                            onClick={() => toast.info("Solutions tab will be enabled in next iteration.")}
                            className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
                        >
                            Solutions
                        </button>
                        <button
                            onClick={() => handleClickOnVisiblePartControls("problemSubmissions")}
                            className={`rounded-full px-3 py-1.5 transition ${visiblePart.problemSubmissions ? "bg-[#2563eb] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            Submissions
                        </button>
                    </div>

                    <div className="h-[78vh] overflow-y-auto p-4 lg:p-5">
                        {(visiblePart.problemDescription && problemDetails) ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl text-slate-950 poppins-semibold">{problemDetails.name}</h2>
                                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                                        <span className={`rounded-full px-3 py-1 text-xs ${problemDetails.difficulty === "easy" ? "bg-emerald-100 text-emerald-700" : (problemDetails.difficulty === "medium" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}`}>
                                            {(problemDetails.difficulty || "easy").toUpperCase()}
                                        </span>
                                        {(problemDetails.tags || []).map((tag, index) => (
                                            <span key={`${slug}-tag-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <p className="whitespace-pre-line text-slate-700 leading-8">
                                    {problemDetails.description}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-xl poppins-semibold">Sample Test Cases</h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Run button inhi visible testcases par check karta hai. Final submit hidden private testcases par hota hai.
                                            </p>
                                        </div>

                                        {activePublicTestCaseGroup ? (
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                                                {getLanguageLabelFromId(activePublicTestCaseGroup.language_id)}
                                            </span>
                                        ) : null}
                                    </div>

                                    {activePublicTestCases.length > 0 ? (
                                        <div className="space-y-4">
                                            {activePublicTestCases.map((testCase, index) => (
                                                <div
                                                    key={`${problemDetails._id}-sample-${testCase.id || index}`}
                                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(37,99,235,0.08)]"
                                                >
                                                    <p className="text-sm poppins-semibold text-slate-900">
                                                        Example {index + 1}
                                                    </p>

                                                    <div className="mt-3 grid gap-3">
                                                        <div>
                                                            <p className="mb-1 text-xs uppercase tracking-[0.24em] text-slate-400">Input</p>
                                                            <pre className="overflow-x-auto rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
{(testCase.stdin && String(testCase.stdin).trim()) || "No input"}
                                                            </pre>
                                                        </div>

                                                        <div>
                                                            <p className="mb-1 text-xs uppercase tracking-[0.24em] text-slate-400">Expected Output</p>
                                                            <pre className="overflow-x-auto rounded-xl bg-slate-50 px-4 py-3 text-sm text-emerald-700">
{(testCase.expected_output && String(testCase.expected_output).trim()) || "No output"}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                            {publicTestCaseGroups.length > 0
                                                ? `No sample testcases are available for ${getLanguageLabelFromId(selectedLanguageId)} yet. Switch language or add public testcases for this language from the control panel.`
                                                : "This problem currently has no public sample testcases configured. Add public testcases from the control panel to show them here like LeetCode examples."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {(visiblePart.problemSubmissions && allSubmissionsToThisProblem) ? (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <button id="all" onClick={handleClickOnSubmissionsFilterButton} className={`rounded-full px-3 py-1 text-xs ${submissionFilter === "all" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600"}`}>All</button>
                                    <button id="public" onClick={handleClickOnSubmissionsFilterButton} className={`rounded-full px-3 py-1 text-xs ${submissionFilter === "public" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600"}`}>Public</button>
                                    <button id="private" onClick={handleClickOnSubmissionsFilterButton} className={`rounded-full px-3 py-1 text-xs ${submissionFilter === "private" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600"}`}>Private</button>
                                </div>

                                <div className="premium-table-wrap overflow-hidden bg-white">
                                    <div className="premium-table-scroll">
                                    <table className="premium-table min-w-full text-sm text-slate-700">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Status</th>
                                                <th className="px-3 py-2 text-left">Type</th>
                                                <th className="px-3 py-2 text-left">Created</th>
                                                <th className="px-3 py-2 text-left">Id</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allSubmissionsToThisProblem.map((submission, index) => {
                                                const hideRow =
                                                    (submissionFilter === "public" && submission.is_for_public_test_cases === false) ||
                                                    (submissionFilter === "private" && submission.is_for_public_test_cases === true);

                                                if (hideRow) return null;

                                                return (
                                                    <tr key={`${problemDetails.slug}-submission-${index}`} className="border-t border-slate-100">
                                                        <td className={`px-3 py-2 ${submission.status === "Accepted" ? "text-emerald-600" : (submission.status === "Pending" ? "text-amber-600" : "text-rose-600")}`}>
                                                            {submission.status}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600">
                                                            {submission.is_for_public_test_cases ? "Public" : "Private"}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-500">
                                                            {getLocalDateTimeStringFromISOString(submission.createdAt)}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-400">
                                                            {(submission._id).substr(0, 7)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="premium-panel p-2">
                    <CodeEditor
                        onCodeLanguageChange={handleCodeLanguageChange}
                        onCodeStringChange={handleCodeStringChange}
                    />
                </div>
            </div>
        </div>
    </>;
};


export default ProblemEditor;
