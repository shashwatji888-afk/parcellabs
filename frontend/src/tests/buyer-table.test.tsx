import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BuyerAssignmentTable } from "@/components/segmentation/buyer-assignment-table";
import { CustomerPortfolioProfile, ArchetypeInterpretation } from "@/types/api";

const mockBuyers: CustomerPortfolioProfile[] = [
  {
    client_id: "C0001",
    client_type: "Individual",
    first_name: "Alice",
    last_name: "Cash",
    gender: "F",
    country: "USA",
    region: "California",
    date_of_birth_parsed: "1990-01-01",
    age: 34,
    acquisition_purpose: "Home",
    satisfaction_score: 3,
    loan_applied: "No",
    loan_applied_binary: 0,
    referral_channel: "Website",
    total_properties: 3,
    total_spend: 900000.0,
    avg_price_per_unit: 300000.0,
    avg_floor_area_sqft: 950.0,
    office_units_count: 0,
    office_ratio: 0.0,
    apartment_units_count: 3,
    apartment_ratio: 1.0,
  },
  {
    client_id: "C0002",
    client_type: "Individual",
    first_name: "Bob",
    last_name: "Prem",
    gender: "M",
    country: "USA",
    region: "New York",
    date_of_birth_parsed: "1975-01-01",
    age: 49,
    acquisition_purpose: "Home",
    satisfaction_score: 4,
    loan_applied: "No",
    loan_applied_binary: 0,
    referral_channel: "Website",
    total_properties: 4,
    total_spend: 1800000.0,
    avg_price_per_unit: 450000.0,
    avg_floor_area_sqft: 1400.0,
    office_units_count: 0,
    office_ratio: 0.0,
    apartment_units_count: 4,
    apartment_ratio: 1.0,
  },
];

const mockAssignments: Record<string, number> = { C0001: 0, C0002: 1 };
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
    count: 1000,
    percentage: 50.0,
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
    count: 1000,
    percentage: 50.0,
  },
};

describe("BuyerAssignmentTable", () => {
  it("renders buyer rows with analytical metrics and archetype names", () => {
    render(
      <BuyerAssignmentTable
        buyers={mockBuyers}
        assignments={mockAssignments}
        archetypes={mockArchetypes}
        selectedClusterId={null}
        onSelectCluster={() => {}}
      />
    );

    expect(screen.getByText("C0001")).toBeInTheDocument();
    expect(screen.getByText("Unleveraged Value Buyers")).toBeInTheDocument();
    expect(screen.getByText("$900,000")).toBeInTheDocument();

    expect(screen.getByText("C0002")).toBeInTheDocument();
    expect(screen.getByText("Premium Asset Buyers")).toBeInTheDocument();
    expect(screen.getByText("$1,800,000")).toBeInTheDocument();
  });

  it("filters buyers by client ID search input", () => {
    render(
      <BuyerAssignmentTable
        buyers={mockBuyers}
        assignments={mockAssignments}
        archetypes={mockArchetypes}
        selectedClusterId={null}
        onSelectCluster={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by client ID/);
    fireEvent.change(searchInput, { target: { value: "C0001" } });

    expect(screen.getByText("C0001")).toBeInTheDocument();
    expect(screen.queryByText("C0002")).not.toBeInTheDocument();
  });
});
