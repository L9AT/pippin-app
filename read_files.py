
import os
import json

files_to_read = [
    "index.html", "explore.html", "about.html", "apply.html", "collab.html", "collabs.html", "nft.html",
    "admin-dashboard.html", "admin-login.html", "style.css", "collab.css", "collabs.css", "main.js",
    "collab.js", "collabs.js", "apply.js", "admin.js", "supabase-config.js", "vercel.json", ".gitignore",
    "package.json"
]

results = []
for f in files_to_read:
    path = os.path.join(r"c:\Users\mohamed\Desktop\New folder", f)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as file:
            results.append({"path": f, "content": file.read()})

print(json.dumps(results))
