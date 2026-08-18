import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Biography } from "./Biography";

describe("Biography", () => {
  it("renders one paragraph per entry", () => {
    const { container } = render(
      <Biography paragraphs={["first paragraph", "second paragraph"]} />,
    );
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("first paragraph")).toBeTruthy();
    expect(screen.getByText("second paragraph")).toBeTruthy();
  });

  it("renders nothing when there are no paragraphs", () => {
    const { container } = render(<Biography paragraphs={[]} />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});
