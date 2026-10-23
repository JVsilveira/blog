"""Auditoria offline dos links, âncoras e assets do HTML final. Não acessa terceiros."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote, urljoin
import gzip

root = Path('out').resolve()
errors = []
pages = {}

class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for attr in ('href', 'src'):
            if attr in attrs:
                self.refs.append((tag, attr, attrs[attr]))

for file in sorted(root.rglob('*.html')):
    doc = Document()
    doc.feed(file.read_text())
    pages[file] = doc
if not pages:
    raise SystemExit('Export ausente: execute npm run build.')
for file, doc in pages.items():
    relative = file.relative_to(root).as_posix()
    base = '/' + (relative[:-10] if relative.endswith('index.html') else relative)
    for tag, attr, ref in doc.refs:
        url = urlsplit(urljoin('http://preview.local' + base, ref))
        if url.scheme not in ('http', 'https'):
            errors.append(f'{relative}: esquema não permitido em {tag}.{attr}')
            continue
        if url.netloc != 'preview.local':
            if tag != 'a':
                errors.append(f'{relative}: recurso externo {tag}.{attr}')
            continue
        target = (root / unquote(url.path).lstrip('/')).resolve()
        if not target.is_relative_to(root):
            errors.append(f'{relative}: caminho fora do export')
            continue
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.append(f'{relative}: destino ausente {ref}')
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{relative}: âncora ausente {ref}')
        if tag == 'a' and ref in ('', '#'):
            errors.append(f'{relative}: link sem destino')
js = list(root.rglob('*.js'))
images = [f for f in root.rglob('*') if f.suffix in ('.png', '.jpg', '.webp', '.avif', '.svg')]
print(f'{len(pages)} HTML; {len(js)} arquivos JS; JS total gzip individual: {sum(len(gzip.compress(f.read_bytes())) for f in js)} bytes; imagens: {sum(f.stat().st_size for f in images)} bytes.')
if errors:
    raise SystemExit('\n'.join(errors))
print('Links, âncoras e recursos locais presentes; nenhum recurso HTML externo. Não verifica conteúdo remoto, execução JS ou aprovação editorial.')
