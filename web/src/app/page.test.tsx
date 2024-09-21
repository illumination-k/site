import React from "react";

import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Page from "./page";

test("Page", () => {
  render(<Page />);
  const headings = screen.getAllByRole("heading");

  expect(headings).toBeTruthy();
});
