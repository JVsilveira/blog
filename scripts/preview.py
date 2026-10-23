"""Preview local do export, com MIME correto e página 404 real; sem fallback SPA."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path('out').resolve()

class Preview(SimpleHTTPRequestHandler):
    def list_directory(self, path):
        self.send_error(404)

    def send_error(self, code, message=None, explain=None):
        if code == 404 and (ROOT / '404.html').is_file():
            body = (ROOT / '404.html').read_bytes()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)
        else:
            super().send_error(code, message, explain)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    if not (ROOT / 'index.html').is_file():
        raise SystemExit('Export ausente. Execute npm run build antes do preview.')
    print('Preview local: http://127.0.0.1:4173 (Ctrl+C encerra)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4173), partial(Preview, directory=str(ROOT))).serve_forever()
