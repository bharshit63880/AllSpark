import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import Heading from "../../components/heading/Heading";
import { useAuthContext } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useSocketListener } from "../../hooks/useSocketListener.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const defaultCareerForm = {
  issue_type: "CAREER_APPLICATION",
  applicant_name: "",
  applicant_email: "",
  applicant_phone: "",
  applicant_location: "",
  requested_track: "Platform engineering",
  portfolio_url: "",
  resume_url: "",
  title: "Resume submission for AllSpark",
  description: "",
  urgency: "MEDIUM",
};

const defaultCollaborationForm = {
  issue_type: "COLLABORATION_REQUEST",
  applicant_name: "",
  applicant_email: "",
  applicant_phone: "",
  applicant_location: "",
  organization_name: "",
  collaboration_tier: "FREE",
  collaboration_focus: "Open-source contribution",
  portfolio_url: "",
  title: "Collaboration request for AllSpark",
  description: "",
  urgency: "MEDIUM",
};

const collaborationOptions = [
  {
    tier: "FREE",
    title: "Open-source collaboration",
    body: "Contribute code, docs, QA, design, or community support and help the platform grow in the open.",
  },
  {
    tier: "PREMIUM",
    title: "Premium collaboration",
    body: "Work with the team on implementation, customization, rollout, platform operations, or dedicated product support.",
  },
];

const workStreams = [
  "Platform engineering",
  "Frontend systems",
  "Contest operations",
  "Support operations",
  "Design and product",
  "Open-source contribution",
];

const reviewSteps = [
  {
    title: "Submit",
    body: "Share your resume or collaboration brief with links that are easy for the team to review.",
  },
  {
    title: "Review",
    body: "Admin and support teams process the entry inside the existing operations inbox without any parallel system.",
  },
  {
    title: "Follow-up",
    body: "Relevant applications move to the next step, while collaboration requests are routed based on FREE or PREMIUM scope.",
  },
];

const collaborationHighlights = [
  { label: "FREE", value: "Open-source contribution", tone: "bg-[#135BEB]/10 text-[#135BEB]" },
  { label: "PREMIUM", value: "Delivery and partnership", tone: "bg-[#9D29FF]/10 text-[#9D29FF]" },
  { label: "REVIEW", value: "Handled inside admin ops", tone: "bg-[#47FF4E]/15 text-[#0a1732]" },
];

