#!/usr/bin/env python3

"""
Safe patch application script with automatic rollback on failure.

This script attempts to apply a patch and automatically reverts changes if the patch fails.
It creates a git checkpoint before applying the patch, so you can safely experiment with patches.

Usage:
    python3 scripts/safe-patch.py <patch_file> [--version VERSION --release RELEASE]

Examples:
    python3 scripts/safe-patch.py patches/network-patches.patch
    python3 scripts/safe-patch.py patches/librewolf/search-config.patch --version 144.0.2 --release bluetaka.26
"""

import argparse
import os
import subprocess
import sys

# Add scripts directory to path for imports
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

from _mixin import find_src_dir, temp_cd


class Colors:
    """ANSI color codes for terminal output"""

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    END = "\033[0m"


def print_step(message: str, color=Colors.BLUE):
    """Print a colored step message"""
    print(f"\n{color}{Colors.BOLD}▶ {message}{Colors.END}")
    sys.stdout.flush()


def print_success(message: str):
    """Print a success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")
    sys.stdout.flush()


def print_error(message: str):
    """Print an error message"""
    print(f"{Colors.RED}✗ {message}{Colors.END}", file=sys.stderr)
    sys.stdout.flush()


def print_warning(message: str):
    """Print a warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")
    sys.stdout.flush()


def is_git_repo() -> bool:
    """Check if current directory is a git repository"""
    return os.path.exists(".git")


