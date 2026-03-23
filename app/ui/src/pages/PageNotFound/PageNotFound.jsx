import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HeroFeatureReel from "../../components/feature/HeroFeatureReel";

const PageNotFound = () => {
    return (
        <Layout>
            <section className="premium-page premium-section">
                <div className="premium-container grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
                    <div className="premium-panel-soft p-6 lg:p-8">
                        <span className="premium-kicker">404</span>
                        <div className="mt-5 space-y-4">
                            <h1 className="text-5xl lg:text-7xl poppins-semibold tracking-[-0.06em] text-[#091327]">
                                This route drifted
                                <span className="block primary-gradient-text">outside the AllSpark map.</span>
                            </h1>
                            <p className="text-sm leading-7 text-[#091327]/62 lg:text-base">
                                The page you were looking for is unavailable right now, but the platform is still healthy. Head back to a valid workspace and continue.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-3">
                                <Link to="/" className="premium-button-primary">Go Home</Link>
                                <Link to="/problems" className="premium-button-secondary">Open Problems</Link>
                            </div>
                        </div>
                    </div>

                    <div className="premium-panel overflow-hidden p-5 lg:p-6">
                        <HeroFeatureReel variant="small" />
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default PageNotFound;