const Careers = () => {
  const { token } = useAuthContext();
  const { clientId } = useWebSocketContext();
  const [activeFlow, setActiveFlow] = useState("career");
  const [careerForm, setCareerForm] = useState(defaultCareerForm);
  const [collaborationForm, setCollaborationForm] = useState(defaultCollaborationForm);
  const [latestSubmission, setLatestSubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(() => {
    const nextHeaders = { "client-id": clientId };
    if (token) nextHeaders.authorization = token;
    return nextHeaders;
  }, [clientId, token]);

  useSocketListener(
    (msg) => msg.type === "response" && msg.metadata?.operation === "careers.submit",
    (msg) => {
      setSubmitting(false);
      if (!msg.metadata?.success) {
        toast.error(msg.metadata?.message || "Failed to submit careers request.");
        return;
      }

      const record = msg.data?.result || null;
      setLatestSubmission(record);
      toast.success(msg.metadata?.message || "Submission received successfully.");

      if (String(record?.issue_type || "").toUpperCase() === "CAREER_APPLICATION") {
        setCareerForm(defaultCareerForm);
      } else {
        setCollaborationForm(defaultCollaborationForm);
      }
    }
  );

  const submitCareersRequest = async (payload) => {
    if (!clientId) {
      toast.error("WebSocket client not ready yet. Please wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/careers/submit`, payload, { headers });
      toast.info("Submission accepted. Final response will arrive via websocket.");
    } catch (error) {
      setSubmitting(false);
      toast.error(error?.response?.data?.message || "Failed to submit careers request.");
    }
  };

  const handleCareerSubmit = async (e) => {
    e.preventDefault();
    if (!(careerForm.applicant_name && careerForm.applicant_email && careerForm.resume_url && careerForm.description)) {
      toast.error("Name, email, resume link, and your note are required.");
      return;
    }
    await submitCareersRequest(careerForm);
  };

  const handleCollaborationSubmit = async (e) => {
    e.preventDefault();
    if (!(collaborationForm.applicant_name && collaborationForm.applicant_email && collaborationForm.description)) {
      toast.error("Name, email, and collaboration summary are required.");
      return;
    }
    await submitCareersRequest(collaborationForm);
  };

  return (
    <Layout>
      <section className="premium-page premium-section premium-showcase">
        <div className="premium-container grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="relative p-6 lg:p-8">
            <div className="space-y-6">
              <Heading
                text="Build the product, or collaborate with the team behind it"
                kicker="Careers and Collaboration"
                description="Submit your resume if you want to work on AllSpark directly, or choose a collaboration path if you want to contribute in the open-source track or partner with us on a premium engagement."
              />
              <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
                {workStreams.map((stream) => (
                  <span key={stream} className="premium-chip">
                    {stream}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link to="/" className="premium-button-primary">
                  Back to Home
                </Link>
                <Link to="/support" className="premium-button-secondary">
                  Need Support Instead?
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="premium-panel-soft p-6 lg:p-7">
              <div className="flex flex-wrap gap-3">
                {collaborationHighlights.map((item) => (
                  <span
                    key={item.label}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] ${item.tone}`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-[#0a1732]">
                One page, two paths, one review workflow.
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#0a1732]/68">
                Career applications and collaboration requests both enter the same operations pipeline, so nothing gets
                lost in a side flow. The page stays simple for users while admin and support teams review everything in
                the existing control stack.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {reviewSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[1.4rem] border border-[#0a173214] bg-white/80 p-4 shadow-[0_18px_42px_rgba(10,23,50,0.06)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#135BEB]/80">
                      Step {index + 1}
                    </p>
                    <h4 className="mt-3 text-base font-semibold text-[#0a1732]">{step.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[#0a1732]/64">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="premium-panel-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a1732]/48">Career track</p>
                <h4 className="mt-3 text-lg font-semibold text-[#0a1732]">Submit your resume</h4>
                <p className="mt-2 text-sm leading-6 text-[#0a1732]/64">
                  Best for individual applications across engineering, design, operations, and product.
                </p>
              </div>
              <div className="premium-panel-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a1732]/48">Collaboration</p>
                <h4 className="mt-3 text-lg font-semibold text-[#0a1732]">Free or premium</h4>
                <p className="mt-2 text-sm leading-6 text-[#0a1732]/64">
                  Use FREE for open-source contribution and PREMIUM for implementation, rollout, or partner support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-page premium-section">
        <div className="premium-container grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-panel-soft p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-[#0a1732]">Choose Your Path</h3>
              <p className="mt-1 text-sm text-[#0a1732]/65">
                Use the career path for individual applications. Use collaboration if you want to contribute for free
                in open source or work with us on a premium basis.
              </p>
            </div>

            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => setActiveFlow("career")}
                className={`rounded-[1.5rem] border p-5 text-left transition-all ${
                  activeFlow === "career"
                    ? "border-[#135BEB]/25 bg-white shadow-[0_20px_45px_rgba(19,91,235,0.12)]"
                    : "border-[#0a173214] bg-[#0a173204] hover:bg-white/70"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0a1732]">Submit your resume</p>
                    <p className="mt-1 text-sm text-[#0a1732]/65">
                      Individual application for product, engineering, design, ops, or support roles.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#135BEB]/10 px-3 py-1 text-xs font-semibold text-[#135BEB]">
                    Career
                  </span>
                </div>
              </button>

              {collaborationOptions.map((option) => (
                <button
                  key={option.tier}
                  type="button"
                  onClick={() => {
                    setActiveFlow("collaboration");
                    setCollaborationForm((prev) => ({ ...prev, collaboration_tier: option.tier }));
                  }}
                  className={`rounded-[1.5rem] border p-5 text-left transition-all ${
                    activeFlow === "collaboration" && collaborationForm.collaboration_tier === option.tier
                      ? "border-[#135BEB]/25 bg-white shadow-[0_20px_45px_rgba(19,91,235,0.12)]"
                      : "border-[#0a173214] bg-[#0a173204] hover:bg-white/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0a1732]">{option.title}</p>
                      <p className="mt-1 text-sm text-[#0a1732]/65">{option.body}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#9D29FF]/10 px-3 py-1 text-xs font-semibold text-[#9D29FF]">
                      {option.tier}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {latestSubmission && (
              <div className="mt-6 rounded-[1.5rem] border border-[#47FF4E]/25 bg-[#47FF4E]/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#0a1732]/45">Latest submission</p>
                <h4 className="mt-2 text-lg font-semibold text-[#0a1732]">
                  {latestSubmission.issue_type === "CAREER_APPLICATION" ? "Resume received" : "Collaboration request received"}
                </h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Reference</p>
                    <p className="font-mono text-[#0a1732]">{latestSubmission.ticket_reference || latestSubmission._id}</p>
                  </div>
                  <div>
                    <p className="text-[#0a1732]/45 text-xs uppercase tracking-wide">Status</p>
                    <p className="text-[#0a1732]">{latestSubmission.status || "OPEN"}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#0a1732]/70">
                  Review team ab is entry ko admin/support inbox se process karegi. Resume submissions aur collaboration
                  requests backend me save ho chuki hain.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-[1.5rem] border border-[#0a173214] bg-white/75 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#0a1732]/48">What helps review</p>
              <div className="mt-4 grid gap-3 text-sm text-[#0a1732]/68">
                <p>Resume links should be public and easy to open.</p>
                <p>Collaboration requests should clearly mention FREE or PREMIUM scope.</p>
                <p>Portfolio, GitHub, or company links help the team route your request faster.</p>
              </div>
            </div>
          </div>

          <div className="premium-panel-soft p-6 lg:p-7">
            {activeFlow === "career" ? (
              <div>
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-[#0a1732]">Submit your resume</h3>
                  <p className="mt-1 text-sm text-[#0a1732]/65">
                    Share your resume as a public link. Google Drive, Notion, Dropbox, GitHub profile, or portfolio
                    links work well here.
                  </p>
                </div>

                <form className="space-y-3" onSubmit={handleCareerSubmit}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="premium-input"
                      placeholder="Full name"
                      value={careerForm.applicant_name}
                      onChange={(e) => setCareerForm((prev) => ({ ...prev, applicant_name: e.target.value }))}
                    />
                    <input
                      className="premium-input"
                      placeholder="Email address"
                      value={careerForm.applicant_email}
                      onChange={(e) => setCareerForm((prev) => ({ ...prev, applicant_email: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="premium-input"
                      placeholder="Phone number"
                      value={careerForm.applicant_phone}
                      onChange={(e) => setCareerForm((prev) => ({ ...prev, applicant_phone: e.target.value }))}
                    />
                    <input
                      className="premium-input"
                      placeholder="Location / Timezone"
                      value={careerForm.applicant_location}
                      onChange={(e) => setCareerForm((prev) => ({ ...prev, applicant_location: e.target.value }))}
                    />
                  </div>
                  <select
                    className="premium-select"
                    value={careerForm.requested_track}
                    onChange={(e) => setCareerForm((prev) => ({ ...prev, requested_track: e.target.value }))}
                  >
                    <option>Platform engineering</option>
                    <option>Frontend systems</option>
                    <option>Contest operations</option>
                    <option>Support operations</option>
                    <option>Design / product</option>
                    <option>Open application</option>
                  </select>
                  <input
                    className="premium-input"
                    placeholder="Portfolio / GitHub / LinkedIn URL"
                    value={careerForm.portfolio_url}
                    onChange={(e) => setCareerForm((prev) => ({ ...prev, portfolio_url: e.target.value }))}
                  />
                  <input
                    className="premium-input"
                    placeholder="Resume PDF / Drive / Notion link"
                    value={careerForm.resume_url}
                    onChange={(e) => setCareerForm((prev) => ({ ...prev, resume_url: e.target.value }))}
                  />
                  <input
                    className="premium-input"
                    placeholder="Submission title"
                    value={careerForm.title}
                    onChange={(e) => setCareerForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <textarea
                    className="premium-textarea"
                    rows={5}
                    placeholder="Tell us what kind of role you want, your strongest experience, and why you want to work on AllSpark."
                    value={careerForm.description}
                    onChange={(e) => setCareerForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <button type="submit" className="premium-button-primary w-full sm:w-auto" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Resume"}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-[#0a1732]">Collaborate with AllSpark</h3>
                  <p className="mt-1 text-sm text-[#0a1732]/65">
                    Choose free open-source collaboration or premium collaboration, then tell us how you want to work together.
                  </p>
                </div>

                <form className="space-y-3" onSubmit={handleCollaborationSubmit}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="premium-input"
                      placeholder="Full name"
                      value={collaborationForm.applicant_name}
                      onChange={(e) => setCollaborationForm((prev) => ({ ...prev, applicant_name: e.target.value }))}
                    />
                    <input
                      className="premium-input"
                      placeholder="Email address"
                      value={collaborationForm.applicant_email}
                      onChange={(e) => setCollaborationForm((prev) => ({ ...prev, applicant_email: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="premium-input"
                      placeholder="Phone number"
                      value={collaborationForm.applicant_phone}
                      onChange={(e) => setCollaborationForm((prev) => ({ ...prev, applicant_phone: e.target.value }))}
                    />
                    <input
                      className="premium-input"
                      placeholder="Location / Timezone"
                      value={collaborationForm.applicant_location}
                      onChange={(e) => setCollaborationForm((prev) => ({ ...prev, applicant_location: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="premium-select"
                      value={collaborationForm.collaboration_tier}
                      onChange={(e) => setCollaborationForm((prev) => ({ ...prev, collaboration_tier: e.target.value }))}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                    <input
                      className="premium-input"
                      placeholder="Organization / team name"
                      value={collaborationForm.organization_name}
                      onChange={(e) => setCollaborationForm((prev) => ({ ...prev, organization_name: e.target.value }))}
                    />
                  </div>
                  <input
                    className="premium-input"
                    placeholder="Focus area (open-source contribution, implementation, sponsorship, rollout...)"
                    value={collaborationForm.collaboration_focus}
                    onChange={(e) => setCollaborationForm((prev) => ({ ...prev, collaboration_focus: e.target.value }))}
                  />
                  <input
                    className="premium-input"
                    placeholder="Website / GitHub / company profile URL"
                    value={collaborationForm.portfolio_url}
                    onChange={(e) => setCollaborationForm((prev) => ({ ...prev, portfolio_url: e.target.value }))}
                  />
                  <input
                    className="premium-input"
                    placeholder="Submission title"
                    value={collaborationForm.title}
                    onChange={(e) => setCollaborationForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <textarea
                    className="premium-textarea"
                    rows={5}
                    placeholder="Tell us how you want to collaborate, what you can contribute, and whether the plan is open-source or premium."
                    value={collaborationForm.description}
                    onChange={(e) => setCollaborationForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <button type="submit" className="premium-button-primary w-full sm:w-auto" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Collaboration Request"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Careers;
