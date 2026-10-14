"""Reject nonportable output and build-only credentials before archiving and after extraction."""
import hashlib
import importlib.util
import json
import pathlib
import sys

sys.dont_write_bytecode = True

MARKERS = (
    b"CODE_RELEASE_BUILD_ONLY_SECRET",
    b"CODE_RELEASE_BUILD_ONLY_CLIENT",
    b"CODE_RELEASE_BUILD_ONLY_GOOGLE",
)


def verify(directory: str, expected_binding=None) -> None:
    root = pathlib.Path(directory).resolve()
    config = json.loads((root / "config.json").read_text())
    if config.get("version") != 3:
        raise ValueError("code.artifact-config")
    if expected_binding is not None:
        try:
            binding = json.loads((root / ".release-build.json").read_text())
        except Exception:
            raise ValueError("code.artifact-binding") from None
        if expected_binding.get("target") != "production" or binding != expected_binding:
            raise ValueError("code.artifact-binding")
    for path in root.rglob("*"):
        if path.is_symlink():
            resolved = path.resolve(strict=True)
            if not resolved.is_relative_to(root):
                raise ValueError("code.artifact-external-link")
        if not path.is_file():
            continue
        if path.name.startswith(".env"):
            raise ValueError("code.artifact-env-file")
        # Scan streaming chunks with overlap; never print source bytes or values.
        with path.open("rb") as stream:
            tail = b""
            while True:
                block = stream.read(1024 * 1024)
                if not block:
                    break
                content = tail + block
                if any(marker in content for marker in MARKERS):
                    raise ValueError("code.artifact-build-value")
                tail = content[-128:]
        if path.name == ".vc-config.json":
            value = json.loads(path.read_text())
            if "handler" in value:
                handler = (path.parent / value["handler"]).resolve()
                if not handler.is_relative_to(root) or not handler.is_file():
                    raise ValueError("code.artifact-handler")
            for key in ("environment", "env"):
                env = value.get(key, {})
                if not isinstance(env, dict):
                    raise ValueError("code.artifact-runtime-env")
                if any(k in env for k in ("SKIP_DB", "DATABASE_URL", "TEST_DATABASE_URL", "NEXTAUTH_SECRET", "GOOGLE_CLIENT_SECRET")):
                    raise ValueError("code.artifact-runtime-env")
                if "ANALYTICS_SYNC_ENABLED" in env and env["ANALYTICS_SYNC_ENABLED"] != "false":
                    raise ValueError("code.artifact-analytics-enabled")


def extract(archive: str, directory: str, expected_digest: str, expected_binding=None) -> None:
    if len(expected_digest) != 64 or any(c not in "0123456789abcdef" for c in expected_digest):
        raise ValueError("code.artifact-digest-format")
    digest = hashlib.sha256()
    with open(archive, "rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    if digest.hexdigest() != expected_digest:
        raise ValueError("code.artifact-digest")
    spec = importlib.util.spec_from_file_location("safe_archive", pathlib.Path(__file__).with_name("maintenance-archive.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.extract(archive, directory)
    verify(str(pathlib.Path(directory) / ".vercel/output"), expected_binding)


if __name__ == "__main__":
    try:
        if len(sys.argv) == 3 and sys.argv[1] == "verify":
            verify(sys.argv[2])
        elif len(sys.argv) == 4 and sys.argv[1] == "verify":
            verify(sys.argv[2], json.loads(sys.argv[3]))
        elif len(sys.argv) == 5 and sys.argv[1] == "extract":
            extract(sys.argv[2], sys.argv[3], sys.argv[4])
        elif len(sys.argv) == 6 and sys.argv[1] == "extract":
            extract(sys.argv[2], sys.argv[3], sys.argv[4], json.loads(sys.argv[5]))
        else:
            raise ValueError("code.artifact-arguments")
    except Exception as error:
        allowed = {
            "code.artifact-config", "code.artifact-external-link",
            "code.artifact-env-file", "code.artifact-build-value",
            "code.artifact-handler", "code.artifact-runtime-env",
            "code.artifact-analytics-enabled", "code.artifact-digest-format",
            "code.artifact-digest", "code.artifact-arguments", "code.artifact-binding",
            "maintenance.archive-directory-not-empty", "maintenance.archive-member",
            "maintenance.archive-link", "maintenance.archive-arguments",
        }
        invariant = str(error) if isinstance(error, ValueError) and str(error) in allowed else "code.artifact-validation-failed"
        print(f"Code-only artifact validation failed: {invariant}; values omitted", file=sys.stderr)
        sys.exit(1)
