# save as serve.py
import http.server
import socketserver
import mimetypes

PORT = 8000

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/webp', '.webp')

Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

print(f"Serving at http://localhost:{PORT}")
httpd.serve_forever()