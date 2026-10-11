"""Extract a checksum-bound, credential-free build without escaping its output root."""
import pathlib
import posixpath
import sys
import tarfile


def extract(archive: str, directory: str) -> None:
    root = pathlib.Path(directory).resolve()
    if root.exists() and any(root.iterdir()):
        raise ValueError("maintenance.archive-directory-not-empty")
    root.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "r:") as bundle:
        names = set()
        for member in bundle.getmembers():
            name = posixpath.normpath(member.name)
            if (
                member.name.startswith("/")
                or ".." in pathlib.PurePosixPath(member.name).parts
                or not (name == ".vercel/output" or name.startswith(".vercel/output/"))
                or name in names
                or not (member.isfile() or member.isdir() or member.issym() or member.islnk())
            ):
                raise ValueError("maintenance.archive-member")
            names.add(name)
            if member.issym() or member.islnk():
                target = posixpath.normpath(
                    posixpath.join(posixpath.dirname(name), member.linkname)
                    if member.issym() else member.linkname
                )
                if member.linkname.startswith("/") or not target.startswith(".vercel/output/"):
                    raise ValueError("maintenance.archive-link")
        # Python's data filter additionally rejects chained link escapes and special files.
        bundle.extractall(root, filter="data")


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("maintenance.archive-arguments")
        extract(sys.argv[1], sys.argv[2])
    except Exception:
        print("Maintenance archive validation failed; extraction stopped", file=sys.stderr)
        sys.exit(1)
