const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    originalError(...args);
    const [message] = args;
    if (typeof message === "string") {
      if (
        message.includes("Warning: ReactDOM.render is no longer supported") ||
        message.includes("Warning: useLayoutEffect does nothing on the server")
      ) {
        return;
      }
    }
    const joined = args.map((value) => String(value)).join(" ");
    throw new Error(`Console error during tests: ${joined}`);
  };
});

afterAll(() => {
  console.error = originalError;
});
