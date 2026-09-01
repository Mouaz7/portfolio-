import { act, renderHook } from "@testing-library/react";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";

describe("useMinimumLoading", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps a completed load visible long enough to perceive the animation", () => {
    const { result } = renderHook(() => useMinimumLoading());

    act(() => {
      result.current.finishLoading();
      jest.advanceTimersByTime(399);
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.loading).toBe(false);
  });

  it("does not introduce a loader when server data is already available", () => {
    const { result } = renderHook(() => useMinimumLoading(400, false));

    expect(result.current.loading).toBe(false);
  });
});
