#!/usr/bin/env python3
import http.server
import socketserver
import os
import mimetypes
from http.server import SimpleHTTPRequestHandler

# Add proper MIME types for modern web files
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.jsx')
mimetypes.add_type('application/javascript', '.ts')
mimetypes.add_type('application/javascript', '.tsx')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow all origins
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def guess_type(self, path):
        """Override to handle TypeScript files properly"""
        result = super().guess_type(path)
        path_str = str(path)
        if path_str.endswith('.tsx') or path_str.endswith('.ts') or path_str.endswith('.jsx'):
            return 'application/javascript'
        return result
    
    def do_GET(self):
        # Serve index.html for all routes (SPA routing)
        if self.path != '/' and not os.path.exists(self.path.lstrip('/')):
            self.path = '/index.html'
        return super().do_GET()

PORT = 3000
Handler = MyHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"ORACLE LEND DeFi Protocol serving at port {PORT}")
    print(f"Access your app at: http://localhost:{PORT}")
    httpd.serve_forever()