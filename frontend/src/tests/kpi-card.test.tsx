import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KPICard } from "@/components/ui/kpi-card";

describe("KPICard", () => {
  it("renders title, value, and subtitle correctly", () => {
    render(
      <KPICard
        title="Total Analyzed Buyers"
        value="2,000"
        subtitle="100% referential integrity"
        trend={{ value: "Stable", positive: true }}
      />
    );

    expect(screen.getByText("Total Analyzed Buyers")).toBeInTheDocument();
    expect(screen.getByText("2,000")).toBeInTheDocument();
    expect(screen.getByText("100% referential integrity")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });

  it("renders skeleton state when loading is true", () => {
    const { container } = render(
      <KPICard title="Total Analyzed Buyers" value="2,000" loading={true} />
    );

    expect(screen.queryByText("2,000")).not.toBeInTheDocument();
    const pulseElements = container.getElementsByClassName("animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
