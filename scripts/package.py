import os
import zipfile
import fnmatch

output_filename = "Sankat-Setu-Frontend-Lightweight-FINAL.zip"
exclude_dirs = {
    "node_modules", ".next", ".turbo", "coverage", "test-results", 
    ".venv", "venv", "__pycache__", ".pytest_cache", 
    "build", "dist", ".git", "logs", "screenshots", ".idea", ".vscode"
}
exclude_files = {
    ".DS_Store", "secrets.json", ".env"
}
exclude_patterns = ["*.env.*", "*.env", "*secrets*", "*browser_binaries*"]
exclude_ext = {".zip"}

def should_exclude_file(filename):
    if filename in exclude_files:
        return True
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(filename, pattern):
            return True
    return False

with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk("."):
        # modify dirs in place to prune traversal
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if should_exclude_file(file):
                continue
            if any(file.endswith(ext) for ext in exclude_ext):
                continue
            
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, ".")
            zipf.write(filepath, arcname)

print(f"Created {output_filename} successfully.")
