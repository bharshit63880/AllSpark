import React from "react";
import { Navigate, useParams } from "react-router-dom";

const ContestProblemEditor = () => {
    const { contestSlug, problemIndex } = useParams();
    return <Navigate to={`/contests/start/${contestSlug}?problem=${problemIndex || 0}`} replace />;
};

export default ContestProblemEditor;
