import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "@/components/layout/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Sidebar Navigation", () => {
  it("renders brand name and all 6 core navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByText("ParclLabs")).toBeInTheDocument();
    expect(screen.getByText("Buyer Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Executive Overview")).toBeInTheDocument();
    expect(screen.getByText("Buyer Segmentation")).toBeInTheDocument();
    expect(screen.getByText("Investor Behavior")).toBeInTheDocument();
    expect(screen.getByText("Geographic Analysis")).toBeInTheDocument();
    expect(screen.getByText("Segment Insights")).toBeInTheDocument();
    expect(screen.getByText("Model Diagnostics")).toBeInTheDocument();
  });
});
