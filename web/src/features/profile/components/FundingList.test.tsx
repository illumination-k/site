import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FundingList } from "./FundingList";

describe("FundingList", () => {
  it("renders the title, funder, type and grant number", () => {
    render(
      <FundingList
        fundings={[
          {
            title: "Gibberellin signalling in land plants",
            organizationName: "Japan Society for the Promotion of Science",
            type: "grant",
            grantNumber: "21J15550",
            startDate: "2021-04",
            endDate: "2023-03",
          },
        ]}
        presentLabel="Present"
      />,
    );

    expect(
      screen.getByText("Gibberellin signalling in land plants"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Japan Society for the Promotion of Science / grant / 21J15550",
      ),
    ).toBeTruthy();
    expect(screen.getByText("2021-04 — 2023-03")).toBeTruthy();
  });

  it("links the title when the funding has a url", () => {
    render(
      <FundingList
        fundings={[
          {
            title: "Linked grant",
            organizationName: "JSPS",
            url: "https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-21J15550/",
          },
        ]}
        presentLabel="Present"
      />,
    );

    const link = screen.getByText("Linked grant").closest("a");
    expect(link?.getAttribute("href")).toBe(
      "https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-21J15550/",
    );
  });

  it("falls back to the present label when the end date is missing", () => {
    render(
      <FundingList
        fundings={[
          {
            title: "Ongoing grant",
            organizationName: "JSPS",
            startDate: "2024-04",
          },
        ]}
        presentLabel="現在"
      />,
    );

    expect(screen.getByText("2024-04 — 現在")).toBeTruthy();
  });
});
