import http.server
import socketserver
import os

PORT = 8000

class PDFRoutingHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Allow specific PDF path
        if self.path.startswith('/2026-mar-halltickets/certificate-generation-mar26/final/regular/noc26-cs67/') and self.path.endswith('.pdf'):
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        # Redirect everything else
        self.send_response(301)
        self.send_header('Location', 'https://nptel.ac.in/')
        self.end_headers()

print(f"Server started at http://localhost:{PORT}")
print("You can now visit http://localhost:8000/2026-mar-halltickets/certificate-generation-mar26/final/regular/noc26-cs67/NOC26CS67S280403888.pdf")

with socketserver.TCPServer(("", PORT), PDFRoutingHandler) as httpd:
    httpd.serve_forever()
