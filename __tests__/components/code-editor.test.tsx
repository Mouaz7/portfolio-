import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

function ControlledCodeEditor({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <CodeEditor
      value={value}
      aria-label="Code snippet"
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe("CodeEditor", () => {
  it("renders a native editable textarea", () => {
    render(
      <CodeEditor
        value="const x = 1;"
        aria-label="Code snippet"
        placeholder="Write code"
        onChange={jest.fn()}
      />,
    );

    const editor = screen.getByLabelText("Code snippet");
    expect(editor.tagName).toBe("TEXTAREA");
    expect(editor).toHaveValue("const x = 1;");
    expect(editor).toHaveAttribute("placeholder", "Write code");
  });

  it("forwards native changes without rewriting code", () => {
    let receivedValue = "";
    render(
      <CodeEditor
        value="print()"
        aria-label="Code snippet"
        onChange={(event) => {
          receivedValue = event.currentTarget.value;
        }}
      />,
    );

    const editor = screen.getByLabelText("Code snippet");
    fireEvent.change(editor, { target: { value: 'print("Hello")' } });
    expect(receivedValue).toBe('print("Hello")');
  });

  it("keeps quotes, nested delimiters, and indentation exactly as entered", () => {
    const code = 'function run() {\n  if (ready) {\n    return ("ok");\n  }\n}';
    render(<ControlledCodeEditor initialValue={code} />);

    expect(screen.getByLabelText("Code snippet")).toHaveValue(code);
  });

  it("does not intercept native navigation or deletion keys", () => {
    render(
      <CodeEditor
        value="print()"
        aria-label="Code snippet"
        onChange={jest.fn()}
      />,
    );

    const editor = screen.getByLabelText("Code snippet");
    for (const key of [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "Backspace",
      "Delete",
      " ",
    ]) {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
      editor.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });
});
