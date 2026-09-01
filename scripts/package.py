import os
import zipfile
import fnmatch

output_filename = "Sankat-Setu-Frontend-Lightweight-FINAL.zip"
exclude_dirs = {
    "node_modules", ".next", ".turbo", "coverage", "test-results", 
    "playwright-report", ".venv", "venv", "__pycache__", ".pytest_cache", 
    "build", "dist", ".git"
}
exclude_files = {
    ".env.local", ".DS_Store"
}
exclude_ext = {".zip"}

with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk("."):
        # modify dirs in place to prune traversal
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            if any(file.endswith(ext) for ext in exclude_ext):
                continue
            
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, ".")
            zipf.write(filepath, arcname)

print(f"Created {output_filename} successfully.")
