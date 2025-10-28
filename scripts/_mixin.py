#!/usr/bin/env python3

"""
Common functions used across the Camoufox build system.
Not meant to be called directly.
"""

import contextlib
import fnmatch
import optparse
import os
import re
import sys
import time

start_time = time.time()


@contextlib.contextmanager
def temp_cd(path):
    """Temporarily change to a different working directory"""
    _old_cwd = os.getcwd()
    abs_path = os.path.abspath(path)
    assert os.path.exists(abs_path), f'{abs_path} does not exist.'
    os.chdir(abs_path)

    try:
        yield
    finally:
        os.chdir(_old_cwd)


def get_options():
    """Get options"""
    parser = optparse.OptionParser()
    parser.add_option('--mozconfig-only', dest='mozconfig_only', default=False, action="store_true")
    parser.add_option(
        '-P', '--no-settings-pane', dest='settings_pane', default=True, action="store_false"
    )
    return parser.parse_args()


def find_src_dir(root_dir='.', version=None, release=None):
    """Get the source directory"""
    if version and release:
        name = os.path.join(root_dir, f'camoufox-{version}-{release}')
        assert os.path.exists(name), f'{name} does not exist.'
        return name
    folders = os.listdir(root_dir)
    for folder in folders:
        if os.path.isdir(folder) and folder.startswith('camoufox-'):
            return os.path.join(root_dir, folder)
    raise FileNotFoundError('No camoufox-* folder found')


def get_moz_target(target, arch):
    """Get moz_target from target and arch"""
    if target == "linux":
        return "aarch64-unknown-linux-gnu" if arch == "arm64" else f"{arch}-pc-linux-gnu"
    if target == "windows":
        return f"{arch}-pc-mingw32"
    if target == "macos":
        return "aarch64-apple-darwin" if arch == "arm64" else f"{arch}-apple-darwin"
    raise ValueError(f"Unsupported target: {target}")


def list_files(root_dir, suffix):
    """List files in a directory"""
    for root, _, files in os.walk(root_dir):
        for file in fnmatch.filter(files, suffix):
            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, root_dir)
            yield os.path.join(root_dir, relative_path).replace('\\', '/')


def list_patches(root_dir='../patches', suffix='*.patch'):
    """List all patch files"""
    return sorted(list_files(root_dir, suffix), key=os.path.basename)

def is_bootstrap_patch(name):
    return bool(re.match(r'\d+\-.*', os.path.basename(name)))


def script_exit(statuscode):
    """Exit the script"""
    if (time.time() - start_time) > 60:
        # print elapsed time
        elapsed = time.strftime("%H:%M:%S", time.gmtime(time.time() - start_time))
        print(f"\n\aElapsed time: {elapsed}")
        sys.stdout.flush()

    sys.exit(statuscode)


def run(cmd, exit_on_fail=True, do_print=True):
    """Run a command"""
    if not cmd:
        return
    if do_print:
        print(cmd)
        sys.stdout.flush()
    retval = os.system(cmd)
    if retval != 0 and exit_on_fail:
        print(f"fatal error: command '{cmd}' failed")
        sys.stdout.flush()
        script_exit(1)
    return retval


def patch(patchfile, reverse=False, silent=False, fuzz=2):
    """Run a patch file with git or patch command

    Args:
        patchfile: Path to patch file
        reverse: Apply in reverse
        silent: Suppress output
        fuzz: Maximum fuzz factor (lines of context that can be off)
    """
    # Check if patch is already applied (dry-run test)
    if not reverse:
        dry_run_cmd = f"patch -p1 --dry-run --force --silent -i {patchfile}"
        retval = run(dry_run_cmd, exit_on_fail=False, do_print=False)
        if retval != 0:
            # Patch already applied or will fail - check if reversed would work
            reverse_test = f"patch -p1 -R --dry-run --force --silent -i {patchfile}"
            reverse_retval = run(reverse_test, exit_on_fail=False, do_print=False)
            if reverse_retval == 0:
                if not silent:
                    print(f"\n*** Skipping {patchfile} (already applied)")
                return

    # Check if we're in a git repo
    is_git_repo = os.path.exists(".git")

    if is_git_repo and not reverse:
        # Try git apply first (more robust)
        cmd = f"git apply --3way --whitespace=fix {patchfile}"
        if silent:
            cmd += " 2>/dev/null"
        else:
            print(f"\n*** -> {cmd}")
        sys.stdout.flush()

        retval = run(cmd, exit_on_fail=False, do_print=not silent)
        if retval == 0:
            return

        # Git apply failed, fall back to patch with fuzz
        if not silent:
            print(f"Git apply failed, trying patch with fuzz={fuzz}")

    # Use traditional patch command with fuzz tolerance
    if reverse:
        cmd = f"patch -p1 -R --fuzz={fuzz} -i {patchfile}"
    else:
        # --forward flag prevents prompting on already-applied patches
        # Note: BSD patch (macOS) doesn't support --reject-format
        cmd = f"patch -p1 --fuzz={fuzz} --forward -i {patchfile}"

    if silent:
        cmd += " > /dev/null 2>&1"
    else:
        print(f"\n*** -> {cmd}")
    sys.stdout.flush()

    # Run patch and check result
    retval = run(cmd, exit_on_fail=False, do_print=not silent)

    # If patch failed, check if it's because hunks were already applied
    if retval != 0:
        # Quick check for .rej files using find (faster than glob on large dirs)
        find_cmd = "find . -name '*.rej' -type f -print -quit"
        find_result = run(find_cmd, exit_on_fail=False, do_print=False)

        if find_result == 0:
            # Found at least one .rej file - this is a real error
            print(f"\n⚠️  Error: Patch {patchfile} had rejected hunks")
            # Show the .rej files
            run("find . -name '*.rej' -type f", exit_on_fail=False, do_print=True)
            print(f"fatal error: command '{cmd}' failed")
            sys.stdout.flush()
            script_exit(1)
        else:
            # No .rej files means all hunks were already applied - that's OK
            if not silent:
                print(f"Note: All hunks in {patchfile} were already applied or skipped")
            return


__all__ = [
    'get_moz_target',
    'list_patches',
    'patch',
    'run',
    'script_exit',
    'temp_cd',
    'get_options',
]


if __name__ == '__main__':
    print('This is a module, not meant to be called directly.')
    sys.exit(1)
