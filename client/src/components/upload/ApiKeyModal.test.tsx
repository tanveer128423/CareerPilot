import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApiKeyModal } from "./ApiKeyModal";

describe("ApiKeyModal", () => {
  it("renders the key input and a help section", () => {
    render(<ApiKeyModal open onClose={() => {}} onContinue={() => {}} />);
    expect(screen.getByLabelText(/Gemini API key/i)).toBeInTheDocument();
    expect(screen.getByText(/How do I get an API key/i)).toBeInTheDocument();
  });

  it("disables Continue until a key is entered", () => {
    render(<ApiKeyModal open onClose={() => {}} onContinue={() => {}} />);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Gemini API key/i), { target: { value: "my-key" } });
    expect(cont).not.toBeDisabled();
  });

  it("calls onContinue with the trimmed key", () => {
    const onContinue = vi.fn();
    render(<ApiKeyModal open onClose={() => {}} onContinue={onContinue} />);
    fireEvent.change(screen.getByLabelText(/Gemini API key/i), { target: { value: "  abc123  " } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledWith("abc123");
  });

  it("does not render when closed", () => {
    render(<ApiKeyModal open={false} onClose={() => {}} onContinue={() => {}} />);
    expect(screen.queryByLabelText(/Gemini API key/i)).not.toBeInTheDocument();
  });

  it("reveals the step-by-step help when the help toggle is clicked", () => {
    render(<ApiKeyModal open onClose={() => {}} onContinue={() => {}} />);
    fireEvent.click(screen.getByText(/How do I get an API key/i));
    expect(screen.getByText(/aistudio\.google\.com/i)).toBeInTheDocument();
  });
});
