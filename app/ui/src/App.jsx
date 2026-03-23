import React from "react";
import Layout from "./components/layout/Layout";
import { Link } from "react-router-dom";
import Heading from "./components/heading/Heading";
import FeatureBox from "./components/feature/FeatureBox";
import HeroFeatureReel from "./components/feature/HeroFeatureReel";

import gearsIconSVG from "./assets/icons/gears-icon.svg";
import infinityIconSVG from "./assets/icons/infinity-icon.svg";
import keyholeIconSVG from "./assets/icons/keyhole-icon.svg";
import serverIconSVG from "./assets/icons/server-icon.svg";

const App = () => {
  const features = [
    {
      name: "Open Source",
      description: "Built for contributors, teams, and rapid iteration without hiding the platform internals.",
      imageInfo: {
        url: keyholeIconSVG,
        altText: "Open Source Feature Icon",
      },
    },
    {
      name: "Self Hostable",
      description: "Run the entire platform on your own infrastructure and keep the experience under your control.",
      imageInfo: {
        url: serverIconSVG,
        altText: "Self Hostable Feature Icon",
      },
    },
    {
      name: "Event Driven",
      description: "Async service orchestration keeps contest, judging, support, and admin workflows clean and scalable.",
      imageInfo: {
        url: gearsIconSVG,
        altText: "Distributed Event Driven Feature Icon",
      },
    },
    {
      name: "Scalable",
      description: "Practice, live contests, leaderboards, and ops tooling all evolve without collapsing into one fragile layer.",
      imageInfo: {
        url: infinityIconSVG,
        altText: "Scalable Feature Icon",
      },
    },
  ];

  const statCards = [
    { label: "Workspaces", value: "Practice + Contest", helper: "Unified coding flow" },
    { label: "Execution", value: "Judge0 Powered", helper: "Reliable code runs" },
    { label: "Realtime", value: "Live Rankings", helper: "Leaderboard updates" },
    { label: "Operations", value: "Admin + Support", helper: "Platform visibility" },
  ];

  const productPillars = [
    "Clean problem solving workspace",
    "Live contest participation and final batch submit",
    "Realtime leaderboard and rank updates",
    "Support tickets with gated recovery access",
  ];

  return (
    <Layout>
      <section className="premium-page premium-section premium-showcase">
        <div className="premium-container flex flex-col gap-10">
          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="relative p-6 lg:p-10">
              <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-[#135BEB]/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#9D29FF]/10 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-7">
                <span className="premium-kicker">Open source coding infrastructure</span>

                <div className="space-y-4">
                  <h1 className="premium-heading">
                    Premium coding workflows,
                    <span className="block primary-gradient-text">built for practice and live contests.</span>
                  </h1>
                  <p className="premium-lead">
                    AllSpark brings together problem solving, code execution, async judging, contest orchestration,
                    support resolution, and admin operations inside one polished product experience.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {productPillars.map((pillar) => (
                    <span key={pillar} className="premium-chip">
                      {pillar}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link to="/login" className="premium-button-primary">
                    Launch Workspace
                  </Link>
                  <Link to="/contests" className="premium-button-secondary">
                    Explore Contests
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroFeatureReel variant="small" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <div key={item.label} className="premium-panel-soft glass-card-hover p-5">
                <p className="text-sm text-[#091327]/55 poppins-medium">{item.label}</p>
                <h3 className="mt-3 text-2xl text-[#091327] poppins-semibold">{item.value}</h3>
                <p className="mt-2 text-sm text-[#091327]/58">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section pt-0 premium-showcase">
        <div className="premium-container">
          <div className="premium-panel-soft p-6 lg:p-8">
            <Heading text="Platform Capabilities" />
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureBox
                  key={`feature-${index}`}
                  name={feature.name}
                  description={feature.description}
                  imageInfo={feature.imageInfo}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default App;
