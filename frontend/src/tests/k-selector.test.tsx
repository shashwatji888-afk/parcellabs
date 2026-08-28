import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KSelector } from "@/components/segmentation/k-selector";

describe("KSelector", () => {
  it("renders K buttons from 2 to 10 and marks selected and recommended K", () => {
    const onSelectK = vi.fn();
    render(
      <KSelector
        selectedK={3}
        recommendedK={3}
        onSelectK={onSelectK}
        isLoading={false}
      />
    );

    for (let k = 2; k <= 10; k++) {
      expect(screen.getByRole("button", { name: new RegExp(`K = ${k}`) })).toBeInTheDocument();
    }

    expect(screen.getByText(/Recommended: K = 3/)).toBeInTheDocument();
  });

  it("calls onSelectK when a new K button is clicked", () => {
    const onSelectK = vi.fn();
    render(
      <KSelector
        selectedK={3}
        recommendedK={3}
        onSelectK={onSelectK}
        isLoading={false}
      />
    );

    const k4Button = screen.getByRole("button", { name: /K = 4/ });
    fireEvent.click(k4Button);
    expect(onSelectK).toHaveBeenCalledWith(4);
  });

  it("disables buttons when isLoading is true", () => {
    const onSelectK = vi.fn();
    render(
      <KSelector
        selectedK={3}
        recommendedK={3}
        onSelectK={onSelectK}
        isLoading={true}
      />
    );

    const k4Button = screen.getByRole("button", { name: /K = 4/ });
    expect(k4Button).toBeDisabled();
  });
});