def get_current_git_ref() -> str:
    """Get current git commit hash"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return ""


def is_patch_applied(patch_file: str) -> bool:
    """Check if a patch is already applied using dry-run"""
    # Try normal application
    result = subprocess.run(
        ["patch", "-p1", "--dry-run", "--force", "--silent", "-i", patch_file],
        capture_output=True,
    )

    if result.returncode == 0:
        # Patch can be applied normally
        return False

    # Check if reverse would work (meaning it's already applied)
    result = subprocess.run(
        ["patch", "-p1", "-R", "--dry-run", "--force", "--silent", "-i", patch_file],
        capture_output=True,
    )

    return result.returncode == 0


def create_checkpoint(tag_name: str = "safe-patch-checkpoint") -> str:
    """Create a git checkpoint and return the commit hash"""
    print_step(f"Creating checkpoint: {tag_name}")

    # Commit any uncommitted changes
    subprocess.run(["git", "add", "-A"], check=False)
    subprocess.run(
        [
            "git",
            "commit",
            "-m",
            f"[safe-patch] Checkpoint before applying patch",
            "-a",
            "--allow-empty",
        ],
        capture_output=True,
        check=False,
    )

    # Tag the checkpoint
    subprocess.run(["git", "tag", "-f", tag_name], capture_output=True, check=True)

    commit_hash = get_current_git_ref()
    print_success(f"Checkpoint created at {commit_hash[:8]}")
    return commit_hash


def apply_patch(patch_file: str) -> bool:
    """
    Try to apply a patch using git apply or patch command
    Returns True if successful, False otherwise
    """
    print_step(f"Applying patch: {patch_file}")

    # Try git apply first (more robust with 3-way merge)
    print("Attempting with git apply --3way...")
    result = subprocess.run(
        ["git", "apply", "--3way", "--whitespace=fix", patch_file],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        print_success("Patch applied successfully with git apply")
        return True
    else:
        print_warning("git apply failed, trying patch command with fuzz...")

    # Fall back to patch command with fuzz tolerance
    result = subprocess.run(
        ["patch", "-p1", "--fuzz=2", "--forward", "-i", patch_file],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        print_success("Patch applied successfully with patch command")
        return True

    # Check for .rej files (rejected hunks)
    result = subprocess.run(
        ["find", ".", "-name", "*.rej", "-type", "f"], capture_output=True, text=True
    )

    if result.stdout.strip():
        print_error("Patch failed with rejected hunks:")
        print(result.stdout)

        # Show the content of rejected files
        rej_files = result.stdout.strip().split("\n")
        for rej_file in rej_files[:3]:  # Show first 3
            print(f"\n{Colors.YELLOW}--- {rej_file} ---{Colors.END}")
            try:
                with open(rej_file, "r") as f:
                    print(f.read()[:500])  # First 500 chars
            except:
                pass

        return False

    print_error("Patch application failed")
    return False


def revert_to_checkpoint(commit_hash: str, tag_name: str = "safe-patch-checkpoint"):
    """Revert to a previous git checkpoint"""
    print_step(f"Reverting to checkpoint: {commit_hash[:8]}")

    # Reset to checkpoint
    result = subprocess.run(
        ["git", "reset", "--hard", tag_name], capture_output=True, text=True
    )

    if result.returncode != 0:
        print_error(f"Failed to revert to checkpoint: {result.stderr}")
        sys.exit(1)

    # Clean any untracked files (like .rej files)
    subprocess.run(["git", "clean", "-fd"], capture_output=True)

    print_success("Successfully reverted to checkpoint")


def cleanup_rej_files():
    """Remove all .rej files from failed patch attempts"""
    result = subprocess.run(
        ["find", ".", "-name", "*.rej", "-type", "f", "-delete"], capture_output=True
    )
    if result.returncode == 0:
        print_success("Cleaned up .rej files")


def main():
    parser = argparse.ArgumentParser(
        description="Safely apply a patch with automatic rollback on failure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("patch_file", help="Path to the patch file to apply")
    parser.add_argument("--version", help="Camoufox version (e.g., 144.0.2)")
    parser.add_argument("--release", help="Camoufox release (e.g., bluetaka.26)")
    parser.add_argument(
        "--no-revert",
        action="store_true",
        help="Don't automatically revert on failure (leave changes for inspection)",
    )
    parser.add_argument(
        "--checkpoint-tag",
        default="safe-patch-checkpoint",
        help="Name for the checkpoint tag (default: safe-patch-checkpoint)",
    )

    args = parser.parse_args()

    # Validate patch file exists
    patch_file = os.path.abspath(args.patch_file)
    if not os.path.exists(patch_file):
        print_error(f"Patch file not found: {patch_file}")
        sys.exit(1)

    # Find source directory
    try:
        if args.version and args.release:
            src_dir = find_src_dir(".", args.version, args.release)
        else:
            src_dir = find_src_dir(".")
    except (AssertionError, FileNotFoundError) as e:
        print_error(f"Could not find Camoufox source directory: {e}")
        print_warning("Have you run 'make setup' yet?")
        sys.exit(1)

    print(f"{Colors.BOLD}Safe Patch Application{Colors.END}")
    print(f"Source dir: {src_dir}")
    print(f"Patch file: {os.path.basename(patch_file)}")

    # Change to source directory
    with temp_cd(src_dir):
        # Check if it's a git repo
        if not is_git_repo():
            print_error("Source directory is not a git repository")
            print_warning("Run 'make setup' to initialize the git repository")
            sys.exit(1)

        # Check if patch is already applied
        relative_patch = os.path.relpath(patch_file, os.getcwd())
        if is_patch_applied(relative_patch):
            print_warning("Patch appears to be already applied")
            response = input("Continue anyway? [y/N]: ").strip().lower()
            if response not in ["y", "yes"]:
                print("Aborted")
                sys.exit(0)

        # Create checkpoint before applying
        checkpoint_hash = create_checkpoint(args.checkpoint_tag)

        # Try to apply the patch
        success = apply_patch(relative_patch)

        if success:
            print_success(f"\n{Colors.BOLD}Patch applied successfully!{Colors.END}")
            print(f"\nTo revert this patch later, run:")
            print(f"  cd {src_dir}")
            print(f"  git reset --hard {args.checkpoint_tag}")
            sys.exit(0)
        else:
            print_error(f"\n{Colors.BOLD}Patch application failed!{Colors.END}")

            if args.no_revert:
                print_warning("Changes left in place for inspection (--no-revert flag)")
                print(f"\nTo revert manually, run:")
                print(f"  cd {src_dir}")
                print(f"  git reset --hard {args.checkpoint_tag}")
                print(f"  git clean -fd")
                sys.exit(1)
            else:
                # Automatically revert
                revert_to_checkpoint(checkpoint_hash, args.checkpoint_tag)
                cleanup_rej_files()
                print(
                    f"\n{Colors.YELLOW}Repository restored to previous state{Colors.END}"
                )
                sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_error("\n\nInterrupted by user")
        sys.exit(130)
    except Exception as e:
        print_error(f"\nUnexpected error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
