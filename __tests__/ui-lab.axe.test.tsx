import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import DemoLab from "@/app/ui-lab/DemoLab";

expect.extend(toHaveNoViolations);

test("ui lab has no obvious accessibility violations", async () => {
  const { container } = render(<DemoLab />);
  const results = await axe(container, {
    rules: {
      "landmark-contentinfo-is-top-level": { enabled: false },
    },
  });
  expect(results).toHaveNoViolations();
});

