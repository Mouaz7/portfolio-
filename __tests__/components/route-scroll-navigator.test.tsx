import { fireEvent, render, screen } from "@testing-library/react";
import * as navigation from "next/navigation";
import RouteScrollNavigator, {
  isInteractiveKeyTarget,
} from "@/components/navigation/RouteScrollNavigator";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

describe("RouteScrollNavigator input handling", () => {
  let push: jest.Mock;
  let prefetch: jest.Mock;

  beforeEach(() => {
    push = jest.fn();
    prefetch = jest.fn();
    (navigation.useRouter as jest.Mock).mockReturnValue({
      push,
      prefetch,
    } as unknown as ReturnType<typeof navigation.useRouter>);
    (navigation.usePathname as jest.Mock).mockReturnValue("/");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("ignores Space inside text entry controls", () => {
    render(
      <>
        <RouteScrollNavigator routes={["/", "/skills-page"]} cooldownMs={0} />
        <textarea aria-label="Chat input" />
      </>,
    );

    const chatInput = screen.getByLabelText("Chat input");
    chatInput.focus();
    fireEvent.keyDown(chatInput, { key: " ", code: "Space" });

    expect(push).not.toHaveBeenCalled();
  });

  it("does not hijack global keyboard navigation", () => {
    render(<RouteScrollNavigator routes={["/", "/skills-page"]} cooldownMs={0} />);

    fireEvent.keyDown(document.body, { key: " ", code: "Space" });

    expect(push).not.toHaveBeenCalled();
  });

  it("treats nested interactive targets as protected", () => {
    const button = document.createElement("button");
    const child = document.createElement("span");
    button.appendChild(child);

    expect(isInteractiveKeyTarget(child)).toBe(true);
  });

  it("allows the first deliberate wheel navigation immediately", () => {
    render(<RouteScrollNavigator routes={["/", "/skills-page"]} />);

    fireEvent.wheel(document.body, { deltaY: 140 });

    expect(prefetch).toHaveBeenCalledWith("/skills-page");
    expect(push).toHaveBeenCalledWith("/skills-page");
  });

  it("does not queue duplicate route pushes while navigation is pending", () => {
    render(
      <RouteScrollNavigator
        routes={["/", "/skills-page"]}
        cooldownMs={0}
        wheelThreshold={100}
      />,
    );

    fireEvent.wheel(document.body, { deltaY: 120 });
    fireEvent.wheel(document.body, { deltaY: 120 });

    expect(push).toHaveBeenCalledTimes(1);
  });
});
