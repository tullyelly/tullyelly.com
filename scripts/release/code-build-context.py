"""Exclude only reviewed env templates while building a disposable checkout."""
import os
import pathlib
import signal
import subprocess
import sys
import tempfile

EXAMPLES = (".env.example", ".env.test.example")


def build(root: pathlib.Path) -> int:
    # Never exclude unexpected env files, symlinks, directories or modified templates.
    for path in root.iterdir():
        if path.name.startswith(".env") and path.name not in EXAMPLES:
            raise ValueError("code.build-local-env-present")
    for name in EXAMPLES:
        path = root / name
        if path.is_symlink() or not path.is_file():
            raise ValueError("code.build-example-unreviewed")
        reviewed = subprocess.run(
            ["git", "show", f"HEAD:{name}"], cwd=root,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False,
        )
        if reviewed.returncode or path.read_bytes() != reviewed.stdout:
            raise ValueError("code.build-example-unreviewed")

    child = None
    previous = {}

    def interrupted(_number, _frame):
        raise InterruptedError()

    # A sibling keeps atomic renames on the checkout filesystem and stays outside tracing.
    temporary = tempfile.mkdtemp(prefix=".code-build-examples-", dir=root.parent)
    try:
        try:
            for number in (signal.SIGINT, signal.SIGTERM):
                previous[number] = signal.signal(number, interrupted)
            for name in EXAMPLES:
                (root / name).rename(pathlib.Path(temporary) / name)
            child = subprocess.Popen(
                ["vercel", "build", "--prod", "--standalone", "--non-interactive"],
                cwd=root, start_new_session=True,
            )
            return child.wait()
        finally:
            # Ignore a repeated cancellation while restoring the disposable checkout.
            for number in previous:
                signal.signal(number, signal.SIG_IGN)
            try:
                try:
                    if child is not None and child.poll() is None:
                        try:
                            os.killpg(child.pid, signal.SIGTERM)
                        except ProcessLookupError:
                            pass
                        try:
                            child.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            try:
                                os.killpg(child.pid, signal.SIGKILL)
                            except ProcessLookupError:
                                pass
                            child.wait()
                finally:
                    restoration_failed = False
                    for name in EXAMPLES:
                        source = pathlib.Path(temporary) / name
                        if not source.exists():
                            continue
                        try:
                            source.rename(root / name)
                        except OSError:
                            restoration_failed = True
                    if restoration_failed:
                        # Keep any unrecovered originals; never delete them on I/O failure.
                        raise ValueError("code.build-context-restore-failed")
            finally:
                for number, handler in previous.items():
                    signal.signal(number, handler)

    finally:
        if not any(pathlib.Path(temporary).iterdir()):
            pathlib.Path(temporary).rmdir()


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("code.build-context-arguments")
        sys.exit(build(pathlib.Path(sys.argv[1]).resolve()))
    except InterruptedError:
        print("code.build-interrupted", file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        allowed = {"code.build-local-env-present", "code.build-example-unreviewed", "code.build-context-arguments", "code.build-context-restore-failed"}
        message = str(error) if isinstance(error, ValueError) and str(error) in allowed else "code.build-context-failed"
        print(message, file=sys.stderr)
        sys.exit(1)
