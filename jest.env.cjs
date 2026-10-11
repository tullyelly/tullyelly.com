// Unit tests exercise database behavior through mocks. A parent's build-only
// flag must not silently replace those paths with empty/disabled responses.
// Individual tests can still enable SKIP_DB to exercise the escape hatch.
process.env.SKIP_DB = "false";
