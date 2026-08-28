import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PCAScatterPlot } from "@/components/segmentation/pca-scatter-plot";
import { PCAProjectionPoint, ArchetypeInterpretation } from "@/types/api";

const mockPoints: PCAProjectionPoint[] = [
  { client_id: "C0001", cluster_id: 0, x: -1.2, y: 0.5, z: 0.1 },
  { client_id: "C0002", cluster_id: 1, x: 2.3, y: -1.1, z: 0.4 },
  { client_id: "C0003", cluster_id: 2, x: 0.1, y: 1.8, z: -0.9 },
];

const mockArchetypes: Record<number, ArchetypeInterpretation> = {
  0: {
    cluster_id: 0,
    cluster_key: "cluster_0",
    generated_name: "Unleveraged Value Buyers",
    confidence: "Strong Evidence",
    is_micro_segment: false,
    short_thesis: "Thesis 0",
    detailed_rationale: "Rationale 0",
    supporting_evidence: [],
    counter_evidence: [],
    rejection_reasons: {},
    key_metrics_summary: {},
    count: 800,
    percentage: 40.0,
  },
  1: {
    cluster_id: 1,
    cluster_key: "cluster_1",
    generated_name: "Premium Asset Buyers",
    confidence: "Strong Evidence",
    is_micro_segment: false,
    short_thesis: "Thesis 1",
    detailed_rationale: "Rationale 1",
    supporting_evidence: [],
    counter_evidence: [],
    rejection_reasons: {},
    key_metrics_summary: {},
    count: 600,
    percentage: 30.0,
  },
  2: {
    cluster_id: 2,
    cluster_key: "cluster_2",
    generated_name: "Leveraged Mid-Market Buyers",
    confidence: "Strong Evidence",
    is_micro_segment: false,
    short_thesis: "Thesis 2",
    detailed_rationale: "Rationale 2",
    supporting_evidence: [],
    counter_evidence: [],
    rejection_reasons: {},
    key_metrics_summary: {},
    count: 600,
    percentage: 30.0,
  },
};

describe("PCAScatterPlot", () => {
  it("renders 2D/3D mode toggles, statistical disclaimer, and point count summary", () => {
    render(
      <PCAScatterPlot
        points={mockPoints}
        archetypes={mockArchetypes}
        explainedVarianceRatio={[0.2219, 0.1386, 0.1211]}
        totalExplainedVariance={0.4816}
        featureCount={24}
        selectedClusterId={null}
        onSelectCluster={() => {}}
      />
    );

    expect(screen.getByText(/48.16% of cumulative variance/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2D/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3D/ })).toBeInTheDocument();
    expect(screen.getByText(/3 Projected Buyers/)).toBeInTheDocument();
  });

  it("toggles between 2D and 3D mode on button click", () => {
    render(
      <PCAScatterPlot
        points={mockPoints}
        archetypes={mockArchetypes}
        explainedVarianceRatio={[0.2219, 0.1386, 0.1211]}
        totalExplainedVariance={0.4816}
        featureCount={24}
        selectedClusterId={null}
        onSelectCluster={() => {}}
      />
    );

    const button3D = screen.getByRole("button", { name: /3D/ });
    fireEvent.click(button3D);
    expect(screen.getByText(/3D Orbit: Drag to Rotate/)).toBeInTheDocument();

    const button2D = screen.getByRole("button", { name: /2D/ });
    fireEvent.click(button2D);
    expect(screen.getByText(/2D Projection: PC1 vs PC2/)).toBeInTheDocument();
  });
});
