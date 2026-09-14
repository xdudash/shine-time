"""Package only the production React build for deployment into public_html/app."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parents[1]
source = root / 'dist-v6'
files = ['.htaccess', 'index.php', 'config/supabase.php', 'assets/platform.js', 'assets/platform.css']
output = root / 'artifacts' / 'Shine_Time_v6_app.zip'
output.parent.mkdir(exist_ok=True)
checksums = {}
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        data = (source / name).read_bytes()
        checksums[name] = hashlib.sha256(data).hexdigest()
        archive.writestr(name, data)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert sorted(archive.namelist()) == sorted(files)
(root / 'artifacts' / 'v6-checksums.json').write_text(json.dumps(checksums, indent=2) + '\n')
print(f'Packaged and checked {len(files)} files: {output}')
